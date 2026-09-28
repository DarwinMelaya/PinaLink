const CTA_BASE =
  "group inline-flex h-14 w-full items-center justify-center gap-tight rounded-full px-wide font-bold text-body-md transition-colors focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[var(--uw-cyan)] sm:w-auto";

export const PRIMARY_CTA = `${CTA_BASE} uw-glow-hover uw-gradient shadow-[0_0_32px_rgba(0,212,197,0.4)]`;

/** Brand gradient starts at #002b5b, which is unreadable as text on black. */
export const GRADIENT_TEXT =
  "bg-[linear-gradient(90deg,#3b8fe0_0%,#00d4c5_100%)] bg-clip-text text-transparent uw-text-glow";

export const SECONDARY_CTA = `${CTA_BASE} border border-white/10 bg-[var(--uw-card)] text-[var(--uw-text)] hover:border-[var(--uw-cyan)]/40 hover:bg-[var(--uw-card-hover)]`;
