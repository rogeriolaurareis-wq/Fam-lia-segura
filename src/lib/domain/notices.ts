export const NOTICE_MANUAL_LABEL = "Cópia manual — atualidade não verificada";

export function isHttpsUrl(url: string): boolean {
  try {
    const u = new URL(url);
    return u.protocol === "https:" && !!u.hostname;
  } catch {
    return false;
  }
}

/** validUntil is a local datetime string typed by the user (yyyy-mm-ddThh:mm). */
export function isNoticeExpired(validUntil: string, now: Date = new Date()): boolean {
  if (!validUntil) return false;
  const d = new Date(validUntil);
  return Number.isFinite(d.getTime()) && d < now;
}
