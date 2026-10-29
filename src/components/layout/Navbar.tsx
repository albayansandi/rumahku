import React, { useState } from 'react';
import { 
  Building2, 
  ChevronDown, 
  Plus, 
  CheckCircle2
} from 'lucide-react';
import { Project } from '../../types';
import { PWAInstallButton } from '../pwa/PWAInstallButton';

interface NavbarProps {
  currentProject: Project | null;
  allProjects: Project[];
  onSelectProject: (id: string) => void;
  onOpenNewProjectModal: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentProject,
  allProjects,
  onSelectProject,
  onOpenNewProjectModal,
}) => {
  const [showProjectDropdown, setShowProjectDropdown] = useState(false);

  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-800/80 bg-slate-900/90 backdrop-blur-md px-4 lg:px-8 py-2.5 transition-all">
      <div className="flex items-center justify-between gap-3">
        
        {/* Logo & Brand */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2.5">
            <div className="h-9 w-9 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-500 p-0.5 shadow-md shadow-emerald-950/50 flex items-center justify-center">
              <Building2 className="w-5 h-5 text-white" />
            </div>
            <div className="hidden sm:block">
              <span className="text-base font-extrabold tracking-tight text-white">
                RUMAH<span className="text-emerald-400">KU</span>
              </span>
              <span className="block text-[10px] font-medium tracking-wide text-slate-400 uppercase">
                Smart Budget Planner
              </span>
            </div>
          </div>

          {/* Project Selector Dropdown */}
          <div className="relative">
            <button
              onClick={() => setShowProjectDropdown(!showProjectDropdown)}
              className="flex items-center gap-2 rounded-xl bg-slate-800/90 hover:bg-slate-700/80 border border-slate-700/80 px-3 py-1.5 text-xs font-semibold text-slate-200 transition-all max-w-[200px] sm:max-w-[260px]"
            >
              <div className="w-2 h-2 rounded-full bg-emerald-400 shrink-0" />
              <span className="truncate text-left">
                {currentProject ? currentProject.name : 'Pilih Proyek'}
              </span>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400 shrink-0 ml-auto" />
            </button>

            {showProjectDropdown && (
              <>
                <div
                  className="fixed inset-0 z-40"
                  onClick={() => setShowProjectDropdown(false)}
                />
                <div className="absolute left-0 mt-2 z-50 w-64 rounded-2xl bg-slate-900 border border-slate-800 p-2 shadow-2xl space-y-1 animate-fadeIn">
                  <div className="px-3 py-1.5 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                    Daftar Proyek
                  </div>
                  <div className="max-h-56 overflow-y-auto space-y-0.5">
                    {allProjects.map((p) => (
                      <button
                        key={p.id}
                        onClick={() => {
                          onSelectProject(p.id);
                          setShowProjectDropdown(false);
                        }}
                        className={`w-full flex items-center justify-between rounded-xl px-3 py-2 text-xs font-medium text-left transition ${
                          currentProject?.id === p.id
                            ? 'bg-emerald-600/20 text-emerald-300 font-semibold'
                            : 'text-slate-300 hover:bg-slate-800'
                        }`}
                      >
                        <span className="truncate">{p.name}</span>
                        {currentProject?.id === p.id && (
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                        )}
                      </button>
                    ))}
                  </div>
                  <div className="border-t border-slate-800 pt-1 mt-1">
                    <button
                      onClick={() => {
                        setShowProjectDropdown(false);
                        onOpenNewProjectModal();
                      }}
                      className="w-full flex items-center gap-2 rounded-xl px-3 py-2 text-xs font-semibold text-emerald-400 hover:bg-emerald-500/10 transition"
                    >
                      <Plus className="w-4 h-4" />
                      <span>Tambah Proyek Baru</span>
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Right actions: Only PWA Install */}
        <div className="flex items-center gap-2.5">
          <PWAInstallButton />
        </div>
      </div>
    </header>
  );
};
