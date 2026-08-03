import { useState, useRef } from 'react';
import { IMAGE_LIMITS } from '@your-own/shared';
import { uploadLandImage } from '../../lib/uploadImage.js';
import { deleteLandImage, reorderLandImages } from '../../lib/landApi.js';
import { Button } from '../ui/Button.jsx';

export function ImageUploader({ landId, images, onImagesChange }) {
  const [uploadingFiles, setUploadingFiles] = useState([]); // [{ id, name, progress }]
  const [error, setError] = useState(null);
  const fileInputRef = useRef(null);
  const dragIndexRef = useRef(null);

  const remainingSlots = IMAGE_LIMITS.MAX_IMAGES_PER_LAND - images.length - uploadingFiles.length;

  const handleFilesSelected = async (fileList) => {
    setError(null);
    const files = Array.from(fileList);

    if (files.length > remainingSlots) {
      setError(
        `You can add ${remainingSlots} more image${remainingSlots === 1 ? '' : 's'} (10 maximum per listing).`
      );
      return;
    }

    for (const file of files) {
      if (!IMAGE_LIMITS.ALLOWED_MIME_TYPES.includes(file.type)) {
        setError(`${file.name}: unsupported file type. Use JPEG, PNG, or WebP.`);
        continue;
      }
      if (file.size > IMAGE_LIMITS.MAX_FILE_SIZE_BYTES) {
        setError(`${file.name}: file is too large (max 8MB).`);
        continue;
      }

      const tempId = `${file.name}-${Date.now()}`;
      setUploadingFiles((prev) => [...prev, { id: tempId, name: file.name, progress: 0 }]);

      try {
        const image = await uploadLandImage(landId, file, (progress) => {
          setUploadingFiles((prev) => prev.map((f) => (f.id === tempId ? { ...f, progress } : f)));
        });
        onImagesChange([...images, image]);
      } catch (err) {
        setError(err?.response?.data?.error?.message || `Failed to upload ${file.name}.`);
      } finally {
        setUploadingFiles((prev) => prev.filter((f) => f.id !== tempId));
      }
    }
  };

  const handleDelete = async (imageId) => {
    setError(null);
    try {
      await deleteLandImage(landId, imageId);
      onImagesChange(images.filter((img) => img._id !== imageId));
    } catch (err) {
      setError(err?.response?.data?.error?.message || 'Could not delete this image.');
    }
  };

  const handleDragStart = (index) => {
    dragIndexRef.current = index;
  };

  const handleDragOver = (e, overIndex) => {
    e.preventDefault();
    const dragIndex = dragIndexRef.current;
    if (dragIndex === null || dragIndex === overIndex) return;

    const reordered = [...images];
    const [moved] = reordered.splice(dragIndex, 1);
    reordered.splice(overIndex, 0, moved);
    dragIndexRef.current = overIndex;
    onImagesChange(reordered);
  };

  const handleDragEnd = async () => {
    dragIndexRef.current = null;
    const order = images.map((img, idx) => ({ imageId: img._id, sortOrder: idx }));
    await reorderLandImages(landId, order).catch(() => null);
  };

  return (
    <div>
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium text-ink">
          Images ({images.length + uploadingFiles.length}/{IMAGE_LIMITS.MAX_IMAGES_PER_LAND})
        </p>
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={remainingSlots <= 0}
          onClick={() => fileInputRef.current?.click()}
        >
          Add images
        </Button>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          multiple
          className="hidden"
          onChange={(e) => {
            handleFilesSelected(e.target.files);
            e.target.value = '';
          }}
        />
      </div>

      {error && <p className="mt-2 text-sm text-danger">{error}</p>}

      <p className="mt-1 text-xs text-ink-soft">
        JPEG, PNG, or WebP. Max 8MB each, 10 images per listing. Drag to reorder — the first image is used as the cover.
      </p>

      <div className="mt-4 grid grid-cols-3 gap-3 sm:grid-cols-4 md:grid-cols-5">
        {images.map((img, index) => (
          <div
            key={img._id}
            draggable
            onDragStart={() => handleDragStart(index)}
            onDragOver={(e) => handleDragOver(e, index)}
            onDragEnd={handleDragEnd}
            className="group relative aspect-square cursor-move overflow-hidden rounded border border-border"
          >
            <img src={img.imageUrl} alt={img.altText || ''} className="h-full w-full object-cover" />
            {index === 0 && (
              <span className="absolute left-1 top-1 rounded bg-surface/90 px-1.5 py-0.5 text-[10px] font-medium uppercase text-ink">
                Cover
              </span>
            )}
            <button
              type="button"
              onClick={() => handleDelete(img._id)}
              aria-label={`Delete image ${index + 1}`}
              className="absolute right-1 top-1 hidden h-6 w-6 items-center justify-center rounded-full bg-surface/95 text-danger group-hover:flex"
            >
              ×
            </button>
          </div>
        ))}

        {uploadingFiles.map((f) => (
          <div key={f.id} className="flex aspect-square flex-col items-center justify-center rounded border border-dashed border-border bg-surface-alt p-2 text-center">
            <p className="truncate text-xs text-ink-soft">{f.name}</p>
            <div className="mt-2 h-1.5 w-full rounded-full bg-border">
              <div className="h-full rounded-full bg-accent transition-all" style={{ width: `${f.progress}%` }} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
