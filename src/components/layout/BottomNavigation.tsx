import React from 'react';
import { 
  Home, 
  Boxes, 
  Wallet, 
  Store, 
  BarChart3 
} from 'lucide-react';

export type TabType = 'beranda' | 'material' | 'keuangan' | 'toko' | 'laporan';

interface BottomNavigationProps {
  activeTab: TabType;
  onChangeTab: (tab: TabType) => void;
}

export const BottomNavigation: React.FC<BottomNavigationProps> = ({
  activeTab,
  onChangeTab,
}) => {
  const tabs = [
    { id: 'beranda' as TabType, label: 'Beranda', icon: Home },
    { id: 'material' as TabType, label: 'Material', icon: Boxes },
    { id: 'keuangan' as TabType, label: 'Keuangan', icon: Wallet },
    { id: 'toko' as TabType, label: 'Jelajah Toko', icon: Store },
    { id: 'laporan' as TabType, label: 'Laporan', icon: BarChart3 },
  ];

  return (
    <nav 
      aria-label="Navigasi Utama Mobile" 
      className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-slate-900/95 backdrop-blur-lg border-t border-slate-800/80 px-2 py-1.5 safe-bottom"
    >
      <div className="flex items-center justify-around">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => onChangeTab(tab.id)}
              className={`flex flex-col items-center justify-center py-1 px-2.5 rounded-xl transition-all relative ${
                isActive
                  ? 'text-emerald-400 font-bold'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {isActive && (
                <div className="absolute -top-1.5 w-6 h-1 rounded-full bg-emerald-400 shadow-sm shadow-emerald-400" />
              )}
              <Icon className={`w-5 h-5 transition-transform ${isActive ? 'scale-110' : ''}`} />
              <span className="text-[10px] mt-1 tracking-tight truncate max-w-[64px]">
                {tab.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};
