import { ensureMediaSrc } from '../lib/api';

const MAX_THUMB = 10;

/** Compact horizontal gallery for incident images (desktop + mobile). */
export function IncidentPhotoGallery({
  photoUrls,
  photoUrlFallback,
  title = 'Photos',
  className = '',
}: {
  photoUrls?: string[] | null;
  photoUrlFallback?: string | null;
  title?: string;
  className?: string;
}) {
  const urls = (() => {
    const fromList = (photoUrls ?? []).map((u) => ensureMediaSrc(u)).filter(Boolean) as string[];
    if (fromList.length) return fromList.slice(0, MAX_THUMB);
    const one = ensureMediaSrc(photoUrlFallback ?? null);
    return one ? [one] : [];
  })();

  if (urls.length === 0) return null;

  return (
    <div className={className}>
      <span className="text-sm text-slate-500 block mb-2">{urls.length > 1 ? `${title} (${urls.length})` : title}</span>
      <div className="flex gap-2 overflow-x-auto pb-1 snap-x snap-mandatory [-webkit-overflow-scrolling:touch]">
        {urls.map((src, i) => (
          <a
            key={`${src}-${i}`}
            href={src}
            target="_blank"
            rel="noopener noreferrer"
            className="shrink-0 snap-start rounded-lg border border-slate-200 bg-slate-50 overflow-hidden focus:outline-none focus:ring-2 focus:ring-[var(--xu-blue)]/40"
          >
            <img
              src={src}
              alt={`Incident ${i + 1}`}
              className="h-28 w-28 sm:h-32 sm:w-32 object-cover"
              loading={i > 2 ? 'lazy' : 'eager'}
            />
          </a>
        ))}
      </div>
    </div>
  );
}
