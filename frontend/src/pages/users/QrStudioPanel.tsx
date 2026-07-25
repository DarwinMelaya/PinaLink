import { useEffect, useMemo, useRef, useState } from "react";
import QRCodeStyling, {
  type CornerDotType,
  type CornerSquareType,
  type DotType,
  type Options,
} from "qr-code-styling";
import { jsPDF } from "jspdf";
import {
  AlertTriangle,
  ArrowLeftRight,
  Check,
  CheckCircle2,
  Copy,
  Download,
  FileType,
  Frame,
  ImagePlus,
  Link2,
  Palette,
  RotateCcw,
  Save,
  Shapes,
  Sparkles,
  X,
  Zap,
} from "lucide-react";
import type { ReactNode } from "react";
import {
  DEFAULT_QR_STYLE,
  QR_COLOR_PRESETS,
  QR_EYE_SHAPES,
  QR_FRAMES,
  QR_LEVEL_META,
  QR_MODULE_SHAPES,
  QR_SIZE_PRESETS,
  QR_STICKERS,
  QR_TEMPLATES,
  parseQrStyle,
  qrContrastRatio,
  qrScanability,
  stickerLabel,
  type QrErrorLevel,
  type QrStyle,
} from "../../utils/qrStyle";
import { updateShortLink, type ShortLinkRow } from "../../utils/shortLinkApi";

type QrStudioPanelProps = {
  link: ShortLinkRow;
  shortUrl: string;
  onSaved: (row: ShortLinkRow) => void;
  onEditDestination?: () => void;
};

type StudioSection = "look" | "shape" | "logo" | "export";

const LEVELS: QrErrorLevel[] = ["L", "M", "Q", "H"];

function stylesEqual(a: QrStyle, b: QrStyle): boolean {
  return JSON.stringify(a) === JSON.stringify(b);
}

function buildQrOptions(style: QrStyle, data: string, size: number): Partial<Options> {
  const eyeSquare: CornerSquareType =
    style.eyeShape === "dot"
      ? "dot"
      : style.eyeShape === "extra-rounded"
        ? "extra-rounded"
        : "square";
  const eyeDot: CornerDotType =
    style.eyeShape === "extra-rounded" ? "dot" : style.eyeShape;

  return {
    width: size,
    height: size,
    type: "canvas",
    data,
    margin: style.marginSize * 4,
    shape: style.canvasShape,
    qrOptions: {
      errorCorrectionLevel: style.level,
    },
    image: style.logoDataUrl ?? undefined,
    imageOptions: {
      hideBackgroundDots: style.excavate,
      imageSize: style.logoScale,
      margin: 4,
      crossOrigin: "anonymous",
    },
    dotsOptions: {
      type: style.moduleShape as DotType,
      color: style.fgColor,
    },
    cornersSquareOptions: {
      type: eyeSquare,
      color: style.fgColor,
    },
    cornersDotOptions: {
      type: eyeDot,
      color: style.fgColor,
    },
    backgroundOptions: {
      color: style.bgColor,
    },
  };
}

function frameClass(frame: QrStyle["frame"]): string {
  switch (frame) {
    case "soft":
      return "rounded-[1.5rem] bg-white/95 p-4 shadow-lg";
    case "brand":
      return "rounded-[1.5rem] p-[3px] uw-gradient shadow-[0_0_24px_rgba(0,212,197,0.25)]";
    case "polaroid":
      return "rounded-sm bg-white p-3 pb-10 shadow-xl";
    case "badge":
      return "rounded-[1.75rem] border-4 border-[var(--uw-cyan)] bg-white p-3";
    default:
      return "rounded-2xl p-2";
  }
}

async function blobToDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") resolve(reader.result);
      else reject(new Error("Could not read blob."));
    };
    reader.onerror = () => reject(new Error("Could not read blob."));
    reader.readAsDataURL(blob);
  });
}

async function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("Could not load QR image."));
    img.src = src;
  });
}

/** Bake frame / sticker / caption into a downloadable PNG canvas. */
async function composeExportCanvas(
  qrBlob: Blob,
  style: QrStyle,
): Promise<HTMLCanvasElement> {
  const dataUrl = await blobToDataUrl(qrBlob);
  const qrImg = await loadImage(dataUrl);
  const pad =
    style.frame === "none" ? 16 : style.frame === "polaroid" ? 28 : 24;
  const captionH = style.caption.trim() ? 40 : 0;
  const polaroidExtra = style.frame === "polaroid" ? 36 : 0;
  const badgeExtra = style.frame === "badge" ? 8 : 0;
  const stickerExtra = style.sticker !== "none" ? 12 : 0;

  const out = document.createElement("canvas");
  out.width = qrImg.width + pad * 2 + badgeExtra * 2;
  out.height =
    qrImg.height + pad * 2 + captionH + polaroidExtra + badgeExtra * 2 + stickerExtra;
  const ctx = out.getContext("2d");
  if (!ctx) throw new Error("Canvas unavailable.");

  // Background / frame fill
  if (style.frame === "brand") {
    const grad = ctx.createLinearGradient(0, 0, out.width, 0);
    grad.addColorStop(0, "#002b5b");
    grad.addColorStop(1, "#00d4c5");
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, out.width, out.height);
    ctx.fillStyle = style.bgColor;
    const inset = 6;
    ctx.fillRect(inset, inset, out.width - inset * 2, out.height - inset * 2 - captionH);
  } else if (style.frame === "none") {
    ctx.fillStyle = style.bgColor;
    ctx.fillRect(0, 0, out.width, out.height);
  } else {
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, out.width, out.height);
  }

  const qrX = (out.width - qrImg.width) / 2;
  const qrY = pad + badgeExtra;
  ctx.drawImage(qrImg, qrX, qrY);

  const sticker = stickerLabel(style.sticker);
  if (sticker) {
    ctx.font = "bold 12px system-ui, sans-serif";
    const tw = Math.max(56, ctx.measureText(sticker).width + 24);
    const bx = out.width - tw - 12;
    const by = 10;
    ctx.fillStyle = "#00d4c5";
    const r = 14;
    ctx.beginPath();
    ctx.moveTo(bx + r, by);
    ctx.arcTo(bx + tw, by, bx + tw, by + 28, r);
    ctx.arcTo(bx + tw, by + 28, bx, by + 28, r);
    ctx.arcTo(bx, by + 28, bx, by, r);
    ctx.arcTo(bx, by, bx + tw, by, r);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = "#001428";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(sticker, bx + tw / 2, by + 14);
  }

  if (style.frame === "badge") {
    ctx.fillStyle = "#00d4c5";
    ctx.font = "bold 11px system-ui, sans-serif";
    ctx.textAlign = "center";
    ctx.fillText("PINALINK", out.width / 2, 18);
  }

  if (style.caption.trim()) {
    ctx.fillStyle = style.fgColor;
    ctx.font = "600 16px system-ui, sans-serif";
    ctx.textAlign = "center";
    ctx.fillText(
      style.caption.trim(),
      out.width / 2,
      qrY + qrImg.height + 28,
    );
  }

  return out;
}

const QrStudioPanel = ({
  link,
  shortUrl,
  onSaved,
  onEditDestination,
}: QrStudioPanelProps) => {
  const mountRef = useRef<HTMLDivElement>(null);
  const qrRef = useRef<QRCodeStyling | null>(null);
  const [style, setStyle] = useState<QrStyle>(() => parseQrStyle(link.qr_style));
  const [savedSnapshot, setSavedSnapshot] = useState<QrStyle>(() =>
    parseQrStyle(link.qr_style),
  );
  const [section, setSection] = useState<StudioSection>("look");
  const [status, setStatus] = useState<"idle" | "saving" | "error">("idle");
  const [message, setMessage] = useState("");
  const [copied, setCopied] = useState(false);
  const [dragOver, setDragOver] = useState(false);

  const displaySize = Math.min(style.size, 240);

  useEffect(() => {
    const next = parseQrStyle(link.qr_style);
    setStyle(next);
    setSavedSnapshot(next);
    setStatus("idle");
    setMessage("");
    setCopied(false);
    setSection("look");
  }, [link.id, link.qr_style]);

  useEffect(() => {
    if (!copied) return;
    const t = window.setTimeout(() => setCopied(false), 2000);
    return () => window.clearTimeout(t);
  }, [copied]);

  // Mount / update styled QR
  useEffect(() => {
    if (!mountRef.current) return;
    const options = buildQrOptions(style, shortUrl, displaySize);

    if (!qrRef.current) {
      qrRef.current = new QRCodeStyling(options);
      mountRef.current.innerHTML = "";
      qrRef.current.append(mountRef.current);
    } else {
      qrRef.current.update(options);
    }
  }, [style, shortUrl, displaySize]);

  const dirty = !stylesEqual(style, savedSnapshot);
  const scan = qrScanability(style);
  const contrast = qrContrastRatio(style.fgColor, style.bgColor);

  function patchStyle(partial: Partial<QrStyle>) {
    setStyle((prev) => ({ ...prev, ...partial }));
  }

  function applyTemplate(partial: Partial<QrStyle>) {
    setStyle((prev) => ({
      ...prev,
      ...partial,
      logoDataUrl: prev.logoDataUrl,
    }));
    setSection("look");
  }

  async function getFullSizeBlob(
    extension: "png" | "svg" | "jpeg" = "png",
  ): Promise<Blob> {
    const exporter = new QRCodeStyling(
      buildQrOptions(style, shortUrl, style.size),
    );
    const raw = await exporter.getRawData(extension);
    if (!raw || !(raw instanceof Blob)) {
      throw new Error("Could not generate QR file.");
    }
    return raw;
  }

  async function handleSaveStyle() {
    setStatus("saving");
    setMessage("");
    try {
      const row = await updateShortLink(link.id, { qr_style: style });
      onSaved(row);
      setSavedSnapshot(style);
      setStatus("idle");
      setMessage("QR style saved.");
    } catch (err) {
      setStatus("error");
      setMessage(err instanceof Error ? err.message : "Save failed.");
    }
  }

  async function handleDownloadSvg() {
    try {
      const blob = await getFullSizeBlob("svg");
      const href = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = href;
      anchor.download = `pinalink-${link.code}.svg`;
      anchor.click();
      URL.revokeObjectURL(href);
    } catch (err) {
      setStatus("error");
      setMessage(err instanceof Error ? err.message : "SVG export failed.");
    }
  }

  async function handleDownloadPng() {
    try {
      const blob = await getFullSizeBlob("png");
      const canvas = await composeExportCanvas(blob, style);
      const href = canvas.toDataURL("image/png");
      const anchor = document.createElement("a");
      anchor.href = href;
      anchor.download = `pinalink-${link.code}.png`;
      anchor.click();
    } catch (err) {
      setStatus("error");
      setMessage(err instanceof Error ? err.message : "PNG export failed.");
    }
  }

  async function handleDownloadPdf() {
    try {
      const blob = await getFullSizeBlob("png");
      const canvas = await composeExportCanvas(blob, style);
      const img = canvas.toDataURL("image/png");
      const pdf = new jsPDF({
        orientation: canvas.width >= canvas.height ? "landscape" : "portrait",
        unit: "pt",
        format: "a4",
      });
      const pageW = pdf.internal.pageSize.getWidth();
      const pageH = pdf.internal.pageSize.getHeight();
      const maxW = pageW - 72;
      const maxH = pageH - 72;
      const scale = Math.min(maxW / canvas.width, maxH / canvas.height);
      const w = canvas.width * scale;
      const h = canvas.height * scale;
      pdf.addImage(img, "PNG", (pageW - w) / 2, (pageH - h) / 2, w, h);
      pdf.save(`pinalink-${link.code}.pdf`);
    } catch (err) {
      setStatus("error");
      setMessage(err instanceof Error ? err.message : "PDF export failed.");
    }
  }

  async function handleCopyPng() {
    try {
      const blob = await getFullSizeBlob("png");
      const canvas = await composeExportCanvas(blob, style);
      const outBlob = await new Promise<Blob | null>((resolve) =>
        canvas.toBlob(resolve, "image/png"),
      );
      if (!outBlob) throw new Error("Could not export PNG.");
      await navigator.clipboard.write([
        new ClipboardItem({ "image/png": outBlob }),
      ]);
      setCopied(true);
      setMessage("");
    } catch {
      setStatus("error");
      setMessage("Copy image failed — download PNG instead.");
    }
  }

  function handleLogoFile(file: File | null) {
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setStatus("error");
      setMessage("Logo must be an image file.");
      return;
    }
    if (file.size > 800_000) {
      setStatus("error");
      setMessage("Logo max 800KB.");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result;
      if (typeof result === "string") {
        patchStyle({ logoDataUrl: result, level: "H", excavate: true });
        setMessage("Logo added · ECC set to Max for reliable scans.");
        setStatus("idle");
        setSection("logo");
      }
    };
    reader.readAsDataURL(file);
  }

  const sectionBtn = (id: StudioSection, label: string, icon: ReactNode) => (
    <button
      type="button"
      onClick={() => setSection(id)}
      className={[
        "inline-flex min-h-11 flex-1 items-center justify-center gap-1 rounded-full px-2 text-[12px] font-bold transition-colors sm:gap-tight sm:px-snug sm:text-label-sm",
        section === id
          ? "uw-gradient"
          : "text-[var(--uw-muted)] hover:bg-white/5 hover:text-[var(--uw-text)]",
      ].join(" ")}
    >
      {icon}
      <span className="hidden xs:inline sm:inline">{label}</span>
      <span className="sm:hidden">{label}</span>
    </button>
  );

  const scanBadge = useMemo(() => {
    if (scan === "good") {
      return {
        className: "text-[var(--uw-cyan)] bg-[var(--uw-cyan)]/10",
        icon: <CheckCircle2 size={14} aria-hidden />,
        text: contrast
          ? `Easy to scan · ${contrast.toFixed(1)}:1`
          : "Easy to scan",
      };
    }
    if (scan === "ok") {
      return {
        className: "text-[var(--uw-text)] bg-white/10",
        icon: <CheckCircle2 size={14} aria-hidden />,
        text: contrast
          ? `OK contrast · ${contrast.toFixed(1)}:1`
          : "OK contrast",
      };
    }
    return {
      className: "text-[#ffb020] bg-[#ffb020]/10",
      icon: <AlertTriangle size={14} aria-hidden />,
      text: "Hard to scan — boost contrast",
    };
  }, [scan, contrast]);

  const stickerText = stickerLabel(style.sticker);

  return (
    <div className="space-y-cozy text-[var(--uw-text)]">
      {/* Dynamic QR callout */}
      <div className="rounded-[1.25rem] border border-[var(--uw-cyan)]/25 bg-[var(--uw-cyan)]/10 p-snug">
        <p className="flex items-start gap-tight font-bold text-label-sm text-[var(--uw-cyan)]">
          <Zap size={16} className="mt-0.5 shrink-0" aria-hidden />
          Dynamic QR
        </p>
        <p className="mt-tight text-[12px] text-[var(--uw-muted)] leading-snug">
          This QR encodes your short link. Change the destination anytime —
          printed QR stays the same.
        </p>
        {onEditDestination ? (
          <button
            type="button"
            onClick={onEditDestination}
            className="mt-snug inline-flex min-h-11 items-center gap-tight rounded-full bg-[var(--uw-cyan)]/15 px-cozy text-label-sm font-bold text-[var(--uw-cyan)] hover:bg-[var(--uw-cyan)]/25 transition-colors"
          >
            <Link2 size={14} aria-hidden />
            Edit destination
          </button>
        ) : null}
      </div>

      {/* Live preview */}
      <div className="rounded-[1.25rem] border border-white/5 bg-[var(--uw-elevated)] p-snug">
        <div className="flex items-center justify-between gap-snug mb-snug">
          <p className="font-label-sm text-label-sm uppercase tracking-wide text-[var(--uw-muted)]">
            Live preview
          </p>
          {dirty ? (
            <span className="inline-flex min-h-8 items-center rounded-full bg-[var(--uw-orange)]/20 px-snug text-[11px] font-bold text-[#9ec5ff]">
              Unsaved
            </span>
          ) : (
            <span className="inline-flex min-h-8 items-center rounded-full bg-[var(--uw-cyan)]/15 px-snug text-[11px] font-bold text-[var(--uw-cyan)]">
              Saved
            </span>
          )}
        </div>

        <div className="relative mx-auto w-fit">
          {stickerText ? (
            <span className="absolute -top-2 -right-2 z-10 inline-flex min-h-8 items-center rounded-full bg-[var(--uw-cyan)] px-snug text-[10px] font-bold text-[var(--uw-on-accent)] shadow-lg">
              {stickerText}
            </span>
          ) : null}
          <div className={frameClass(style.frame)}>
            <div
              className={
                style.frame === "brand"
                  ? "rounded-[1.35rem] bg-white p-3"
                  : undefined
              }
            >
              <div
                ref={mountRef}
                className="flex justify-center [&_canvas]:max-w-full"
              />
            </div>
            {style.frame === "badge" ? (
              <p className="mt-2 text-center text-[10px] font-bold tracking-widest text-[#007a72]">
                PINALINK
              </p>
            ) : null}
          </div>
        </div>

        {style.caption.trim() ? (
          <p
            className="mt-snug text-center font-bold text-label-sm truncate px-tight"
            style={{ color: style.fgColor }}
          >
            {style.caption.trim()}
          </p>
        ) : null}

        <div
          className={`mt-snug inline-flex w-full items-center justify-center gap-tight rounded-full px-snug py-2 text-label-sm font-bold ${scanBadge.className}`}
          role="status"
        >
          {scanBadge.icon}
          {scanBadge.text}
        </div>
      </div>

      <div className="flex gap-1 rounded-full bg-[var(--uw-elevated)] p-1">
        {sectionBtn("look", "Look", <Palette size={14} aria-hidden />)}
        {sectionBtn("shape", "Shape", <Shapes size={14} aria-hidden />)}
        {sectionBtn("logo", "Logo", <ImagePlus size={14} aria-hidden />)}
        {sectionBtn("export", "Export", <Download size={14} aria-hidden />)}
      </div>

      {section === "look" ? (
        <div className="space-y-cozy">
          <div>
            <p className="mb-tight font-label-sm text-label-sm text-[var(--uw-muted)] flex items-center gap-tight">
              <Sparkles size={14} aria-hidden />
              Quick templates
            </p>
            <div className="grid grid-cols-2 gap-tight">
              {QR_TEMPLATES.map((tpl) => (
                <button
                  key={tpl.id}
                  type="button"
                  onClick={() => applyTemplate(tpl.style)}
                  className="rounded-2xl border border-white/10 bg-[var(--uw-elevated)] px-snug py-snug text-left hover:border-[var(--uw-cyan)]/40 transition-colors min-h-11"
                >
                  <span className="block font-bold text-label-sm text-[var(--uw-text)]">
                    {tpl.label}
                  </span>
                  <span className="block text-[11px] text-[var(--uw-muted)]">
                    {tpl.hint}
                  </span>
                </button>
              ))}
            </div>
          </div>

          <div>
            <p className="mb-tight font-label-sm text-label-sm text-[var(--uw-muted)]">
              Colors
            </p>
            <div className="flex flex-wrap gap-tight mb-snug">
              {QR_COLOR_PRESETS.map((preset) => {
                const active =
                  style.fgColor.toLowerCase() === preset.fgColor.toLowerCase() &&
                  style.bgColor.toLowerCase() === preset.bgColor.toLowerCase();
                return (
                  <button
                    key={preset.id}
                    type="button"
                    onClick={() =>
                      patchStyle({
                        fgColor: preset.fgColor,
                        bgColor: preset.bgColor,
                      })
                    }
                    title={preset.label}
                    aria-label={preset.label}
                    aria-pressed={active}
                    className={[
                      "inline-flex size-11 items-center justify-center rounded-full border transition-transform hover:scale-105",
                      active
                        ? "border-[var(--uw-cyan)] ring-2 ring-[var(--uw-cyan)]/30"
                        : "border-white/10",
                    ].join(" ")}
                    style={{
                      background: `linear-gradient(135deg, ${preset.fgColor} 50%, ${preset.bgColor} 50%)`,
                    }}
                  />
                );
              })}
              <button
                type="button"
                onClick={() =>
                  patchStyle({
                    fgColor: style.bgColor,
                    bgColor: style.fgColor,
                  })
                }
                className="inline-flex min-h-11 items-center gap-tight rounded-full border border-white/10 bg-[var(--uw-elevated)] px-snug text-label-sm font-bold text-[var(--uw-text)] hover:bg-white/5"
              >
                <ArrowLeftRight size={14} aria-hidden />
                Invert
              </button>
            </div>
            <div className="grid grid-cols-2 gap-snug">
              <div>
                <label htmlFor="qr-fg" className="block mb-tight font-label-sm text-label-sm text-[var(--uw-muted)]">
                  Foreground
                </label>
                <div className="flex items-center gap-tight">
                  <input
                    id="qr-fg"
                    type="color"
                    value={style.fgColor}
                    onChange={(e) => patchStyle({ fgColor: e.target.value })}
                    className="size-11 rounded-full border border-white/10 cursor-pointer bg-transparent shrink-0"
                  />
                  <input
                    type="text"
                    value={style.fgColor}
                    onChange={(e) => patchStyle({ fgColor: e.target.value })}
                    className="min-h-11 flex-1 rounded-full border border-white/10 bg-[var(--uw-elevated)] px-snug font-mono-label text-label-sm text-[var(--uw-text)] outline-none"
                  />
                </div>
              </div>
              <div>
                <label htmlFor="qr-bg" className="block mb-tight font-label-sm text-label-sm text-[var(--uw-muted)]">
                  Background
                </label>
                <div className="flex items-center gap-tight">
                  <input
                    id="qr-bg"
                    type="color"
                    value={style.bgColor}
                    onChange={(e) => patchStyle({ bgColor: e.target.value })}
                    className="size-11 rounded-full border border-white/10 cursor-pointer bg-transparent shrink-0"
                  />
                  <input
                    type="text"
                    value={style.bgColor}
                    onChange={(e) => patchStyle({ bgColor: e.target.value })}
                    className="min-h-11 flex-1 rounded-full border border-white/10 bg-[var(--uw-elevated)] px-snug font-mono-label text-label-sm text-[var(--uw-text)] outline-none"
                  />
                </div>
              </div>
            </div>
          </div>

          <div>
            <p className="mb-tight font-label-sm text-label-sm text-[var(--uw-muted)]">
              Size
            </p>
            <div className="flex flex-wrap gap-tight mb-snug">
              {QR_SIZE_PRESETS.map((preset) => (
                <button
                  key={preset.id}
                  type="button"
                  onClick={() => patchStyle({ size: preset.size })}
                  className={[
                    "min-h-11 min-w-11 rounded-full border px-snug font-bold transition-colors",
                    style.size === preset.size
                      ? "uw-gradient border-transparent"
                      : "border-white/10 text-[var(--uw-muted)]",
                  ].join(" ")}
                >
                  {preset.label}
                </button>
              ))}
            </div>
            <input
              type="range"
              min={128}
              max={400}
              step={8}
              value={style.size}
              onChange={(e) => patchStyle({ size: Number(e.target.value) })}
              className="w-full accent-[var(--uw-cyan)] min-h-11"
              aria-label="QR size"
            />
          </div>

          <div>
            <p className="mb-tight font-label-sm text-label-sm text-[var(--uw-muted)]">
              Error correction
            </p>
            <div className="grid grid-cols-2 gap-tight">
              {LEVELS.map((level) => {
                const meta = QR_LEVEL_META[level];
                const active = style.level === level;
                return (
                  <button
                    key={level}
                    type="button"
                    onClick={() => patchStyle({ level })}
                    className={[
                      "rounded-2xl border px-snug py-snug text-left min-h-11",
                      active
                        ? "border-[var(--uw-cyan)]/50 bg-[var(--uw-cyan)]/10"
                        : "border-white/10 hover:bg-white/5",
                    ].join(" ")}
                  >
                    <span className={`block font-bold text-label-sm ${active ? "text-[var(--uw-cyan)]" : ""}`}>
                      {level} · {meta.label}
                    </span>
                    <span className="block text-[11px] text-[var(--uw-muted)]">
                      {meta.hint}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <label htmlFor="qr-caption" className="block mb-tight font-label-sm text-label-sm text-[var(--uw-muted)]">
              Caption (optional)
            </label>
            <input
              id="qr-caption"
              type="text"
              maxLength={48}
              value={style.caption}
              onChange={(e) => patchStyle({ caption: e.target.value })}
              placeholder="e.g. Scan for menu"
              className="w-full min-h-12 rounded-full border border-white/10 bg-[var(--uw-elevated)] px-cozy text-body-md text-[var(--uw-text)] placeholder:text-[var(--uw-muted)] outline-none"
            />
          </div>
        </div>
      ) : null}

      {section === "shape" ? (
        <div className="space-y-cozy">
          <div>
            <p className="mb-tight font-label-sm text-label-sm text-[var(--uw-muted)] flex items-center gap-tight">
              <Shapes size={14} aria-hidden />
              Module shape
            </p>
            <div className="grid grid-cols-2 gap-tight">
              {QR_MODULE_SHAPES.map((shape) => (
                <button
                  key={shape.id}
                  type="button"
                  onClick={() => patchStyle({ moduleShape: shape.id })}
                  className={[
                    "rounded-2xl border px-snug py-snug text-left min-h-11",
                    style.moduleShape === shape.id
                      ? "border-[var(--uw-cyan)]/50 bg-[var(--uw-cyan)]/10"
                      : "border-white/10 hover:bg-white/5",
                  ].join(" ")}
                >
                  <span className="block font-bold text-label-sm">{shape.label}</span>
                  <span className="block text-[11px] text-[var(--uw-muted)]">
                    {shape.hint}
                  </span>
                </button>
              ))}
            </div>
          </div>

          <div>
            <p className="mb-tight font-label-sm text-label-sm text-[var(--uw-muted)]">
              Finder eyes
            </p>
            <div className="flex flex-wrap gap-tight">
              {QR_EYE_SHAPES.map((eye) => (
                <button
                  key={eye.id}
                  type="button"
                  onClick={() => patchStyle({ eyeShape: eye.id })}
                  className={[
                    "min-h-11 rounded-full border px-cozy font-bold text-label-sm",
                    style.eyeShape === eye.id
                      ? "uw-gradient border-transparent"
                      : "border-white/10 text-[var(--uw-muted)]",
                  ].join(" ")}
                >
                  {eye.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <p className="mb-tight font-label-sm text-label-sm text-[var(--uw-muted)]">
              Canvas shape
            </p>
            <div className="flex gap-tight">
              {(["square", "circle"] as const).map((shape) => (
                <button
                  key={shape}
                  type="button"
                  onClick={() => patchStyle({ canvasShape: shape })}
                  className={[
                    "min-h-11 flex-1 rounded-full border px-cozy font-bold capitalize",
                    style.canvasShape === shape
                      ? "uw-gradient border-transparent"
                      : "border-white/10 text-[var(--uw-muted)]",
                  ].join(" ")}
                >
                  {shape}
                </button>
              ))}
            </div>
          </div>

          <div>
            <p className="mb-tight font-label-sm text-label-sm text-[var(--uw-muted)] flex items-center gap-tight">
              <Frame size={14} aria-hidden />
              Frames
            </p>
            <div className="grid grid-cols-2 gap-tight">
              {QR_FRAMES.map((frame) => (
                <button
                  key={frame.id}
                  type="button"
                  onClick={() => patchStyle({ frame: frame.id })}
                  className={[
                    "rounded-2xl border px-snug py-snug text-left min-h-11",
                    style.frame === frame.id
                      ? "border-[var(--uw-cyan)]/50 bg-[var(--uw-cyan)]/10"
                      : "border-white/10 hover:bg-white/5",
                  ].join(" ")}
                >
                  <span className="block font-bold text-label-sm">{frame.label}</span>
                  <span className="block text-[11px] text-[var(--uw-muted)]">
                    {frame.hint}
                  </span>
                </button>
              ))}
            </div>
          </div>

          <div>
            <p className="mb-tight font-label-sm text-label-sm text-[var(--uw-muted)]">
              Stickers
            </p>
            <div className="flex flex-wrap gap-tight">
              {QR_STICKERS.map((sticker) => (
                <button
                  key={sticker.id}
                  type="button"
                  onClick={() => patchStyle({ sticker: sticker.id })}
                  className={[
                    "min-h-11 rounded-full border px-cozy font-bold text-label-sm",
                    style.sticker === sticker.id
                      ? "uw-gradient border-transparent"
                      : "border-white/10 text-[var(--uw-muted)]",
                  ].join(" ")}
                >
                  {sticker.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      ) : null}

      {section === "logo" ? (
        <div className="space-y-cozy">
          <label
            onDragOver={(e) => {
              e.preventDefault();
              setDragOver(true);
            }}
            onDragLeave={() => setDragOver(false)}
            onDrop={(e) => {
              e.preventDefault();
              setDragOver(false);
              handleLogoFile(e.dataTransfer.files?.[0] ?? null);
            }}
            className={[
              "flex min-h-32 cursor-pointer flex-col items-center justify-center gap-tight rounded-[1.25rem] border border-dashed px-cozy py-roomy text-center transition-colors",
              dragOver
                ? "border-[var(--uw-cyan)] bg-[var(--uw-cyan)]/10"
                : "border-white/15 bg-[var(--uw-elevated)] hover:border-[var(--uw-cyan)]/40",
            ].join(" ")}
          >
            <ImagePlus size={28} className="text-[var(--uw-cyan)]" aria-hidden />
            <span className="font-bold text-body-md">Drop logo here or click</span>
            <span className="text-label-sm text-[var(--uw-muted)]">
              PNG / JPG / WebP / SVG · max 800KB
            </span>
            <input
              type="file"
              accept="image/png,image/jpeg,image/webp,image/svg+xml"
              className="sr-only"
              onChange={(e) => handleLogoFile(e.target.files?.[0] ?? null)}
            />
          </label>

          {style.logoDataUrl ? (
            <>
              <div className="flex items-center gap-snug rounded-2xl border border-white/10 bg-[var(--uw-elevated)] p-snug">
                <img
                  src={style.logoDataUrl}
                  alt=""
                  className="size-14 rounded-xl object-contain bg-white"
                />
                <div className="min-w-0 flex-1">
                  <p className="font-bold text-label-sm">Logo attached</p>
                  <p className="text-[11px] text-[var(--uw-muted)]">
                    ECC auto-boosted to Max
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => patchStyle({ logoDataUrl: null })}
                  className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-full text-[#ff6b6b] hover:bg-[#ff6b6b]/10"
                  aria-label="Remove logo"
                >
                  <X size={18} aria-hidden />
                </button>
              </div>
              <div>
                <label htmlFor="qr-logo-scale" className="block mb-tight font-label-sm text-label-sm text-[var(--uw-muted)]">
                  Logo size ({Math.round(style.logoScale * 100)}%)
                </label>
                <input
                  id="qr-logo-scale"
                  type="range"
                  min={12}
                  max={32}
                  step={1}
                  value={Math.round(style.logoScale * 100)}
                  onChange={(e) =>
                    patchStyle({ logoScale: Number(e.target.value) / 100 })
                  }
                  className="w-full accent-[var(--uw-cyan)] min-h-11"
                />
              </div>
              <label className="flex min-h-11 cursor-pointer items-center justify-between gap-snug rounded-2xl border border-white/10 bg-[var(--uw-elevated)] px-cozy">
                <span>
                  <span className="block font-bold text-label-sm">
                    Clear modules under logo
                  </span>
                  <span className="block text-[11px] text-[var(--uw-muted)]">
                    Excavate — cleaner scans
                  </span>
                </span>
                <input
                  type="checkbox"
                  checked={style.excavate}
                  onChange={(e) => patchStyle({ excavate: e.target.checked })}
                  className="size-5 accent-[var(--uw-cyan)]"
                />
              </label>
            </>
          ) : (
            <p className="text-body-md text-[var(--uw-muted)] text-center py-snug">
              No logo yet. Brand mark in center makes QR yours.
            </p>
          )}
        </div>
      ) : null}

      {section === "export" ? (
        <div className="space-y-cozy">
          <p className="text-body-md text-[var(--uw-muted)]">
            Download PNG, SVG, or PDF. Frame + sticker bake into PNG/PDF.
          </p>
          <div className="grid grid-cols-1 gap-tight">
            <button
              type="button"
              onClick={() => void handleDownloadPng()}
              className="inline-flex min-h-12 items-center justify-center gap-tight rounded-full uw-gradient font-bold hover:brightness-110 transition-all"
            >
              <Download size={16} aria-hidden />
              Download PNG
            </button>
            <button
              type="button"
              onClick={() => void handleDownloadSvg()}
              className="inline-flex min-h-12 items-center justify-center gap-tight rounded-full border border-white/10 bg-white/5 font-bold hover:bg-white/10"
            >
              <Download size={16} aria-hidden />
              Download SVG
            </button>
            <button
              type="button"
              onClick={() => void handleDownloadPdf()}
              className="inline-flex min-h-12 items-center justify-center gap-tight rounded-full border border-white/10 bg-white/5 font-bold hover:bg-white/10"
            >
              <FileType size={16} aria-hidden />
              Download PDF
            </button>
            <button
              type="button"
              onClick={() => void handleCopyPng()}
              className="inline-flex min-h-12 items-center justify-center gap-tight rounded-full border border-white/10 bg-white/5 font-bold hover:bg-white/10"
            >
              {copied ? <Check size={16} aria-hidden /> : <Copy size={16} aria-hidden />}
              {copied ? "Copied to clipboard" : "Copy PNG"}
            </button>
          </div>
        </div>
      ) : null}

      {message ? (
        <p
          className={`text-body-md ${status === "error" ? "text-[#ff6b6b]" : "text-[var(--uw-cyan)]"}`}
          role="status"
        >
          {message}
        </p>
      ) : null}

      <div className="flex flex-col gap-tight border-t border-white/5 pt-cozy">
        <button
          type="button"
          onClick={() => void handleSaveStyle()}
          disabled={status === "saving" || !dirty}
          className="inline-flex min-h-12 w-full items-center justify-center gap-tight rounded-full uw-gradient font-bold hover:brightness-110 disabled:opacity-50 transition-all"
        >
          <Save size={16} aria-hidden />
          {status === "saving"
            ? "Saving…"
            : dirty
              ? "Save QR style"
              : "All changes saved"}
        </button>
        <button
          type="button"
          onClick={() => {
            setStyle({ ...DEFAULT_QR_STYLE });
            setMessage("");
          }}
          className="inline-flex min-h-11 w-full items-center justify-center gap-tight rounded-full text-[var(--uw-muted)] font-bold hover:bg-white/5"
        >
          <RotateCcw size={16} aria-hidden />
          Reset to defaults
        </button>
      </div>
    </div>
  );
};

export default QrStudioPanel;
