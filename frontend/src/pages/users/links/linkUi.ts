import { isExpiringSoon, isLinkExpired } from "../../../utils/qrStyle";
import type { ShortLinkRow } from "../../../utils/shortLinkApi";

export type StudioTab = "overview" | "edit" | "qr";

/** Handlers shared by list rows, the details panel, and the page. */
export type LinkActions = {
  select: (id: string) => void;
  openStudio: (id: string, tab: "edit" | "qr") => void;
  toggleChecked: (id: string) => void;
  copy: (row: ShortLinkRow) => void;
  share: (row: ShortLinkRow) => void;
  duplicate: (row: ShortLinkRow) => void;
  toggleFavorite: (row: ShortLinkRow) => void;
  togglePause: (row: ShortLinkRow) => void;
};

const FOCUS_RING =
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--uw-cyan)]/50";

export const BTN_PRIMARY = `inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-[var(--uw-cyan)] px-4 text-sm font-semibold text-[var(--uw-on-accent)] transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-60 ${FOCUS_RING}`;

export const BTN_SECONDARY = `inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-white/10 px-3.5 text-sm font-medium text-[var(--uw-text)] transition-colors hover:bg-[var(--uw-card-hover)] disabled:cursor-not-allowed disabled:opacity-60 ${FOCUS_RING}`;

export const BTN_DANGER = `inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-[#ff6b6b]/30 px-3.5 text-sm font-medium text-[#ff8a8a] transition-colors hover:bg-[#ff6b6b]/10 disabled:cursor-not-allowed disabled:opacity-60 ${FOCUS_RING}`;

export const BTN_ICON = `inline-flex size-11 shrink-0 items-center justify-center rounded-xl text-[var(--uw-muted)] transition-colors hover:bg-[var(--uw-card-hover)] hover:text-[var(--uw-text)] disabled:cursor-not-allowed disabled:opacity-60 ${FOCUS_RING}`;

export function displayHost(shortUrl: string): string {
  return shortUrl.replace(/^https?:\/\//, "");
}

export function formatRelativeDate(iso: string): string {
  const date = new Date(iso);
  const diffMs = Date.now() - date.getTime();
  const minutes = Math.floor(diffMs / 60_000);
  if (minutes < 1) return "Just now";
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return date.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export type LinkStatus = {
  label: string;
  className: string;
};

/** One status per link, in priority order, so the list never shows conflicting badges. */
export function linkStatus(row: ShortLinkRow): LinkStatus {
  if (isLinkExpired(row.expires_at)) {
    return { label: "Expired", className: "bg-white/10 text-[var(--uw-muted)]" };
  }
  if (!row.is_active) {
    return { label: "Paused", className: "bg-[#f2a65a]/15 text-[#f2a65a]" };
  }
  if (isExpiringSoon(row.expires_at)) {
    return { label: "Expires soon", className: "bg-[#f2a65a]/15 text-[#f2a65a]" };
  }
  return { label: "Live", className: "bg-[var(--uw-cyan)]/15 text-[var(--uw-cyan)]" };
}
