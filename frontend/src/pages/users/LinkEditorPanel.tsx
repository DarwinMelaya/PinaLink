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

  const fieldClass =
    "w-full min-h-11 rounded-lg border border-outline-variant bg-surface-container px-snug text-body-md text-on-surface outline-none focus:border-primary focus:ring-4 focus:ring-primary/10";

  return (
    <form onSubmit={(e) => void handleSave(e)} className="space-y-cozy">
      <div>
        <label
          htmlFor="link-title"
          className="block font-label-sm text-label-sm text-on-surface-variant mb-tight"
        >
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
        <label
          htmlFor="link-code"
          className="block font-label-sm text-label-sm text-on-surface-variant mb-tight"
        >
          Custom short code
        </label>
        <div className="flex items-stretch rounded-lg border border-outline-variant overflow-hidden focus-within:border-primary focus-within:ring-4 focus-within:ring-primary/10">
          <span className="inline-flex items-center px-snug bg-surface-container-high text-on-surface-variant font-mono-label text-label-sm shrink-0">
            /s/
          </span>
          <input
            id="link-code"
            value={code}
            onChange={(e) => setCode(e.target.value)}
            maxLength={24}
            spellCheck={false}
            className="min-h-11 flex-1 bg-surface-container px-snug font-mono-label text-body-md text-on-surface outline-none"
          />
        </div>
      </div>

      <div>
        <label
          htmlFor="link-dest"
          className="block font-label-sm text-label-sm text-on-surface-variant mb-tight"
        >
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
      </div>

      <div>
        <label
          htmlFor="link-notes"
          className="block font-label-sm text-label-sm text-on-surface-variant mb-tight"
        >
          Notes
        </label>
        <textarea
          id="link-notes"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={3}
          placeholder="Internal notes — not shown on redirect"
          className={`${fieldClass} min-h-20 py-snug resize-y`}
        />
      </div>

      <div>
        <label
          htmlFor="link-expires"
          className="block font-label-sm text-label-sm text-on-surface-variant mb-tight"
        >
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
            className="mt-tight font-label-sm text-label-sm text-primary font-bold min-h-11"
          >
            Clear expiry
          </button>
        ) : null}
      </div>

      <div className="flex flex-col sm:flex-row gap-tight">
        <button
          type="button"
          onClick={() => setIsFavorite((v) => !v)}
          className={[
            "inline-flex min-h-11 flex-1 items-center justify-center gap-tight rounded-xl border px-snug font-bold transition-colors",
            isFavorite
              ? "border-primary bg-primary/10 text-primary"
              : "border-outline-variant text-on-surface hover:bg-surface-container-low",
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
            "inline-flex min-h-11 flex-1 items-center justify-center gap-tight rounded-xl border px-snug font-bold transition-colors",
            isActive
              ? "border-outline-variant text-on-surface hover:bg-surface-container-low"
              : "border-error/40 bg-error-container/40 text-error",
          ].join(" ")}
        >
          <Power size={16} aria-hidden />
          {isActive ? "Active" : "Paused"}
        </button>
      </div>

      {message ? (
        <p
          className={`text-body-md ${status === "error" ? "text-error" : "text-primary"}`}
          role="status"
        >
          {message}
        </p>
      ) : null}

      <div className="flex flex-col sm:flex-row gap-tight pt-tight border-t border-outline-variant">
        <button
          type="submit"
          disabled={status === "saving"}
          className="inline-flex min-h-11 flex-1 items-center justify-center gap-tight rounded-xl bg-primary px-cozy text-on-primary font-bold hover:bg-surface-tint disabled:opacity-60 transition-colors"
        >
          <Save size={16} aria-hidden />
          {status === "saving" ? "Saving…" : "Save changes"}
        </button>
        <button
          type="button"
          onClick={() => void handleDelete()}
          disabled={status === "saving"}
          className="inline-flex min-h-11 items-center justify-center gap-tight rounded-xl border border-error/30 px-cozy text-error font-bold hover:bg-error-container/50 disabled:opacity-60 transition-colors"
        >
          <Trash2 size={16} aria-hidden />
          Delete
        </button>
      </div>
    </form>
  );
};

export default LinkEditorPanel;
