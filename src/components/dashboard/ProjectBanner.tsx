import React, { useState, useRef } from 'react';
import { 
  Camera, 
  ChevronLeft, 
  ChevronRight, 
  Maximize2, 
  Star, 
  Trash2, 
  UploadCloud, 
  X,
  Plus
} from 'lucide-react';
import { ProjectImage } from '../../types';
import { db } from '../../lib/db/database';
import { syncEngine } from '../../lib/sync/syncEngine';
import { ConfirmDialog } from '../shared/ConfirmDialog';

interface ProjectBannerProps {
  projectId: string;
  images: ProjectImage[];
  onImagesChange: () => void;
}

export const ProjectBanner: React.FC<ProjectBannerProps> = ({
  projectId,
  images,
  onImagesChange,
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [imageToDelete, setImageToDelete] = useState<ProjectImage | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Sort images: primary first, then newest
  const sortedImages = [...images].sort((a, b) => {
    if (a.isPrimary) return -1;
    if (b.isPrimary) return 1;
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });

  const activeImage = sortedImages[currentIndex] || sortedImages[0];

  // Helper to compress and convert image to dataUrl
  const compressImage = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = (event) => {
        const img = new Image();
        img.src = event.target?.result as string;
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const MAX_WIDTH = 1280;
          const MAX_HEIGHT = 720;
          let width = img.width;
          let height = img.height;

          if (width > height) {
            if (width > MAX_WIDTH) {
              height *= MAX_WIDTH / width;
              width = MAX_WIDTH;
            }
          } else {
            if (height > MAX_HEIGHT) {
              width *= MAX_HEIGHT / height;
              height = MAX_HEIGHT;
            }
          }

          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          if (!ctx) {
            resolve(event.target?.result as string);
            return;
          }
          ctx.drawImage(img, 0, 0, width, height);
          const compressedDataUrl = canvas.toDataURL('image/jpeg', 0.85);
          resolve(compressedDataUrl);
        };
        img.onerror = () => resolve(event.target?.result as string);
      };
      reader.onerror = (err) => reject(err);
    });
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setIsUploading(true);
    try {
      const now = new Date().toISOString();
      const hasAnyPrimary = sortedImages.some((i) => i.isPrimary);

      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        if (!file.type.match(/^image\/(jpeg|png|webp|svg\+xml)$/)) {
          alert(`File ${file.name} bukan format gambar yang didukung (JPG, PNG, WebP).`);
          continue;
        }

        if (file.size > 10 * 1024 * 1024) {
          alert(`File ${file.name} melebihi batas 10MB.`);
          continue;
        }

        const dataUrl = await compressImage(file);
        const newImage: ProjectImage = {
          id: crypto.randomUUID(),
          projectId,
          fileName: file.name,
          mimeType: file.type,
          fileSize: file.size,
          dataUrl,
          isPrimary: !hasAnyPrimary && i === 0,
          createdAt: now,
          updatedAt: now,
        };

        await db.project_images.add(newImage);
        await syncEngine.recordOperation('project_image', newImage.id, 'create', newImage);
      }

      onImagesChange();
      setCurrentIndex(0);
    } catch (err) {
      console.error('Upload error', err);
      alert('Gagal mengunggah gambar rumah.');
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleSetPrimary = async (img: ProjectImage) => {
    // Unset current primary and set this one
    await db.transaction('rw', [db.project_images, db.projects], async () => {
      await db.project_images
        .where('projectId')
        .equals(projectId)
        .modify({ isPrimary: false, updatedAt: new Date().toISOString() });

      await db.project_images.update(img.id, {
        isPrimary: true,
        updatedAt: new Date().toISOString(),
      });

      await db.projects.update(projectId, {
        mainImageId: img.id,
        updatedAt: new Date().toISOString(),
      });
    });

    await syncEngine.recordOperation('project_image', img.id, 'update', { isPrimary: true });
    onImagesChange();
  };

  const handleDeleteImage = async () => {
    if (!imageToDelete) return;
    await db.project_images.update(imageToDelete.id, {
      deletedAt: new Date().toISOString(),
    });
    await syncEngine.recordOperation('project_image', imageToDelete.id, 'delete', { id: imageToDelete.id });
    setImageToDelete(null);
    if (currentIndex >= sortedImages.length - 1) {
      setCurrentIndex(Math.max(0, sortedImages.length - 2));
    }
    onImagesChange();
  };

  const handlePrev = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentIndex((prev) => (prev > 0 ? prev - 1 : sortedImages.length - 1));
  };

  const handleNext = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentIndex((prev) => (prev < sortedImages.length - 1 ? prev + 1 : 0));
  };

  return (
    <>
      <div className="relative w-full h-56 sm:h-72 md:h-84 lg:h-96 rounded-3xl overflow-hidden bg-slate-950 border border-slate-800 shadow-xl group">
        {activeImage ? (
          <>
            <img
              src={activeImage.dataUrl}
              alt={activeImage.fileName}
              className="w-full h-full object-cover transition duration-500 group-hover:scale-105"
            />
            {/* Gradient Overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/20 to-black/40 pointer-events-none" />

            {/* Slider Navigation Arrows (if multiple images) */}
            {sortedImages.length > 1 && (
              <>
                <button
                  onClick={handlePrev}
                  className="absolute left-3 top-1/2 -translate-y-1/2 p-2 rounded-xl bg-slate-900/80 hover:bg-slate-800 text-white backdrop-blur-md transition active:scale-95 shadow-lg border border-slate-700/60"
                  title="Foto Sebelumnya"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <button
                  onClick={handleNext}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-2 rounded-xl bg-slate-900/80 hover:bg-slate-800 text-white backdrop-blur-md transition active:scale-95 shadow-lg border border-slate-700/60"
                  title="Foto Berikutnya"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
              </>
            )}

            {/* Top Toolbar */}
            <div className="absolute top-3 left-3 right-3 flex items-center justify-between pointer-events-auto">
              <div className="flex items-center gap-2">
                {activeImage.isPrimary ? (
                  <span className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-amber-500/90 text-amber-950 text-xs font-bold shadow-md backdrop-blur-md">
                    <Star className="w-3.5 h-3.5 fill-current" />
                    <span>Foto Utama</span>
                  </span>
                ) : (
                  <button
                    onClick={() => handleSetPrimary(activeImage)}
                    className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-slate-900/80 hover:bg-slate-800 text-slate-200 text-xs font-medium backdrop-blur-md border border-slate-700/60 transition"
                  >
                    <Star className="w-3.5 h-3.5" />
                    <span>Jadikan Utama</span>
                  </button>
                )}

                <span className="px-2.5 py-1 rounded-xl bg-slate-900/80 text-slate-300 text-xs font-medium backdrop-blur-md border border-slate-700/60">
                  {currentIndex + 1} / {sortedImages.length}
                </span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setIsFullscreen(true)}
                  className="p-2 rounded-xl bg-slate-900/80 hover:bg-slate-800 text-white backdrop-blur-md transition border border-slate-700/60"
                  title="Pratinjau Layar Penuh"
                >
                  <Maximize2 className="w-4 h-4" />
                </button>

                <button
                  onClick={() => setImageToDelete(activeImage)}
                  className="p-2 rounded-xl bg-rose-900/80 hover:bg-rose-800 text-rose-200 backdrop-blur-md transition border border-rose-700/60"
                  title="Hapus Foto Ini"
                >
                  <Trash2 className="w-4 h-4" />
                </button>

                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-emerald-600/90 hover:bg-emerald-500 text-white text-xs font-bold shadow-lg backdrop-blur-md transition active:scale-95"
                >
                  <Plus className="w-4 h-4" />
                  <span className="hidden sm:inline">Tambah Foto</span>
                </button>
              </div>
            </div>

            {/* Bottom Dots Indicator */}
            {sortedImages.length > 1 && (
              <div className="absolute bottom-3 left-0 right-0 flex justify-center gap-1.5 pointer-events-none">
                {sortedImages.map((_, idx) => (
                  <div
                    key={idx}
                    className={`h-1.5 rounded-full transition-all ${
                      idx === currentIndex ? 'w-6 bg-emerald-400' : 'w-2 bg-white/40'
                    }`}
                  />
                ))}
              </div>
            )}
          </>
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center p-6 text-center">
            <div className="w-16 h-16 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-center text-emerald-400 mb-3 shadow-inner">
              <Camera className="w-8 h-8" />
            </div>
            <h3 className="text-base font-bold text-white mb-1">Tambahkan Foto Desain Rumah</h3>
            <p className="text-xs text-slate-400 max-w-sm mb-4">
              Unggah gambar render 3D, denah tampak depan, atau foto progres pembangunan rumah Anda (JPG, PNG, WebP).
            </p>
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploading}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-lg shadow-emerald-950/40 transition active:scale-95"
            >
              <UploadCloud className="w-4 h-4" />
              <span>{isUploading ? 'Mengunggah...' : 'Pilih Foto Rumah'}</span>
            </button>
          </div>
        )}

        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileUpload}
          multiple
          accept="image/jpeg,image/png,image/webp,image/svg+xml"
          className="hidden"
        />
      </div>

      {/* Fullscreen Preview Modal */}
      {isFullscreen && activeImage && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/95 p-4 animate-fadeIn">
          <button
            onClick={() => setIsFullscreen(false)}
            className="absolute top-6 right-6 p-2 rounded-full bg-slate-800 text-white hover:bg-slate-700 transition"
          >
            <X className="w-6 h-6" />
          </button>
          <img
            src={activeImage.dataUrl}
            alt={activeImage.fileName}
            className="max-w-full max-h-[90vh] object-contain rounded-xl shadow-2xl"
          />
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={!!imageToDelete}
        title="Hapus Foto Rumah"
        message="Apakah Anda yakin ingin menghapus foto rumah ini dari galeri proyek?"
        confirmLabel="Hapus Foto"
        onConfirm={handleDeleteImage}
        onCancel={() => setImageToDelete(null)}
      />
    </>
  );
};
