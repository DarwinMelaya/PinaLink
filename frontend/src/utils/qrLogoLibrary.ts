/**
 * Logos uploaded in the QR studio, kept in localStorage per user so they can be
 * reused on other links without re-uploading. Device-local by design: logos
 * saved on a link's QR style already sync through the database.
 */
const MAX_LOGOS = 6;

function storageKey(userId: string): string {
  return `pinalink:qr-logos:${userId}`;
}

export function loadQrLogos(userId: string): string[] {
  try {
    const raw = window.localStorage.getItem(storageKey(userId));
    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(
      (item): item is string => typeof item === "string" && item.startsWith("data:image/"),
    );
  } catch {
    return [];
  }
}

function writeQrLogos(userId: string, logos: string[]): string[] {
  // Data URLs are large; on quota errors drop the oldest until the list fits.
  let next = logos;
  while (next.length > 0) {
    try {
      window.localStorage.setItem(storageKey(userId), JSON.stringify(next));
      return next;
    } catch {
      next = next.slice(0, -1);
    }
  }
  window.localStorage.removeItem(storageKey(userId));
  return [];
}

/** Newest first. Returns the stored list, which may omit `dataUrl` if storage is full. */
export function addQrLogo(userId: string, dataUrl: string): string[] {
  const current = loadQrLogos(userId).filter((logo) => logo !== dataUrl);
  return writeQrLogos(userId, [dataUrl, ...current].slice(0, MAX_LOGOS));
}

export function removeQrLogo(userId: string, dataUrl: string): string[] {
  return writeQrLogos(
    userId,
    loadQrLogos(userId).filter((logo) => logo !== dataUrl),
  );
}
