import { useEffect, useMemo, useState, type FormEvent } from "react";
import { Link } from "react-router-dom";
import { QRCodeSVG } from "qrcode.react";
import { Check, ClipboardPaste, Copy, Download, QrCode, Settings2, Share2 } from "lucide-react";
import { getSession } from "../../../utils/authApi";
import { buildShortUrl, normalizeUrl } from "../../../utils/shortLink";
import { createShortLink, type ShortLinkRow } from "../../../utils/shortLinkApi";
import { BTN_ICON, BTN_PRIMARY, BTN_SECONDARY, displayHost } from "../links/linkUi";

type BatchResult = {
  created: ShortLinkRow[];
  failed: string[];
};

type ShortenFormProps = {
  onCreated: (rows: ShortLinkRow[]) => void;
  onOpenStudio: (id: string, tab: "edit" | "qr") => void;
};

const INPUT_CLASS =
  "block w-full rounded-xl border border-white/10 bg-[var(--uw-elevated)] px-3.5 text-[15px] text-[var(--uw-text)] outline-none transition-colors placeholder:text-[var(--uw-muted)]/70 hover:border-white/20 focus:border-[var(--uw-cyan)]/60 focus:ring-2 focus:ring-[var(--uw-cyan)]/15";

const QR_SVG_ID = "user-pinalink-qr";

function parseUrlLines(raw: string): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const line of raw.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed) continue;
    const normalized = normalizeUrl(trimmed);
    if (!normalized || seen.has(normalized)) continue;
    seen.add(normalized);
    out.push(normalized);
  }
  return out;
}

const ShortenForm = ({ onCreated, onOpenStudio }: ShortenFormProps) => {
  const [urlInput, setUrlInput] = useState("");
  const [titleInput, setTitleInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [result, setResult] = useState<ShortLinkRow | null>(null);
  const [batch, setBatch] = useState<BatchResult | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const lineCount = useMemo(
    () => urlInput.split(/\r?\n/).filter((line) => line.trim()).length,
    [urlInput],
  );

  useEffect(() => {
    if (!copiedId) return;
    const timer = window.setTimeout(() => setCopiedId(null), 2000);
    return () => window.clearTimeout(timer);
  }, [copiedId]);

  async function copy(row: ShortLinkRow) {
    try {
      await navigator.clipboard.writeText(buildShortUrl(row.code));
      setCopiedId(row.id);
    } catch {
      setErrorMessage("Copy failed. Select the link and copy it manually.");
    }
  }

  async function handlePaste() {
    try {
      const text = (await navigator.clipboard.readText()).trim();
      if (!text) {
        setErrorMessage("Your clipboard is empty.");
        return;
      }
      setUrlInput((prev) => (prev.trim() ? `${prev.trim()}\n${text}` : text));
      setErrorMessage("");
      document.getElementById("user-url-input")?.focus();
    } catch {
      setErrorMessage("Could not read the clipboard. Paste with Ctrl/Cmd+V instead.");
    }
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErrorMessage("");

    const session = getSession();
    if (!session) {
      setErrorMessage("Your session expired. Please sign in again.");
      return;
    }

    const urls = parseUrlLines(urlInput);
    if (urls.length === 0) {
      setErrorMessage("Enter a valid web address that starts with http:// or https://.");
      return;
    }

    const title = titleInput.trim() || null;
    setLoading(true);
    setResult(null);
    setBatch(null);

    try {
      if (urls.length === 1) {
        const row = await createShortLink(urls[0], session.id, { title });
        setResult(row);
        onCreated([row]);
      } else {
        const created: ShortLinkRow[] = [];
        const failed: string[] = [];
        for (const [i, url] of urls.entries()) {
          try {
            const rowTitle = title && i > 0 ? `${title} (${i + 1})` : title;
            created.push(await createShortLink(url, session.id, { title: rowTitle }));
          } catch {
            failed.push(url);
          }
        }
        if (created.length > 0) onCreated(created);
        setBatch({ created, failed });
        if (created.length === 0) setErrorMessage("None of the links could be created.");
      }
      setUrlInput("");
      setTitleInput("");
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : "Could not shorten that link.");
    } finally {
      setLoading(false);
    }
  }

  async function handleShare(row: ShortLinkRow) {
    const url = buildShortUrl(row.code);
    try {
      if (typeof navigator.share === "function") {
        await navigator.share({ title: row.title || "Pinalink short link", url });
        return;
      }
      await copy(row);
    } catch (err) {
      if (err instanceof DOMException && err.name === "AbortError") return;
      await copy(row);
    }
  }

  function handleDownloadQr(row: ShortLinkRow) {
    const svg = document.getElementById(QR_SVG_ID);
    if (!(svg instanceof SVGElement)) return;
    const source = new XMLSerializer().serializeToString(svg);
    const href = URL.createObjectURL(new Blob([source], { type: "image/svg+xml;charset=utf-8" }));
    const anchor = document.createElement("a");
    anchor.href = href;
    anchor.download = `pinalink-${row.code}.svg`;
    anchor.click();
    URL.revokeObjectURL(href);
  }

  return (
    <section
      id="create-short-link"
      className="scroll-mt-24 rounded-2xl border border-white/[0.06] bg-[var(--uw-card)] p-5 sm:p-6"
    >
      <h2 className="text-lg font-semibold text-[var(--uw-text)]">Shorten a link</h2>
      <p className="mt-1 text-sm text-[var(--uw-muted)]">
        Paste one web address, or several on separate lines to create them all at once.
      </p>

      <form className="mt-5 space-y-4" onSubmit={handleSubmit} noValidate>
        <div>
          <div className="mb-1.5 flex items-center justify-between gap-2">
            <label htmlFor="user-url-input" className="text-sm font-medium text-[var(--uw-text)]">
              Long URL
            </label>
            <button
              type="button"
              onClick={() => void handlePaste()}
              className="inline-flex min-h-9 items-center gap-1.5 rounded-lg px-2 text-sm font-medium text-[var(--uw-cyan)] hover:bg-[var(--uw-cyan)]/10"
            >
              <ClipboardPaste size={15} aria-hidden />
              Paste
            </button>
          </div>
          <textarea
            id="user-url-input"
            value={urlInput}
            onChange={(e) => setUrlInput(e.target.value)}
            placeholder="https://example.com/a-very-long-page"
            autoComplete="url"
            rows={3}
            aria-describedby="user-url-help"
            className={`${INPUT_CLASS} min-h-24 resize-y py-2.5`}
          />
          <p id="user-url-help" className="mt-1.5 text-xs text-[var(--uw-muted)]">
            {lineCount > 1
              ? `${lineCount} addresses — each one gets its own short link.`
              : "Shortcut: press Ctrl/Cmd+K on any page to jump here."}
          </p>
        </div>

        <div>
          <label
            htmlFor="user-title-input"
            className="mb-1.5 block text-sm font-medium text-[var(--uw-text)]"
          >
            Title <span className="font-normal text-[var(--uw-muted)]">(optional)</span>
          </label>
          <input
            id="user-title-input"
            type="text"
            value={titleInput}
            onChange={(e) => setTitleInput(e.target.value)}
            placeholder="e.g. Spring event signup"
            maxLength={120}
            className={`${INPUT_CLASS} min-h-11`}
          />
        </div>

        {errorMessage ? (
          <p
            className="rounded-xl border border-[#ff6b6b]/25 bg-[#ff6b6b]/10 px-3.5 py-2.5 text-sm text-[#ff9b9b]"
            role="alert"
          >
            {errorMessage}
          </p>
        ) : null}

        <button type="submit" disabled={loading} className={`${BTN_PRIMARY} w-full sm:w-auto`}>
          {loading ? "Creating…" : lineCount > 1 ? `Shorten ${lineCount} links` : "Shorten"}
        </button>
      </form>

      {result ? (
        <div
          className="mt-6 grid gap-5 border-t border-white/[0.06] pt-6 sm:grid-cols-[minmax(0,1fr)_auto]"
          aria-live="polite"
        >
          <div className="min-w-0 space-y-3">
            <p className="text-sm font-medium text-[var(--uw-muted)]">Your short link is ready</p>
            <div className="flex items-center gap-2 rounded-xl border border-white/10 bg-[var(--uw-elevated)] py-1 pl-3.5 pr-1">
              <span className="min-w-0 flex-1 break-all font-mono-label text-[15px] text-[var(--uw-cyan)]">
                {displayHost(buildShortUrl(result.code))}
              </span>
              <button type="button" onClick={() => void copy(result)} className={BTN_PRIMARY}>
                {copiedId === result.id ? <Check size={16} aria-hidden /> : <Copy size={16} aria-hidden />}
                {copiedId === result.id ? "Copied" : "Copy"}
              </button>
            </div>
            <p className="break-all text-sm text-[var(--uw-muted)]">Goes to {result.original_url}</p>
            <div className="flex flex-wrap gap-2">
              <button type="button" onClick={() => void handleShare(result)} className={BTN_SECONDARY}>
                <Share2 size={16} aria-hidden />
                Share
              </button>
              <button type="button" onClick={() => onOpenStudio(result.id, "edit")} className={BTN_SECONDARY}>
                <Settings2 size={16} aria-hidden />
                Edit
              </button>
              <button type="button" onClick={() => onOpenStudio(result.id, "qr")} className={BTN_SECONDARY}>
                <QrCode size={16} aria-hidden />
                Design QR
              </button>
            </div>
          </div>

          <div className="flex flex-col items-center gap-2 sm:items-end">
            <div className="rounded-xl bg-white p-2">
              <QRCodeSVG
                id={QR_SVG_ID}
                value={buildShortUrl(result.code)}
                size={120}
                level="M"
                title={`QR code for ${displayHost(buildShortUrl(result.code))}`}
              />
            </div>
            <button type="button" onClick={() => handleDownloadQr(result)} className={BTN_SECONDARY}>
              <Download size={16} aria-hidden />
              Download QR
            </button>
          </div>
        </div>
      ) : null}

      {batch && batch.created.length > 0 ? (
        <div className="mt-6 border-t border-white/[0.06] pt-6" aria-live="polite">
          <p className="text-sm font-medium text-[var(--uw-text)]">
            Created {batch.created.length} link{batch.created.length === 1 ? "" : "s"}
            {batch.failed.length > 0 ? ` · ${batch.failed.length} failed` : ""}
          </p>
          <ul className="mt-3 max-h-56 divide-y divide-white/[0.06] overflow-y-auto rounded-xl border border-white/[0.06]">
            {batch.created.map((row) => (
              <li key={row.id} className="flex items-center gap-2 py-1 pl-3.5 pr-1">
                <span className="min-w-0 flex-1 truncate font-mono-label text-sm text-[var(--uw-cyan)]">
                  {displayHost(buildShortUrl(row.code))}
                </span>
                <button
                  type="button"
                  onClick={() => void copy(row)}
                  className={BTN_ICON}
                  aria-label={copiedId === row.id ? "Copied" : "Copy short link"}
                >
                  {copiedId === row.id ? <Check size={18} aria-hidden /> : <Copy size={18} aria-hidden />}
                </button>
              </li>
            ))}
          </ul>
          {batch.failed.length > 0 ? (
            <p className="mt-3 break-all text-sm text-[#ff9b9b]">
              Not created: {batch.failed.join(", ")}
            </p>
          ) : null}
          <Link
            to="/user/links-generated"
            className="mt-3 inline-flex min-h-11 items-center text-sm font-medium text-[var(--uw-cyan)] hover:underline"
          >
            Manage them in My links
          </Link>
        </div>
      ) : null}
    </section>
  );
};

export default ShortenForm;
