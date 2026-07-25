import { useEffect, useMemo, useRef, useState } from "react";
import { QRCodeCanvas, QRCodeSVG } from "qrcode.react";
import {
  AlertTriangle,
  ArrowLeftRight,
  Check,
  CheckCircle2,
  Copy,
  Download,
  ImagePlus,
  Palette,
  RotateCcw,
  Save,
  Sparkles,
  X,
} from "lucide-react";
import type { ReactNode } from "react";
import {
  DEFAULT_QR_STYLE,
  QR_COLOR_PRESETS,
  QR_LEVEL_META,
  QR_SIZE_PRESETS,
  QR_TEMPLATES,
  parseQrStyle,
  qrContrastRatio,
  qrScanability,
  type QrErrorLevel,
  type QrStyle,
} from "../../utils/qrStyle";
import { updateShortLink, type ShortLinkRow } from "../../utils/shortLinkApi";

type QrStudioPanelProps = {
  link: ShortLinkRow;
  shortUrl: string;
  onSaved: (row: ShortLinkRow) => void;
};

type StudioSection = "look" | "logo" | "export";

const LEVELS: QrErrorLevel[] = ["L", "M", "Q", "H"];

function stylesEqual(a: QrStyle, b: QrStyle): boolean {
  return JSON.stringify(a) === JSON.stringify(b);
}

const QrStudioPanel = ({ link, shortUrl, onSaved }: QrStudioPanelProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const dropRef = useRef<HTMLLabelElement>(null);
  const [style, setStyle] = useState<QrStyle>(() => parseQrStyle(link.qr_style));
  const [savedSnapshot, setSavedSnapshot] = useState<QrStyle>(() =>
    parseQrStyle(link.qr_style),
  );
  const [section, setSection] = useState<StudioSection>("look");
  const [status, setStatus] = useState<"idle" | "saving" | "error">("idle");
  const [message, setMessage] = useState("");
  const [copied, setCopied] = useState(false);
  const [dragOver, setDragOver] = useState(false);

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

  const dirty = !stylesEqual(style, savedSnapshot);
  const scan = qrScanability(style);
  const contrast = qrContrastRatio(style.fgColor, style.bgColor);

  const logoSize = Math.round(style.size * style.logoScale);
  const imageSettings = style.logoDataUrl
    ? {
        src: style.logoDataUrl,
        height: logoSize,
        width: logoSize,
        excavate: style.excavate,
      }
    : undefined;

  const displaySize = Math.min(style.size, 260);

  function patchStyle(partial: Partial<QrStyle>) {
    setStyle((prev) => ({ ...prev, ...partial }));
  }

  function applyTemplate(partial: Partial<QrStyle>) {
    setStyle((prev) => ({
      ...prev,
      ...partial,
      // Keep existing logo unless template is logo-focused without clearing
      logoDataUrl: prev.logoDataUrl,
    }));
    setSection("look");
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

  function handleDownloadSvg() {
    const svg = document.getElementById("user-links-qr-studio");
    if (!(svg instanceof SVGElement)) return;
    const source = new XMLSerializer().serializeToString(svg);
    const blob = new Blob([source], { type: "image/svg+xml;charset=utf-8" });
    const href = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = href;
    anchor.download = `pinalink-${link.code}.svg`;
    anchor.click();
    URL.revokeObjectURL(href);
  }

  function handleDownloadPng() {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const caption = style.caption.trim();
    if (!caption) {
      const href = canvas.toDataURL("image/png");
      const anchor = document.createElement("a");
      anchor.href = href;
      anchor.download = `pinalink-${link.code}.png`;
      anchor.click();
      return;
    }

    // Composite caption under QR for print-ready card
    const pad = 24;
    const textH = 36;
    const out = document.createElement("canvas");
    out.width = canvas.width + pad * 2;
    out.height = canvas.height + pad * 2 + textH;
    const ctx = out.getContext("2d");
    if (!ctx) return;
    ctx.fillStyle = style.bgColor;
    ctx.fillRect(0, 0, out.width, out.height);
    ctx.drawImage(canvas, pad, pad);
    ctx.fillStyle = style.fgColor;
    ctx.font = "600 16px system-ui, sans-serif";
    ctx.textAlign = "center";
    ctx.fillText(caption, out.width / 2, canvas.height + pad + 24);

    const href = out.toDataURL("image/png");
    const anchor = document.createElement("a");
    anchor.href = href;
    anchor.download = `pinalink-${link.code}.png`;
    anchor.click();
  }

  async function handleCopyPng() {
    const canvas = canvasRef.current;
    if (!canvas) return;
    try {
      const blob = await new Promise<Blob | null>((resolve) =>
        canvas.toBlob(resolve, "image/png"),
      );
      if (!blob) throw new Error("Could not export PNG.");
      await navigator.clipboard.write([
        new ClipboardItem({ "image/png": blob }),
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
        "inline-flex min-h-11 flex-1 items-center justify-center gap-tight rounded-full px-snug text-label-sm font-bold transition-colors",
        section === id
          ? "uw-gradient"
          : "text-[var(--uw-muted)] hover:bg-white/5 hover:text-[var(--uw-text)]",
      ].join(" ")}
    >
      {icon}
      {label}
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

  return (
    <div className="space-y-cozy text-[var(--uw-text)]">
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

        <div
          className="mx-auto w-fit rounded-2xl p-snug shadow-inner"
          style={{ backgroundColor: style.bgColor }}
        >
          <QRCodeSVG
            id="user-links-qr-studio"
            value={shortUrl}
            size={displaySize}
            level={style.level}
            fgColor={style.fgColor}
            bgColor={style.bgColor}
            marginSize={style.marginSize}
            imageSettings={
              imageSettings
                ? {
                    ...imageSettings,
                    height: Math.round(displaySize * style.logoScale),
                    width: Math.round(displaySize * style.logoScale),
                  }
                : undefined
            }
            title={`QR for ${shortUrl}`}
          />
          {/* Full-size canvas for export */}
          <div className="sr-only" aria-hidden>
            <QRCodeCanvas
              ref={canvasRef}
              value={shortUrl}
              size={style.size}
              level={style.level}
              fgColor={style.fgColor}
              bgColor={style.bgColor}
              marginSize={style.marginSize}
              imageSettings={imageSettings}
            />
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

      {/* Section tabs */}
      <div className="flex gap-1 rounded-full bg-[var(--uw-elevated)] p-1">
        {sectionBtn("look", "Look", <Palette size={14} aria-hidden />)}
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
                title="Swap foreground and background"
              >
                <ArrowLeftRight size={14} aria-hidden />
                Invert
              </button>
            </div>

            <div className="grid grid-cols-2 gap-snug">
              <div>
                <label
                  htmlFor="qr-fg"
                  className="block mb-tight font-label-sm text-label-sm text-[var(--uw-muted)]"
                >
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
                    className="min-h-11 flex-1 rounded-full border border-white/10 bg-[var(--uw-elevated)] px-snug font-mono-label text-label-sm text-[var(--uw-text)] outline-none focus:border-[var(--uw-cyan)]/50"
                  />
                </div>
              </div>
              <div>
                <label
                  htmlFor="qr-bg"
                  className="block mb-tight font-label-sm text-label-sm text-[var(--uw-muted)]"
                >
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
                    className="min-h-11 flex-1 rounded-full border border-white/10 bg-[var(--uw-elevated)] px-snug font-mono-label text-label-sm text-[var(--uw-text)] outline-none focus:border-[var(--uw-cyan)]/50"
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
                      : "border-white/10 text-[var(--uw-muted)] hover:text-[var(--uw-text)]",
                  ].join(" ")}
                >
                  {preset.label}
                </button>
              ))}
            </div>
            <label htmlFor="qr-size" className="sr-only">
              Custom size
            </label>
            <input
              id="qr-size"
              type="range"
              min={128}
              max={400}
              step={8}
              value={style.size}
              onChange={(e) => patchStyle({ size: Number(e.target.value) })}
              className="w-full accent-[var(--uw-cyan)] min-h-11"
            />
            <p className="mt-tight text-[11px] text-[var(--uw-muted)]">
              Export size: {style.size}px
            </p>
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
                      "rounded-2xl border px-snug py-snug text-left min-h-11 transition-colors",
                      active
                        ? "border-[var(--uw-cyan)]/50 bg-[var(--uw-cyan)]/10"
                        : "border-white/10 hover:bg-white/5",
                    ].join(" ")}
                  >
                    <span
                      className={[
                        "block font-bold text-label-sm",
                        active ? "text-[var(--uw-cyan)]" : "text-[var(--uw-text)]",
                      ].join(" ")}
                    >
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
            <label
              htmlFor="qr-margin"
              className="block mb-tight font-label-sm text-label-sm text-[var(--uw-muted)]"
            >
              Quiet zone ({style.marginSize})
            </label>
            <input
              id="qr-margin"
              type="range"
              min={0}
              max={6}
              step={1}
              value={style.marginSize}
              onChange={(e) =>
                patchStyle({ marginSize: Number(e.target.value) })
              }
              className="w-full accent-[var(--uw-cyan)] min-h-11"
            />
            <p className="mt-tight text-[11px] text-[var(--uw-muted)]">
              White border around code. Print: use 3–4.
            </p>
          </div>

          <div>
            <label
              htmlFor="qr-caption"
              className="block mb-tight font-label-sm text-label-sm text-[var(--uw-muted)]"
            >
              Caption (optional)
            </label>
            <input
              id="qr-caption"
              type="text"
              maxLength={48}
              value={style.caption}
              onChange={(e) => patchStyle({ caption: e.target.value })}
              placeholder="e.g. Scan for menu"
              className="w-full min-h-12 rounded-full border border-white/10 bg-[var(--uw-elevated)] px-cozy text-body-md text-[var(--uw-text)] placeholder:text-[var(--uw-muted)] outline-none focus:border-[var(--uw-cyan)]/50"
            />
          </div>
        </div>
      ) : null}

      {section === "logo" ? (
        <div className="space-y-cozy">
          <label
            ref={dropRef}
            onDragOver={(e) => {
              e.preventDefault();
              setDragOver(true);
            }}
            onDragLeave={() => setDragOver(false)}
            onDrop={(e) => {
              e.preventDefault();
              setDragOver(false);
              const file = e.dataTransfer.files?.[0] ?? null;
              handleLogoFile(file);
            }}
            className={[
              "flex min-h-32 cursor-pointer flex-col items-center justify-center gap-tight rounded-[1.25rem] border border-dashed px-cozy py-roomy text-center transition-colors",
              dragOver
                ? "border-[var(--uw-cyan)] bg-[var(--uw-cyan)]/10"
                : "border-white/15 bg-[var(--uw-elevated)] hover:border-[var(--uw-cyan)]/40",
            ].join(" ")}
          >
            <ImagePlus
              size={28}
              className="text-[var(--uw-cyan)]"
              aria-hidden
            />
            <span className="font-bold text-body-md text-[var(--uw-text)]">
              Drop logo here or click
            </span>
            <span className="text-label-sm text-[var(--uw-muted)]">
              PNG / JPG / WebP / SVG · max 800KB
            </span>
            <input
              type="file"
              accept="image/png,image/jpeg,image/webp,image/svg+xml"
              className="sr-only"
              onChange={(e) =>
                handleLogoFile(e.target.files?.[0] ?? null)
              }
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
                  <p className="font-bold text-label-sm text-[var(--uw-text)]">
                    Logo attached
                  </p>
                  <p className="text-[11px] text-[var(--uw-muted)]">
                    ECC auto-boosted to Max when uploaded
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
                <label
                  htmlFor="qr-logo-scale"
                  className="block mb-tight font-label-sm text-label-sm text-[var(--uw-muted)]"
                >
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
                <p className="mt-tight text-[11px] text-[var(--uw-muted)]">
                  Keep under ~25% for reliable scanning.
                </p>
              </div>

              <label className="flex min-h-11 cursor-pointer items-center justify-between gap-snug rounded-2xl border border-white/10 bg-[var(--uw-elevated)] px-cozy">
                <span>
                  <span className="block font-bold text-label-sm text-[var(--uw-text)]">
                    Clear modules under logo
                  </span>
                  <span className="block text-[11px] text-[var(--uw-muted)]">
                    Excavate — cleaner look, better scans
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
            Download or copy the current preview. Save style first if you want
            this look next time you open the link.
          </p>
          <div className="grid grid-cols-1 gap-tight">
            <button
              type="button"
              onClick={handleDownloadPng}
              className="inline-flex min-h-12 items-center justify-center gap-tight rounded-full uw-gradient font-bold hover:brightness-110 transition-all"
            >
              <Download size={16} aria-hidden />
              Download PNG
              {style.caption.trim() ? " + caption" : ""}
            </button>
            <button
              type="button"
              onClick={handleDownloadSvg}
              className="inline-flex min-h-12 items-center justify-center gap-tight rounded-full border border-white/10 bg-white/5 font-bold text-[var(--uw-text)] hover:bg-white/10 transition-colors"
            >
              <Download size={16} aria-hidden />
              Download SVG
            </button>
            <button
              type="button"
              onClick={() => void handleCopyPng()}
              className="inline-flex min-h-12 items-center justify-center gap-tight rounded-full border border-white/10 bg-white/5 font-bold text-[var(--uw-text)] hover:bg-white/10 transition-colors"
            >
              {copied ? (
                <Check size={16} aria-hidden />
              ) : (
                <Copy size={16} aria-hidden />
              )}
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
          className="inline-flex min-h-11 w-full items-center justify-center gap-tight rounded-full text-[var(--uw-muted)] font-bold hover:bg-white/5 hover:text-[var(--uw-text)] transition-colors"
        >
          <RotateCcw size={16} aria-hidden />
          Reset to defaults
        </button>
      </div>
    </div>
  );
};

export default QrStudioPanel;
