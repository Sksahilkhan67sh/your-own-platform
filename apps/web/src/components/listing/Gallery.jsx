import { useState } from 'react';

export function Gallery({ images = [], title }) {
  const [activeIndex, setActiveIndex] = useState(0);

  if (images.length === 0) {
    return (
      <div className="flex aspect-[4/3] items-center justify-center rounded-card bg-surface-alt text-ink-soft">
        Images coming soon
      </div>
    );
  }

  const active = images[activeIndex];

  return (
    <div>
      <div className="overflow-hidden rounded-card bg-surface-alt">
        <img
          src={active.imageUrl}
          alt={active.altText || `${title} — photo ${activeIndex + 1}`}
          className="aspect-[4/3] w-full object-cover"
        />
      </div>

      {images.length > 1 && (
        <div className="mt-3 flex gap-2 overflow-x-auto pb-1">
          {images.map((img, idx) => (
            <button
              key={img._id || idx}
              type="button"
              onClick={() => setActiveIndex(idx)}
              aria-label={`View photo ${idx + 1} of ${images.length}`}
              aria-current={idx === activeIndex}
              className={`h-16 w-20 flex-shrink-0 overflow-hidden rounded border-2 transition-colors
                ${idx === activeIndex ? 'border-accent' : 'border-transparent hover:border-border'}`}
            >
              <img src={img.imageUrl} alt="" className="h-full w-full object-cover" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
