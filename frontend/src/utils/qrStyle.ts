export type QrErrorLevel = "L" | "M" | "Q" | "H";

/** Dot / module style (qr-code-styling). */
export type QrModuleShape =
  | "square"
  | "dots"
  | "rounded"
  | "extra-rounded"
  | "classy"
  | "classy-rounded";

export type QrEyeShape = "square" | "dot" | "extra-rounded";

/** Outer QR canvas shape. */
export type QrCanvasShape = "square" | "circle";

export type QrFrameId = "none" | "soft" | "brand" | "polaroid" | "badge";

export type QrStickerId = "none" | "scan" | "new" | "hot" | "verified";

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
  moduleShape: QrModuleShape;
  eyeShape: QrEyeShape;
  canvasShape: QrCanvasShape;
  frame: QrFrameId;
  sticker: QrStickerId;
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
  moduleShape: "square",
  eyeShape: "square",
  canvasShape: "square",
  frame: "none",
  sticker: "none",
};

export const QR_MODULE_SHAPES: {
  id: QrModuleShape;
  label: string;
  hint: string;
}[] = [
  { id: "square", label: "Square", hint: "Classic" },
  { id: "rounded", label: "Rounded", hint: "Soft corners" },
  { id: "extra-rounded", label: "Smooth", hint: "Extra soft" },
  { id: "dots", label: "Dots", hint: "Circles" },
  { id: "classy", label: "Classy", hint: "Elegant" },
  { id: "classy-rounded", label: "Classy+", hint: "Soft elegant" },
];

export const QR_EYE_SHAPES: { id: QrEyeShape; label: string }[] = [
  { id: "square", label: "Square" },
  { id: "dot", label: "Dot" },
  { id: "extra-rounded", label: "Rounded" },
];

export const QR_FRAMES: {
  id: QrFrameId;
  label: string;
  hint: string;
}[] = [
  { id: "none", label: "None", hint: "Bare QR" },
  { id: "soft", label: "Soft", hint: "Padded card" },
  { id: "brand", label: "Brand", hint: "Navy→cyan edge" },
  { id: "polaroid", label: "Polaroid", hint: "Photo frame" },
  { id: "badge", label: "Badge", hint: "Pill label" },
];

export const QR_STICKERS: {
  id: QrStickerId;
  label: string;
  text: string;
}[] = [
  { id: "none", label: "None", text: "" },
  { id: "scan", label: "Scan me", text: "SCAN ME" },
  { id: "new", label: "New", text: "NEW" },
  { id: "hot", label: "Hot", text: "HOT" },
  { id: "verified", label: "Verified", text: "✓ OK" },
];

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
      moduleShape: "rounded",
      eyeShape: "extra-rounded",
      frame: "brand",
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
      moduleShape: "square",
      eyeShape: "square",
      frame: "none",
    },
  },
  {
    id: "dots",
    label: "Dots",
    hint: "Circular modules",
    style: {
      fgColor: "#002b5b",
      bgColor: "#ffffff",
      moduleShape: "dots",
      eyeShape: "dot",
      frame: "soft",
      sticker: "scan",
    },
  },
  {
    id: "circle",
    label: "Circle",
    hint: "Round QR",
    style: {
      canvasShape: "circle",
      moduleShape: "rounded",
      eyeShape: "extra-rounded",
      frame: "soft",
      level: "H",
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
      frame: "polaroid",
      sticker: "scan",
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
      moduleShape: "rounded",
      frame: "badge",
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

export const QR_FEATURE_HIGHLIGHTS = [
  {
    title: "Logo inside QR",
    detail: "Upload brand mark — auto Max ECC",
  },
  {
    title: "QR shapes",
    detail: "Square, dots, rounded, classy, circle",
  },
  {
    title: "Frames & stickers",
    detail: "Brand edge, polaroid, SCAN ME badge",
  },
  {
    title: "PNG · SVG · PDF",
    detail: "Download print-ready files",
  },
  {
    title: "Dynamic QR",
    detail: "Change destination — same QR code",
  },
] as const;

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

export function qrScanability(style: QrStyle): "good" | "ok" | "weak" {
  const ratio = qrContrastRatio(style.fgColor, style.bgColor);
  if (ratio == null) return "ok";
  if (ratio >= 7) return "good";
  if (ratio >= 3) return "ok";
  return "weak";
}

const MODULE_SHAPES = new Set<string>(QR_MODULE_SHAPES.map((s) => s.id));
const EYE_SHAPES = new Set<string>(QR_EYE_SHAPES.map((s) => s.id));
const FRAMES = new Set<string>(QR_FRAMES.map((s) => s.id));
const STICKERS = new Set<string>(QR_STICKERS.map((s) => s.id));

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

  const moduleShape =
    typeof obj.moduleShape === "string" && MODULE_SHAPES.has(obj.moduleShape)
      ? (obj.moduleShape as QrModuleShape)
      : DEFAULT_QR_STYLE.moduleShape;

  const eyeShape =
    typeof obj.eyeShape === "string" && EYE_SHAPES.has(obj.eyeShape)
      ? (obj.eyeShape as QrEyeShape)
      : DEFAULT_QR_STYLE.eyeShape;

  const canvasShape =
    obj.canvasShape === "circle" ? "circle" : "square";

  const frame =
    typeof obj.frame === "string" && FRAMES.has(obj.frame)
      ? (obj.frame as QrFrameId)
      : DEFAULT_QR_STYLE.frame;

  const sticker =
    typeof obj.sticker === "string" && STICKERS.has(obj.sticker)
      ? (obj.sticker as QrStickerId)
      : DEFAULT_QR_STYLE.sticker;

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
    moduleShape,
    eyeShape,
    canvasShape,
    frame,
    sticker,
  };
}

export function stickerLabel(id: QrStickerId): string {
  return QR_STICKERS.find((s) => s.id === id)?.text ?? "";
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
