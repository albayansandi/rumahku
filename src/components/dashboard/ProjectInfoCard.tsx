import React, { useState } from 'react';
import { 
  Building, 
  MapPin, 
  Calendar, 
  Ruler, 
  Edit3, 
  CheckCircle, 
  Clock, 
  PauseCircle, 
  Archive,
  Layers
} from 'lucide-react';
import { Project, ProjectStatus } from '../../types';
import { db } from '../../lib/db/database';
import { syncEngine } from '../../lib/sync/syncEngine';

interface ProjectInfoCardProps {
  project: Project;
  onProjectUpdated: () => void;
}

export const ProjectInfoCard: React.FC<ProjectInfoCardProps> = ({
  project,
  onProjectUpdated,
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [name, setName] = useState(project.name);
  const [description, setDescription] = useState(project.description || '');
  const [length, setLength] = useState(project.length || 0);
  const [width, setWidth] = useState(project.width || 0);
  const [location, setLocation] = useState(project.location || '');
  const [startDate, setStartDate] = useState(project.startDate || '');
  const [status, setStatus] = useState<ProjectStatus>(project.status);
  const [isSaving, setIsSaving] = useState(false);

  // Automatic calculated area: Panjang x Lebar
  const buildingArea = Math.round(Number(length) * Number(width) * 100) / 100;

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      alert('Nama proyek tidak boleh kosong.');
      return;
    }

    setIsSaving(true);
    try {
      const now = new Date().toISOString();
      const updatedFields: Partial<Project> = {
        name: name.trim(),
        description: description.trim(),
        length: Number(length) || 0,
        width: Number(width) || 0,
        location: location.trim(),
        startDate,
        status,
        updatedAt: now,
      };

      await db.projects.update(project.id, updatedFields);
      await syncEngine.recordOperation('project', project.id, 'update', updatedFields);
      setIsEditing(false);
      onProjectUpdated();
    } catch (err) {
      console.error('Error updating project', err);
      alert('Gagal menyimpan perubahan proyek.');
    } finally {
      setIsSaving(false);
    }
  };

  const getStatusBadge = (st: ProjectStatus) => {
    switch (st) {
      case 'in_progress':
        return (
          <span className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-xs font-semibold">
            <Clock className="w-3.5 h-3.5" />
            <span>Sedang Berjalan</span>
          </span>
        );
      case 'completed':
        return (
          <span className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-blue-500/10 text-blue-400 border border-blue-500/20 text-xs font-semibold">
            <CheckCircle className="w-3.5 h-3.5" />
            <span>Selesai</span>
          </span>
        );
      case 'on_hold':
        return (
          <span className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20 text-xs font-semibold">
            <PauseCircle className="w-3.5 h-3.5" />
            <span>Ditunda</span>
          </span>
        );
      case 'archived':
        return (
          <span className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-slate-500/10 text-slate-400 border border-slate-500/20 text-xs font-semibold">
            <Archive className="w-3.5 h-3.5" />
            <span>Diarsipkan</span>
          </span>
        );
      default:
        return (
          <span className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-purple-500/10 text-purple-400 border border-purple-500/20 text-xs font-semibold">
            <Layers className="w-3.5 h-3.5" />
            <span>Perencanaan</span>
          </span>
        );
    }
  };

  return (
    <div className="rounded-3xl bg-slate-900/90 border border-slate-800 p-6 shadow-xl relative overflow-hidden">
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
        <div className="space-y-2">
          <div className="flex flex-wrap items-center gap-2.5">
            <h2 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight">
              {project.name}
            </h2>
            {getStatusBadge(project.status)}
          </div>
          {project.description && (
            <p className="text-xs sm:text-sm text-slate-400 max-w-2xl leading-relaxed">
              {project.description}
            </p>
          )}
        </div>

        <button
          onClick={() => {
            setName(project.name);
            setDescription(project.description || '');
            setLength(project.length || 0);
            setWidth(project.width || 0);
            setLocation(project.location || '');
            setStartDate(project.startDate || '');
            setStatus(project.status);
            setIsEditing(true);
          }}
          className="self-start flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700/80 text-xs font-semibold transition active:scale-95"
        >
          <Edit3 className="w-3.5 h-3.5 text-emerald-400" />
          <span>Edit Informasi</span>
        </button>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 mt-6 pt-6 border-t border-slate-800/80">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-slate-800/80 text-emerald-400 border border-slate-700/50">
            <Ruler className="w-4 h-4" />
          </div>
          <div>
            <div className="text-[10px] font-medium text-slate-400 uppercase tracking-wide">
              Dimensi Rumah
            </div>
            <div className="text-sm font-bold text-white font-mono-numbers">
              {project.length}m × {project.width}m
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-slate-800/80 text-teal-400 border border-slate-700/50">
            <Building className="w-4 h-4" />
          </div>
          <div>
            <div className="text-[10px] font-medium text-slate-400 uppercase tracking-wide">
              Luas Bangunan
            </div>
            <div className="text-sm font-bold text-white font-mono-numbers">
              {buildingArea} m²
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-slate-800/80 text-cyan-400 border border-slate-700/50">
            <Calendar className="w-4 h-4" />
          </div>
          <div>
            <div className="text-[10px] font-medium text-slate-400 uppercase tracking-wide">
              Mulai Bangun
            </div>
            <div className="text-sm font-bold text-white">
              {project.startDate
                ? new Date(project.startDate).toLocaleDateString('id-ID', {
                    day: 'numeric',
                    month: 'short',
                    year: 'numeric',
                  })
                : '-'}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-slate-800/80 text-blue-400 border border-slate-700/50">
            <MapPin className="w-4 h-4" />
          </div>
          <div>
            <div className="text-[10px] font-medium text-slate-400 uppercase tracking-wide">
              Lokasi
            </div>
            <div className="text-sm font-bold text-white truncate max-w-[140px]">
              {project.location || 'Indonesia'}
            </div>
          </div>
        </div>
      </div>

      {/* Edit Modal */}
      {isEditing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-sm animate-fadeIn">
          <div className="w-full max-w-lg rounded-3xl bg-slate-900 border border-slate-800 p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="text-lg font-bold text-white">Edit Informasi Proyek</h3>
              <button
                onClick={() => setIsEditing(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSave} className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">
                  Nama Proyek *
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  className="w-full rounded-xl bg-slate-800 border border-slate-700 px-3.5 py-2.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">
                  Deskripsi Proyek
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={2}
                  className="w-full rounded-xl bg-slate-800 border border-slate-700 px-3.5 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1">
                    Panjang Bangunan (meter)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    min="0"
                    value={length}
                    onChange={(e) => setLength(parseFloat(e.target.value) || 0)}
                    className="w-full rounded-xl bg-slate-800 border border-slate-700 px-3.5 py-2.5 text-sm text-white font-mono-numbers focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1">
                    Lebar Bangunan (meter)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    min="0"
                    value={width}
                    onChange={(e) => setWidth(parseFloat(e.target.value) || 0)}
                    className="w-full rounded-xl bg-slate-800 border border-slate-700 px-3.5 py-2.5 text-sm text-white font-mono-numbers focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>

              <div className="p-3 rounded-xl bg-slate-800/60 border border-slate-700/60 flex items-center justify-between text-xs">
                <span className="text-slate-400">Luas Bangunan (Otomatis):</span>
                <span className="font-bold text-emerald-400 font-mono-numbers text-sm">
                  {Math.round(Number(length) * Number(width) * 100) / 100} m²
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
                    placeholder="Contoh: Bandung, Jawa Barat"
                    className="w-full rounded-xl bg-slate-800 border border-slate-700 px-3.5 py-2.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1">
                    Tanggal Mulai
                  </label>
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full rounded-xl bg-slate-800 border border-slate-700 px-3.5 py-2.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">
                  Status Proyek
                </label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value as ProjectStatus)}
                  className="w-full rounded-xl bg-slate-800 border border-slate-700 px-3.5 py-2.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                >
                  <option value="planning">Perencanaan</option>
                  <option value="in_progress">Sedang Berjalan</option>
                  <option value="on_hold">Ditunda</option>
                  <option value="completed">Selesai</option>
                  <option value="archived">Diarsipkan</option>
                </select>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsEditing(false)}
                  className="px-4 py-2.5 rounded-xl text-xs font-semibold text-slate-300 hover:bg-slate-800 transition"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-xs font-bold text-white shadow-lg transition"
                >
                  {isSaving ? 'Menyimpan...' : 'Simpan Perubahan'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
