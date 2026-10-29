import React, { useState } from 'react';
import { X, Building, Plus } from 'lucide-react';
import { Project, ProjectStatus } from '../../types';
import { getDefaultCategories, db } from '../../lib/db/database';
import { syncEngine } from '../../lib/sync/syncEngine';

interface NewProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onProjectCreated: (newProjectId: string) => void;
}

export const NewProjectModal: React.FC<NewProjectModalProps> = ({
  isOpen,
  onClose,
  onProjectCreated,
}) => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [length, setLength] = useState<number>(6);
  const [width, setWidth] = useState<number>(6);
  const [location, setLocation] = useState('');
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [status, setStatus] = useState<ProjectStatus>('planning');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const area = Math.round((Number(length) || 0) * (Number(width) || 0) * 100) / 100;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      alert('Nama proyek tidak boleh kosong.');
      return;
    }

    setIsSubmitting(true);
    try {
      const now = new Date().toISOString();
      const newProjectId = crypto.randomUUID();

      const newProject: Project = {
        id: newProjectId,
        name: name.trim(),
        description: description.trim(),
        length: Number(length) || 0,
        width: Number(width) || 0,
        location: location.trim() || undefined,
        startDate,
        status,
        createdAt: now,
        updatedAt: now,
      };

      const categories = getDefaultCategories(newProjectId);

      await db.transaction('rw', [db.projects, db.material_categories, db.settings], async () => {
        await db.projects.add(newProject);
        await db.material_categories.bulkAdd(categories);
        await db.settings.put({
          id: 'active_project',
          key: 'active_project_id',
          value: newProjectId,
          updatedAt: now,
        });
      });

      await syncEngine.recordOperation('project', newProjectId, 'create', newProject);

      onProjectCreated(newProjectId);
      onClose();
    } catch (err) {
      console.error('Error creating project', err);
      alert('Gagal membuat proyek baru.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fadeIn">
      <div className="w-full max-w-lg rounded-3xl bg-slate-900 border border-slate-800 p-6 shadow-2xl max-h-[92vh] overflow-y-auto space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400">
              <Building className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-white">Buat Proyek Rumah Baru</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-xs font-semibold text-slate-300 block mb-1">
              Nama Proyek <span className="text-rose-400">*</span>
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Contoh: Rumah Tinggal 2 Lantai Ibu Maya"
              required
              className="w-full rounded-xl bg-slate-800 border border-slate-700 px-3.5 py-2.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-300 block mb-1">
              Deskripsi Singkat
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
              placeholder="Contoh: Rencana bangun rumah minimalis dengan 3 kamar tidur"
              className="w-full rounded-xl bg-slate-800 border border-slate-700 px-3 py-2 text-xs text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1">
                Panjang Bangunan (m)
              </label>
              <input
                type="number"
                step="0.1"
                min="0"
                value={length}
                onChange={(e) => setLength(parseFloat(e.target.value) || 0)}
                className="w-full rounded-xl bg-slate-800 border border-slate-700 px-3.5 py-2.5 text-sm font-semibold text-white font-mono-numbers focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1">
                Lebar Bangunan (m)
              </label>
              <input
                type="number"
                step="0.1"
                min="0"
                value={width}
                onChange={(e) => setWidth(parseFloat(e.target.value) || 0)}
                className="w-full rounded-xl bg-slate-800 border border-slate-700 px-3.5 py-2.5 text-sm font-semibold text-white font-mono-numbers focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
          </div>

          <div className="p-3 rounded-xl bg-slate-800/60 border border-slate-700 flex items-center justify-between text-xs">
            <span className="text-slate-400">Luas Bangunan (Otomatis):</span>
            <span className="font-bold text-emerald-400 font-mono-numbers text-sm">
              {area} m²
            </span>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1">
                Lokasi Proyek
              </label>
              <input
                type="text"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="Contoh: Sleman, Yogyakarta"
                className="w-full rounded-xl bg-slate-800 border border-slate-700 px-3 py-2 text-xs text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1">
                Target Mulai
              </label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full rounded-xl bg-slate-800 border border-slate-700 px-3 py-2 text-xs text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl text-xs font-semibold text-slate-300 hover:bg-slate-800"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-xs font-bold text-white shadow-lg"
            >
              {isSubmitting ? 'Membuat...' : 'Buat Proyek'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
