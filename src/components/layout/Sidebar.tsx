import React from 'react';
import { 
  Home, 
  Boxes, 
  Wallet, 
  Store, 
  BarChart3, 
  Calculator, 
  ChevronLeft, 
  ChevronRight,
  ShieldCheck
} from 'lucide-react';
import { TabType } from './BottomNavigation';

interface SidebarProps {
  activeTab: TabType;
  onChangeTab: (tab: TabType) => void;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
  onOpenCalculator: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  onChangeTab,
  isCollapsed,
  onToggleCollapse,
  onOpenCalculator,
}) => {
  const mainNavItems = [
    { id: 'beranda' as TabType, label: 'Beranda', icon: Home },
    { id: 'material' as TabType, label: 'Material', icon: Boxes },
    { id: 'keuangan' as TabType, label: 'Keuangan', icon: Wallet },
    { id: 'toko' as TabType, label: 'Jelajah Toko', icon: Store, badge: 'Cloud' },
    { id: 'laporan' as TabType, label: 'Laporan', icon: BarChart3 },
  ];

  return (
    <aside
      className={`hidden md:flex flex-col border-r border-slate-800/80 bg-slate-900/60 backdrop-blur-md transition-all duration-300 relative z-30 ${
        isCollapsed ? 'w-20' : 'w-64'
      }`}
    >
      {/* Collapse button */}
      <button
        onClick={onToggleCollapse}
        className="absolute -right-3 top-6 z-40 h-6 w-6 rounded-full border border-slate-700 bg-slate-800 text-slate-300 hover:text-white flex items-center justify-center shadow-lg transition"
        title={isCollapsed ? 'Perluas Menu' : 'Perkecil Menu'}
      >
        {isCollapsed ? <ChevronRight className="w-3.5 h-3.5" /> : <ChevronLeft className="w-3.5 h-3.5" />}
      </button>

      {/* Main navigation list */}
      <div className="flex-1 px-3 py-6 space-y-1.5">
        <div className={`px-3 mb-3 text-[11px] font-bold text-slate-500 uppercase tracking-wider ${isCollapsed ? 'text-center' : ''}`}>
          {isCollapsed ? '•••' : 'Menu Utama'}
        </div>

        {mainNavItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onChangeTab(item.id)}
              className={`w-full flex items-center gap-3.5 rounded-xl px-3 py-3 text-xs font-semibold transition-all relative ${
                isActive
                  ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-950/40'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
              } ${isCollapsed ? 'justify-center' : ''}`}
              title={isCollapsed ? item.label : undefined}
            >
              <Icon className="w-5 h-5 shrink-0" />
              {!isCollapsed && (
                <div className="flex items-center justify-between w-full">
                  <span>{item.label}</span>
                  {item.badge && (
                    <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-slate-800 text-emerald-400 border border-emerald-500/20">
                      {item.badge}
                    </span>
                  )}
                </div>
              )}
            </button>
          );
        })}

        {/* Tools Section */}
        <div className={`pt-6 px-3 mb-2 text-[11px] font-bold text-slate-500 uppercase tracking-wider ${isCollapsed ? 'text-center' : ''}`}>
          {isCollapsed ? '•••' : 'Alat & Fitur'}
        </div>

        {/* Calculator Button */}
        <button
          onClick={onOpenCalculator}
          className={`w-full flex items-center gap-3.5 rounded-xl px-3 py-3 text-xs font-semibold text-slate-400 hover:text-emerald-300 hover:bg-emerald-500/10 transition ${
            isCollapsed ? 'justify-center' : ''
          }`}
          title="Kalkulator Material"
        >
          <Calculator className="w-5 h-5 shrink-0 text-emerald-400" />
          {!isCollapsed && <span>Kalkulator Material</span>}
        </button>
      </div>

      {/* Security badge at bottom */}
      {!isCollapsed && (
        <div className="p-4 m-3 rounded-2xl bg-slate-800/40 border border-slate-800 text-center">
          <div className="flex items-center justify-center gap-1.5 text-emerald-400 mb-1">
            <ShieldCheck className="w-4 h-4" />
            <span className="text-xs font-bold">Privasi Terjaga</span>
          </div>
          <p className="text-[10px] text-slate-400 leading-tight">
            Data tersimpan lokal di peramban Anda dengan enkripsi Dexie IndexedDB.
          </p>
        </div>
      )}
    </aside>
  );
};
