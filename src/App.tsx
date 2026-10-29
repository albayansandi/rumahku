import React, { useState, useEffect, useCallback } from 'react';
import { db, seedInitialDataIfNeeded } from './lib/db/database';
import { 
  Project, 
  ProjectImage, 
  MaterialCategory, 
  Material, 
  Purchase, 
  FinancialTransaction,
  MaterialCalculated,
  PurchaseWithPayment,
  ProjectFinancialSummary
} from './types';
import { 
  calculateMaterialMetrics, 
  calculatePurchasePayment, 
  calculateProjectFinancialSummary 
} from './lib/calculations/financial';
import { syncEngine } from './lib/sync/syncEngine';

// Components
import { Navbar } from './components/layout/Navbar';
import { BottomNavigation, TabType } from './components/layout/BottomNavigation';
import { Sidebar } from './components/layout/Sidebar';
import { ProjectBanner } from './components/dashboard/ProjectBanner';
import { ProjectInfoCard } from './components/dashboard/ProjectInfoCard';
import { FinancialCards } from './components/dashboard/FinancialCards';
import { RecentActivity } from './components/dashboard/RecentActivity';
import { MaterialList } from './components/materials/MaterialList';
import { FinanceDashboard } from './components/finances/FinanceDashboard';
import { StoreExplorePage } from './components/stores/StoreExplorePage';
import { ReportsPage } from './components/reports/ReportsPage';
import { CalculatorHub } from './components/calculators/CalculatorHub';
import { NewProjectModal } from './components/shared/NewProjectModal';
import { TransactionDetailModal } from './components/finances/TransactionDetailModal';
import { OfflineIndicator } from './components/pwa/OfflineIndicator';

export default function App() {
  // Navigation & UI States
  const [activeTab, setActiveTab] = useState<TabType>('beranda');
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isCalculatorOpen, setIsCalculatorOpen] = useState(false);
  const [isNewProjectModalOpen, setIsNewProjectModalOpen] = useState(false);
  const [selectedTxForDetail, setSelectedTxForDetail] = useState<FinancialTransaction | null>(null);

  // Database Entities
  const [projects, setProjects] = useState<Project[]>([]);
  const [activeProjectId, setActiveProjectId] = useState<string>('');
  const [currentProject, setCurrentProject] = useState<Project | null>(null);
  const [categories, setCategories] = useState<MaterialCategory[]>([]);
  const [materials, setMaterials] = useState<MaterialCalculated[]>([]);
  const [purchases, setPurchases] = useState<PurchaseWithPayment[]>([]);
  const [transactions, setTransactions] = useState<FinancialTransaction[]>([]);
  const [projectImages, setProjectImages] = useState<ProjectImage[]>([]);
  const [financialSummary, setFinancialSummary] = useState<ProjectFinancialSummary>({
    totalIncome: 0,
    totalExpense: 0,
    netBalance: 0,
    estimatedRemainingCost: 0,
    budgetStatus: 'Aman',
    balanceDifference: 0,
    totalEstimatedProjectCost: 0,
    totalPaidPurchases: 0,
    totalUnpaidPurchases: 0,
  });

  const [isLoading, setIsLoading] = useState(true);

  // Primary Data Loading
  const loadProjectData = useCallback(async (targetProjectId?: string) => {
    try {
      // 1. Ensure initial seed if DB is empty
      const initProjId = await seedInitialDataIfNeeded();

      // 2. Fetch all active projects
      const allProjects = await db.projects.filter((p) => !p.deletedAt).toArray();
      setProjects(allProjects);

      const projId = targetProjectId || activeProjectId || initProjId;
      setActiveProjectId(projId);

      const active = allProjects.find((p) => p.id === projId) || allProjects[0] || null;
      setCurrentProject(active);

      if (!active) {
        setIsLoading(false);
        return;
      }

      // 3. Fetch project details
      const [allCats, rawMaterials, rawPurchases, rawTransactions, images] = await Promise.all([
        db.material_categories.where('projectId').equals(active.id).filter((c) => !c.deletedAt).sortBy('sortOrder'),
        db.materials.where('projectId').equals(active.id).filter((m) => !m.deletedAt).toArray(),
        db.purchases.where('projectId').equals(active.id).filter((p) => !p.deletedAt).toArray(),
        db.financial_transactions.where('projectId').equals(active.id).filter((t) => !t.deletedAt).toArray(),
        db.project_images.where('projectId').equals(active.id).filter((i) => !i.deletedAt).toArray(),
      ]);

      setCategories(allCats);
      setTransactions(rawTransactions);
      setProjectImages(images);

      // 4. Calculate purchases with payment status
      const calculatedPurchases = rawPurchases.map((p) => calculatePurchasePayment(p, rawTransactions));
      setPurchases(calculatedPurchases);

      // 5. Calculate material stock and estimated remaining
      const calculatedMaterials = rawMaterials.map((m) => calculateMaterialMetrics(m, rawPurchases));
      setMaterials(calculatedMaterials);

      // 6. Calculate total project financial summary
      const summary = calculateProjectFinancialSummary(rawTransactions, rawMaterials, rawPurchases);
      setFinancialSummary(summary);
    } catch (err) {
      console.error('Error loading data from IndexedDB', err);
    } finally {
      setIsLoading(false);
    }
  }, [activeProjectId]);

  // Initial mount
  useEffect(() => {
    loadProjectData();
  }, [loadProjectData]);

  // Handle Switch Project
  const handleSelectProject = async (id: string) => {
    setActiveProjectId(id);
    await db.settings.put({
      id: 'active_project',
      key: 'active_project_id',
      value: id,
      updatedAt: new Date().toISOString(),
    });
    loadProjectData(id);
  };

  // 1. Material Actions
  const handleSaveMaterial = async (
    data: Omit<Material, 'id' | 'createdAt' | 'updatedAt'>,
    id?: string
  ) => {
    const now = new Date().toISOString();
    if (id) {
      await db.materials.update(id, { ...data, updatedAt: now });
      await syncEngine.recordOperation('material', id, 'update', data);
    } else {
      const newId = crypto.randomUUID();
      const newMat: Material = {
        id: newId,
        ...data,
        createdAt: now,
        updatedAt: now,
      };
      await db.materials.add(newMat);
      await syncEngine.recordOperation('material', newId, 'create', newMat);
    }
    loadProjectData();
  };

  const handleDeleteMaterial = async (id: string) => {
    await db.materials.update(id, { deletedAt: new Date().toISOString() });
    await syncEngine.recordOperation('material', id, 'delete', { id });
    loadProjectData();
  };

  // 2. Purchase Actions (Section 9)
  const handleRecordPurchase = async (purchaseData: {
    materialId: string;
    quantity: number;
    unitPrice: number;
    totalPrice: number;
    supplierName?: string;
    purchaseDate: string;
    notes?: string;
    paymentOption: 'unpaid' | 'partial' | 'full';
    initialPaymentAmount: number;
    receiptBlob?: string;
  }) => {
    const now = new Date().toISOString();
    const purchaseId = crypto.randomUUID();

    const newPurchase: Purchase = {
      id: purchaseId,
      projectId: activeProjectId,
      materialId: purchaseData.materialId,
      quantity: purchaseData.quantity,
      unitPrice: purchaseData.unitPrice,
      totalPrice: purchaseData.totalPrice,
      supplierName: purchaseData.supplierName,
      purchaseDate: purchaseData.purchaseDate,
      notes: purchaseData.notes,
      createdAt: now,
      updatedAt: now,
    };

    await db.transaction('rw', [db.purchases, db.financial_transactions, db.attachments], async () => {
      await db.purchases.add(newPurchase);

      // Create initial payment transaction if full or partial
      if (purchaseData.paymentOption === 'full' || purchaseData.paymentOption === 'partial') {
        const paymentTx: FinancialTransaction = {
          id: crypto.randomUUID(),
          projectId: activeProjectId,
          type: 'material_payment',
          referenceId: purchaseId,
          amount: purchaseData.initialPaymentAmount,
          transactionDate: purchaseData.purchaseDate,
          description: `Pembayaran ${purchaseData.paymentOption === 'full' ? 'Lunas' : 'Uang Muka'} Pembelian Material`,
          paymentStatus: 'paid',
          createdAt: now,
          updatedAt: now,
        };
        await db.financial_transactions.add(paymentTx);
        await syncEngine.recordOperation('transaction', paymentTx.id, 'create', paymentTx);
      }

      // Attach receipt image if present
      if (purchaseData.receiptBlob) {
        await db.attachments.add({
          id: crypto.randomUUID(),
          projectId: activeProjectId,
          purchaseId,
          fileName: `nota-${purchaseId.slice(0, 6)}.jpg`,
          mimeType: 'image/jpeg',
          fileSize: purchaseData.receiptBlob.length,
          dataUrl: purchaseData.receiptBlob,
          createdAt: now,
          updatedAt: now,
        });
      }
    });

    await syncEngine.recordOperation('purchase', purchaseId, 'create', newPurchase);
    loadProjectData();
  };

  const handleAddPaymentAgainstPurchase = async (
    purchaseId: string,
    amount: number,
    description: string
  ) => {
    const now = new Date().toISOString();
    const paymentTx: FinancialTransaction = {
      id: crypto.randomUUID(),
      projectId: activeProjectId,
      type: 'material_payment',
      referenceId: purchaseId,
      amount,
      transactionDate: now.split('T')[0],
      description,
      paymentStatus: 'paid',
      createdAt: now,
      updatedAt: now,
    };

    await db.financial_transactions.add(paymentTx);
    await syncEngine.recordOperation('transaction', paymentTx.id, 'create', paymentTx);
    loadProjectData();
  };

  const handleDeletePurchase = async (purchaseId: string) => {
    const now = new Date().toISOString();
    await db.transaction('rw', [db.purchases, db.financial_transactions], async () => {
      await db.purchases.update(purchaseId, { deletedAt: now });
      // Cancel / soft delete related payments
      await db.financial_transactions
        .where('referenceId')
        .equals(purchaseId)
        .modify({ deletedAt: now });
    });
    await syncEngine.recordOperation('purchase', purchaseId, 'delete', { id: purchaseId });
    loadProjectData();
  };

  // 3. Financial Transactions Actions
  const handleSaveTransaction = async (
    data: Omit<FinancialTransaction, 'id' | 'createdAt' | 'updatedAt'>,
    id?: string
  ) => {
    const now = new Date().toISOString();
    if (id) {
      await db.financial_transactions.update(id, { ...data, updatedAt: now });
      await syncEngine.recordOperation('transaction', id, 'update', data);
    } else {
      const newId = crypto.randomUUID();
      const newTx: FinancialTransaction = {
        id: newId,
        ...data,
        createdAt: now,
        updatedAt: now,
      };
      await db.financial_transactions.add(newTx);
      await syncEngine.recordOperation('transaction', newId, 'create', newTx);
    }
    loadProjectData();
  };

  const handleDeleteTransaction = async (id: string) => {
    await db.financial_transactions.update(id, { deletedAt: new Date().toISOString() });
    await syncEngine.recordOperation('transaction', id, 'delete', { id });
    loadProjectData();
  };

  // 4. Category Creation
  const handleAddCategory = async (name: string): Promise<MaterialCategory> => {
    const now = new Date().toISOString();
    const newCat: MaterialCategory = {
      id: crypto.randomUUID(),
      projectId: activeProjectId,
      name,
      sortOrder: categories.length + 1,
      createdAt: now,
      updatedAt: now,
    };
    await db.material_categories.add(newCat);
    await syncEngine.recordOperation('category', newCat.id, 'create', newCat);
    loadProjectData();
    return newCat;
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4">
        <div className="w-12 h-12 rounded-2xl bg-emerald-600 animate-pulse flex items-center justify-center font-black text-white text-xl mb-4">
          R
        </div>
        <p className="text-xs font-semibold text-slate-400">Menyiapkan database RUMAHKU...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col antialiased selection:bg-emerald-500 selection:text-white">
      {/* Top Navbar */}
      <Navbar
        currentProject={currentProject}
        allProjects={projects}
        onSelectProject={handleSelectProject}
        onOpenNewProjectModal={() => setIsNewProjectModalOpen(true)}
      />

      <div className="flex-1 flex overflow-hidden">
        {/* Desktop Collapsible Sidebar */}
        <Sidebar
          activeTab={activeTab}
          onChangeTab={(tab) => {
            setActiveTab(tab);
            setIsCalculatorOpen(false);
          }}
          isCollapsed={isSidebarCollapsed}
          onToggleCollapse={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
          onOpenCalculator={() => {
            setIsCalculatorOpen(true);
          }}
        />

        {/* Main Content Viewport */}
        <main className="flex-1 overflow-y-auto px-4 lg:px-8 py-6 max-w-7xl mx-auto w-full">
          {isCalculatorOpen ? (
            /* Calculator View */
            <CalculatorHub
              categories={categories}
              projectId={activeProjectId}
              onAddMaterialFromCalculator={handleSaveMaterial}
              onClose={() => setIsCalculatorOpen(false)}
            />
          ) : activeTab === 'beranda' ? (
            /* 1. Beranda / Dashboard View */
            <div className="space-y-6">
              {/* House Banner Component (Section 5.2) */}
              <ProjectBanner
                projectId={activeProjectId}
                images={projectImages}
                onImagesChange={() => loadProjectData()}
              />

              {/* Project Info Card (Section 5.3) */}
              {currentProject && (
                <ProjectInfoCard
                  project={currentProject}
                  onProjectUpdated={() => loadProjectData()}
                />
              )}

              {/* 4 Financial Cards & Budget Indicator (Section 5.4 & 5.5) */}
              <FinancialCards
                summary={financialSummary}
                onOpenAddIncome={() => {
                  setActiveTab('keuangan');
                }}
                onOpenAddExpense={() => {
                  setActiveTab('keuangan');
                }}
              />

              {/* Recent Activity List (Section 5.6) */}
              <RecentActivity
                transactions={transactions}
                onViewAll={() => setActiveTab('keuangan')}
                onSelectTransaction={(tx) => setSelectedTxForDetail(tx)}
              />
            </div>
          ) : activeTab === 'material' ? (
            /* 2. Material Management View (Section 8) */
            <MaterialList
              materials={materials}
              categories={categories}
              projectId={activeProjectId}
              purchases={purchases}
              transactions={transactions}
              onSaveMaterial={handleSaveMaterial}
              onDeleteMaterial={handleDeleteMaterial}
              onRecordPurchase={handleRecordPurchase}
              onAddPayment={handleAddPaymentAgainstPurchase}
              onDeletePurchase={handleDeletePurchase}
              onAddCategory={handleAddCategory}
              onOpenCalculator={() => setIsCalculatorOpen(true)}
            />
          ) : activeTab === 'keuangan' ? (
            /* 3. Finance & Cash Flow View (Section 10) */
            <FinanceDashboard
              transactions={transactions}
              summary={financialSummary}
              projectId={activeProjectId}
              onSaveTransaction={handleSaveTransaction}
              onDeleteTransaction={handleDeleteTransaction}
            />
          ) : activeTab === 'toko' ? (
            /* 4. Jelajah Toko & Real-Time Cloud Store Directory */
            <StoreExplorePage 
              currentProject={currentProject}
              onRefreshProjectMaterials={() => loadProjectData(activeProjectId)}
            />
          ) : (
            /* 5. Reports & Analytics View (Section 14) */
            <ReportsPage
              currentProject={currentProject}
              summary={financialSummary}
              materials={materials}
              categories={categories}
              transactions={transactions}
            />
          )}
        </main>
      </div>

      {/* Mobile Bottom Navigation (5 tabs) */}
      <BottomNavigation
        activeTab={activeTab}
        onChangeTab={(tab) => {
          setActiveTab(tab);
          setIsCalculatorOpen(false);
        }}
      />

      {/* Offline Toast Indicator */}
      <OfflineIndicator />

      {/* New Project Modal (Section 6) */}
      <NewProjectModal
        isOpen={isNewProjectModalOpen}
        onClose={() => setIsNewProjectModalOpen(false)}
        onProjectCreated={(newId) => loadProjectData(newId)}
      />

      {/* Transaction Detail Modal */}
      <TransactionDetailModal
        isOpen={!!selectedTxForDetail}
        onClose={() => setSelectedTxForDetail(null)}
        transaction={selectedTxForDetail}
        onEdit={() => {
          setActiveTab('keuangan');
          setSelectedTxForDetail(null);
        }}
      />
    </div>
  );
}
