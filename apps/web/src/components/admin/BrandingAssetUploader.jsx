import { useState, useRef } from 'react';
import { BRANDING_ASSET_LIMITS } from '@your-own/shared';
import { uploadBrandingAsset } from '../../lib/uploadBrandingAsset.js';
import { Button } from '../ui/Button.jsx';

/**
 * One upload slot for a single branding asset (a specific logo variant,
 * the favicon, the login background, etc.). Mirrors ImageUploader.jsx's
 * presign/confirm/progress pattern, but for exactly one file rather than
 * a reorderable gallery.
 */
export function BrandingAssetUploader({ assetType, label, hint, currentUrl, onUploaded, roundPreview = false }) {
  const [progress, setProgress] = useState(null); // null when idle
  const [error, setError] = useState(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const inputRef = useRef(null);

  const handleFile = async (file) => {
    if (!file) return;
    setError(null);

    if (!BRANDING_ASSET_LIMITS.ALLOWED_MIME_TYPES.includes(file.type)) {
      setError('Unsupported file type. Use PNG, SVG, JPG, ICO, or WEBP.');
      return;
    }
    if (file.size > BRANDING_ASSET_LIMITS.MAX_FILE_SIZE_BYTES) {
      setError('File is too large (max 5MB).');
      return;
    }

    setProgress(0);
    try {
      const branding = await uploadBrandingAsset(assetType, file, setProgress);
      onUploaded(branding);
    } catch (err) {
      setError(err?.response?.data?.error?.message || 'Upload failed. Try again.');
    } finally {
      setProgress(null);
    }
  };

  return (
    <div>
      <p className="text-sm font-medium text-ink">{label}</p>
      {hint && <p className="mt-0.5 text-xs text-ink-soft">{hint}</p>}

      <div
        onDragOver={(e) => {
          e.preventDefault();
          setIsDragOver(true);
        }}
        onDragLeave={() => setIsDragOver(false)}
        onDrop={(e) => {
          e.preventDefault();
          setIsDragOver(false);
          handleFile(e.dataTransfer.files?.[0]);
        }}
        className={`mt-2 flex items-center gap-4 rounded border border-dashed p-3 transition-colors ${
          isDragOver ? 'border-accent bg-accent-soft' : 'border-border'
        }`}
      >
        <div
          className={`flex h-16 w-16 flex-shrink-0 items-center justify-center overflow-hidden border border-border bg-surface-alt ${
            roundPreview ? 'rounded-full' : 'rounded'
          }`}
        >
          {currentUrl ? (
            <img src={currentUrl} alt={`${label} preview`} className="h-full w-full object-contain" />
          ) : (
            <span className="text-[10px] text-ink-soft">No file</span>
          )}
        </div>

        <div className="min-w-0 flex-1">
          {progress !== null ? (
            <div className="h-1.5 w-full rounded-full bg-border">
              <div className="h-full rounded-full bg-accent transition-all" style={{ width: `${progress}%` }} />
            </div>
          ) : (
            <p className="truncate text-xs text-ink-soft">Drag & drop, or click to browse</p>
          )}
          <input
            ref={inputRef}
            type="file"
            accept="image/png,image/svg+xml,image/jpeg,image/x-icon,image/vnd.microsoft.icon,image/webp"
            className="hidden"
            onChange={(e) => {
              handleFile(e.target.files?.[0]);
              e.target.value = '';
            }}
          />
        </div>

        <Button type="button" variant="outline" size="sm" onClick={() => inputRef.current?.click()}>
          Upload
        </Button>
      </div>

      {error && <p className="mt-1.5 text-xs text-danger">{error}</p>}
    </div>
  );
}
