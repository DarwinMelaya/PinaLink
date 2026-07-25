export type QrErrorLevel = "L" | "M" | "Q" | "H";

export type QrStyle = {
  fgColor: string;
  bgColor: string;
  level: QrErrorLevel;
  size: number;
  marginSize: number;
  logoDataUrl: string | null;
  /** Logo width as fraction of QR size (0.12–0.32). */
  logoScale: number;
  /** Clear modules under the logo for cleaner scans. */
  excavate: boolean;
  /** Optional label under the QR (print / share card). */
  caption: string;
};

export const DEFAULT_QR_STYLE: QrStyle = {
  fgColor: "#002b5b",
  bgColor: "#ffffff",
  level: "M",
  size: 240,
  marginSize: 2,
  logoDataUrl: null,
  logoScale: 0.22,
  excavate: true,
  caption: "",
};

export const QR_COLOR_PRESETS = [
  { id: "pinalink", label: "Pinalink", fgColor: "#002b5b", bgColor: "#ffffff" },
  { id: "cyan", label: "Cyan", fgColor: "#007a72", bgColor: "#ecfffd" },
  { id: "ink", label: "Ink", fgColor: "#111827", bgColor: "#ffffff" },
  { id: "forest", label: "Forest", fgColor: "#166534", bgColor: "#f0fdf4" },
  { id: "sunset", label: "Sunset", fgColor: "#9a3412", bgColor: "#fff7ed" },
  { id: "night", label: "Night", fgColor: "#e2e8f0", bgColor: "#0f172a" },
  { id: "high", label: "High contrast", fgColor: "#000000", bgColor: "#ffffff" },
] as const;

export type QrTemplate = {
  id: string;
  label: string;
  hint: string;
  style: Partial<QrStyle>;
};

export const QR_TEMPLATES: QrTemplate[] = [
  {
    id: "brand",
    label: "Brand",
    hint: "Navy on white",
    style: {
      fgColor: "#002b5b",
      bgColor: "#ffffff",
      level: "M",
      marginSize: 2,
      size: 240,
    },
  },
  {
    id: "bold",
    label: "Bold",
    hint: "Max contrast",
    style: {
      fgColor: "#000000",
      bgColor: "#ffffff",
      level: "Q",
      marginSize: 3,
      size: 280,
    },
  },
  {
    id: "soft",
    label: "Soft",
    hint: "Teal wash",
    style: {
      fgColor: "#007a72",
      bgColor: "#ecfffd",
      level: "M",
      marginSize: 2,
      size: 240,
    },
  },
  {
    id: "dark",
    label: "Dark",
    hint: "Night mode",
    style: {
      fgColor: "#00d4c5",
      bgColor: "#0a0f18",
      level: "Q",
      marginSize: 2,
      size: 240,
    },
  },
  {
    id: "print",
    label: "Print",
    hint: "Large + quiet zone",
    style: {
      fgColor: "#002b5b",
      bgColor: "#ffffff",
      level: "H",
      marginSize: 4,
      size: 320,
    },
  },
  {
    id: "logo-ready",
    label: "Logo ready",
    hint: "High ECC",
    style: {
      fgColor: "#002b5b",
      bgColor: "#ffffff",
      level: "H",
      marginSize: 3,
      size: 280,
      excavate: true,
      logoScale: 0.24,
    },
  },
];

export const QR_SIZE_PRESETS = [
  { id: "s", label: "S", size: 160 },
  { id: "m", label: "M", size: 220 },
  { id: "l", label: "L", size: 280 },
  { id: "xl", label: "XL", size: 360 },
] as const;

export const QR_LEVEL_META: Record<
  QrErrorLevel,
  { label: string; hint: string }
> = {
  L: { label: "Low", hint: "Smallest · clean print" },
  M: { label: "Med", hint: "Balanced (default)" },
  Q: { label: "High", hint: "Scratched / distant" },
  H: { label: "Max", hint: "Best with logo" },
};

function clamp(n: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, n));
}

function parseHexColor(raw: string): [number, number, number] | null {
  const hex = raw.trim().replace(/^#/, "");
  if (/^[0-9a-fA-F]{6}$/.test(hex)) {
    return [
      Number.parseInt(hex.slice(0, 2), 16),
      Number.parseInt(hex.slice(2, 4), 16),
      Number.parseInt(hex.slice(4, 6), 16),
    ];
  }
  if (/^[0-9a-fA-F]{3}$/.test(hex)) {
    return [
      Number.parseInt(hex[0] + hex[0], 16),
      Number.parseInt(hex[1] + hex[1], 16),
      Number.parseInt(hex[2] + hex[2], 16),
    ];
  }
  return null;
}

function relativeLuminance([r, g, b]: [number, number, number]): number {
  const channel = (c: number) => {
    const s = c / 255;
    return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
  };
  return 0.2126 * channel(r) + 0.7152 * channel(g) + 0.0722 * channel(b);
}

/** WCAG contrast ratio. Higher = easier to scan. Target ≥ 4.5. */
export function qrContrastRatio(fg: string, bg: string): number | null {
  const a = parseHexColor(fg);
  const b = parseHexColor(bg);
  if (!a || !b) return null;
  const L1 = relativeLuminance(a);
  const L2 = relativeLuminance(b);
  const light = Math.max(L1, L2);
  const dark = Math.min(L1, L2);
  return (light + 0.05) / (dark + 0.05);
}

export function qrScanability(
  style: QrStyle,
): "good" | "ok" | "weak" {
  const ratio = qrContrastRatio(style.fgColor, style.bgColor);
  if (ratio == null) return "ok";
  if (ratio >= 7) return "good";
  if (ratio >= 3) return "ok";
  return "weak";
}

export function parseQrStyle(raw: unknown): QrStyle {
  if (!raw || typeof raw !== "object") return { ...DEFAULT_QR_STYLE };

  const obj = raw as Record<string, unknown>;
  const level =
    obj.level === "L" || obj.level === "M" || obj.level === "Q" || obj.level === "H"
      ? obj.level
      : DEFAULT_QR_STYLE.level;

  const size =
    typeof obj.size === "number" && obj.size >= 128 && obj.size <= 512
      ? Math.round(obj.size)
      : DEFAULT_QR_STYLE.size;

  const marginSize =
    typeof obj.marginSize === "number" && obj.marginSize >= 0 && obj.marginSize <= 8
      ? Math.floor(obj.marginSize)
      : DEFAULT_QR_STYLE.marginSize;

  const logoScale =
    typeof obj.logoScale === "number"
      ? clamp(obj.logoScale, 0.12, 0.32)
      : DEFAULT_QR_STYLE.logoScale;

  const caption =
    typeof obj.caption === "string"
      ? obj.caption.trim().slice(0, 48)
      : DEFAULT_QR_STYLE.caption;

  return {
    fgColor:
      typeof obj.fgColor === "string" && obj.fgColor.trim()
        ? obj.fgColor
        : DEFAULT_QR_STYLE.fgColor,
    bgColor:
      typeof obj.bgColor === "string" && obj.bgColor.trim()
        ? obj.bgColor
        : DEFAULT_QR_STYLE.bgColor,
    level,
    size,
    marginSize,
    logoDataUrl:
      typeof obj.logoDataUrl === "string" && obj.logoDataUrl.startsWith("data:image/")
        ? obj.logoDataUrl
        : null,
    logoScale,
    excavate: typeof obj.excavate === "boolean" ? obj.excavate : true,
    caption,
  };
}

export function isLinkExpired(expiresAt: string | null | undefined): boolean {
  if (!expiresAt) return false;
  return new Date(expiresAt).getTime() <= Date.now();
}

export function isLinkLive(
  isActive: boolean | null | undefined,
  expiresAt: string | null | undefined,
): boolean {
  return (isActive ?? true) && !isLinkExpired(expiresAt);
}

const CODE_PATTERN = /^[a-zA-Z0-9_-]{3,24}$/;

export function normalizeCustomCode(raw: string): string | null {
  const trimmed = raw.trim();
  if (!CODE_PATTERN.test(trimmed)) return null;
  return trimmed;
}
