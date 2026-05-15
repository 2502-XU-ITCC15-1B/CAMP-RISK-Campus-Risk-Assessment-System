/** Shared limits for guard incident report photos (must match backend reports/views.py). */
export const MAX_INCIDENT_PHOTOS = 10;
export const MAX_INCIDENT_BYTES = 5 * 1024 * 1024;
export const MAX_INCIDENT_MB = 5;

const ALLOWED_TYPES = /^image\/(jpeg|png)$/i;

/** Returns an error message, or null if the file is allowed. */
export function validateIncidentPhotoFile(file: File): string | null {
  if (!ALLOWED_TYPES.test(file.type)) {
    return 'Only JPG and PNG images are allowed.';
  }
  if (!Number.isFinite(file.size) || file.size <= 0) {
    return 'Could not read file size. Try another image.';
  }
  if (file.size > MAX_INCIDENT_BYTES) {
    const mb = (file.size / (1024 * 1024)).toFixed(1);
    return `File is ${mb}MB. Each image must be ${MAX_INCIDENT_MB}MB or smaller.`;
  }
  return null;
}

export function validateIncidentPhotoList(files: File[]): string | null {
  if (files.length > MAX_INCIDENT_PHOTOS) {
    return `You can attach at most ${MAX_INCIDENT_PHOTOS} photos.`;
  }
  for (const f of files) {
    const err = validateIncidentPhotoFile(f);
    if (err) return `${f.name}: ${err}`;
  }
  return null;
}
