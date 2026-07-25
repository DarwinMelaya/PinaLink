import { useEffect, useState, type FormEvent } from "react";
import { Save, Star, Power, Trash2 } from "lucide-react";
import { normalizeUrl } from "../../utils/shortLink";
import { normalizeCustomCode } from "../../utils/qrStyle";
import {
  deleteShortLink,
  updateShortLink,
  type ShortLinkRow,
} from "../../utils/shortLinkApi";

type LinkEditorPanelProps = {
  link: ShortLinkRow;
  onSaved: (row: ShortLinkRow) => void;
  onDeleted: (id: string) => void;
};

const fieldClass =
  "w-full min-h-12 rounded-full border border-white/10 bg-[var(--uw-elevated)] px-cozy text-body-md text-[var(--uw-text)] placeholder:text-[var(--uw-muted)] outline-none focus:border-[var(--uw-cyan)]/50 focus:ring-2 focus:ring-[var(--uw-cyan)]/20";

const labelClass =
  "block font-label-sm text-label-sm text-[var(--uw-muted)] mb-tight";

const LinkEditorPanel = ({ link, onSaved, onDeleted }: LinkEditorPanelProps) => {
  const [title, setTitle] = useState(link.title ?? "");
  const [originalUrl, setOriginalUrl] = useState(link.original_url);
  const [code, setCode] = useState(link.code);
  const [notes, setNotes] = useState(link.notes ?? "");
  const [isFavorite, setIsFavorite] = useState(link.is_favorite);
  const [isActive, setIsActive] = useState(link.is_active);
  const [expiresLocal, setExpiresLocal] = useState(
    link.expires_at
      ? new Date(link.expires_at).toISOString().slice(0, 16)
      : "",
  );
  const [status, setStatus] = useState<"idle" | "saving" | "error">("idle");
  const [message, setMessage] = useState("");

  useEffect(() => {
    setTitle(link.title ?? "");
    setOriginalUrl(link.original_url);
    setCode(link.code);
    setNotes(link.notes ?? "");
    setIsFavorite(link.is_favorite);
    setIsActive(link.is_active);
    setExpiresLocal(
      link.expires_at
        ? new Date(link.expires_at).toISOString().slice(0, 16)
        : "",
    );
    setStatus("idle");
    setMessage("");
  }, [link]);

  async function handleSave(event: FormEvent) {
    event.preventDefault();
    setMessage("");

    const normalized = normalizeUrl(originalUrl);
    if (!normalized) {
      setStatus("error");
      setMessage("Enter a valid http(s) URL.");
      return;
    }

    const nextCode = normalizeCustomCode(code);
    if (!nextCode) {
      setStatus("error");
      setMessage("Code must be 3–24 chars: letters, numbers, _ or -.");
      return;
    }

    setStatus("saving");
    try {
      const row = await updateShortLink(link.id, {
        title: title.trim() || null,
        original_url: normalized,
        code: nextCode,
        notes: notes.trim() || null,
        is_favorite: isFavorite,
        is_active: isActive,
        expires_at: expiresLocal
          ? new Date(expiresLocal).toISOString()
          : null,
      });
      onSaved(row);
      setStatus("idle");
      setMessage("Saved.");
    } catch (err) {
      setStatus("error");
      setMessage(err instanceof Error ? err.message : "Save failed.");
    }
  }

  async function handleDelete() {
    const ok = window.confirm(
      `Delete short link /${link.code}? This cannot be undone.`,
    );
    if (!ok) return;

    setStatus("saving");
    try {
      await deleteShortLink(link.id);
      onDeleted(link.id);
    } catch (err) {
      setStatus("error");
      setMessage(err instanceof Error ? err.message : "Delete failed.");
    }
  }

  return (
    <form onSubmit={(e) => void handleSave(e)} className="space-y-cozy">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-cozy">
        <div className="md:col-span-2">
          <label htmlFor="link-title" className={labelClass}>
            Label
          </label>
          <input
            id="link-title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            maxLength={120}
            placeholder="Campaign, product, bio…"
            className={fieldClass}
          />
        </div>

        <div>
          <label htmlFor="link-code" className={labelClass}>
            Custom short code
          </label>
          <div className="flex items-stretch rounded-full border border-white/10 overflow-hidden focus-within:border-[var(--uw-cyan)]/50 focus-within:ring-2 focus-within:ring-[var(--uw-cyan)]/20">
            <span className="inline-flex items-center px-cozy bg-white/5 text-[var(--uw-muted)] font-mono-label text-label-sm shrink-0">
              /s/
            </span>
            <input
              id="link-code"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              maxLength={24}
              spellCheck={false}
              className="min-h-12 flex-1 bg-[var(--uw-elevated)] px-snug font-mono-label text-body-md text-[var(--uw-text)] outline-none"
            />
          </div>
        </div>

        <div>
          <label htmlFor="link-expires" className={labelClass}>
            Expires (optional)
          </label>
          <input
            id="link-expires"
            type="datetime-local"
            value={expiresLocal}
            onChange={(e) => setExpiresLocal(e.target.value)}
            className={fieldClass}
          />
          {expiresLocal ? (
            <button
              type="button"
              onClick={() => setExpiresLocal("")}
              className="mt-tight font-label-sm text-label-sm text-[var(--uw-cyan)] font-bold min-h-11"
            >
              Clear expiry
            </button>
          ) : null}
        </div>

        <div className="md:col-span-2">
          <label htmlFor="link-dest" className={labelClass}>
            Destination URL
          </label>
          <input
            id="link-dest"
            type="url"
            value={originalUrl}
            onChange={(e) => setOriginalUrl(e.target.value)}
            required
            className={fieldClass}
          />
          <p className="mt-tight text-[12px] text-[var(--uw-muted)]">
            Dynamic QR: change this anytime — same short link / QR image.
          </p>
        </div>

        <div className="md:col-span-2">
          <label htmlFor="link-notes" className={labelClass}>
            Notes
          </label>
          <textarea
            id="link-notes"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={4}
            placeholder="Internal notes — not shown on redirect"
            className={`${fieldClass} min-h-24 rounded-[1.25rem] py-snug resize-y`}
          />
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-tight">
        <button
          type="button"
          onClick={() => setIsFavorite((v) => !v)}
          className={[
            "inline-flex min-h-12 flex-1 items-center justify-center gap-tight rounded-full border px-snug font-bold transition-colors",
            isFavorite
              ? "border-[var(--uw-cyan)]/40 bg-[var(--uw-cyan)]/10 text-[var(--uw-cyan)]"
              : "border-white/10 text-[var(--uw-muted)] hover:bg-white/5 hover:text-[var(--uw-text)]",
          ].join(" ")}
        >
          <Star
            size={16}
            fill={isFavorite ? "currentColor" : "none"}
            aria-hidden
          />
          {isFavorite ? "Favorited" : "Favorite"}
        </button>
        <button
          type="button"
          onClick={() => setIsActive((v) => !v)}
          className={[
            "inline-flex min-h-12 flex-1 items-center justify-center gap-tight rounded-full border px-snug font-bold transition-colors",
            isActive
              ? "border-white/10 text-[var(--uw-text)] hover:bg-white/5"
              : "border-[#ff6b6b]/40 bg-[#ff6b6b]/10 text-[#ff6b6b]",
          ].join(" ")}
        >
          <Power size={16} aria-hidden />
          {isActive ? "Active" : "Paused"}
        </button>
      </div>

      {message ? (
        <p
          className={`text-body-md ${status === "error" ? "text-[#ff6b6b]" : "text-[var(--uw-cyan)]"}`}
          role="status"
        >
          {message}
        </p>
      ) : null}

      <div className="flex flex-col-reverse sm:flex-row gap-tight pt-cozy border-t border-white/5 sticky bottom-0 bg-[var(--uw-card)] pb-tight">
        <button
          type="button"
          onClick={() => void handleDelete()}
          disabled={status === "saving"}
          className="inline-flex min-h-12 items-center justify-center gap-tight rounded-full border border-[#ff6b6b]/30 px-cozy text-[#ff6b6b] font-bold hover:bg-[#ff6b6b]/10 disabled:opacity-60 transition-colors"
        >
          <Trash2 size={16} aria-hidden />
          Delete
        </button>
        <button
          type="submit"
          disabled={status === "saving"}
          className="inline-flex min-h-12 flex-1 items-center justify-center gap-tight rounded-full uw-gradient px-cozy font-bold hover:brightness-110 disabled:opacity-60 transition-all"
        >
          <Save size={16} aria-hidden />
          {status === "saving" ? "Saving…" : "Save changes"}
        </button>
      </div>
    </form>
  );
};

export default LinkEditorPanel;
