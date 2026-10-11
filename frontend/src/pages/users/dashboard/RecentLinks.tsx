import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Check, Copy, Settings2 } from "lucide-react";
import { buildShortUrl } from "../../../utils/shortLink";
import type { ShortLinkRow } from "../../../utils/shortLinkApi";
import StatusBadge from "../links/StatusBadge";
import { BTN_ICON, displayHost, formatRelativeDate } from "../links/linkUi";

type RecentLinksProps = {
  links: ShortLinkRow[];
  loading: boolean;
  onOpenStudio: (id: string, tab: "edit" | "qr") => void;
};

const RecentLinks = ({ links, loading, onOpenStudio }: RecentLinksProps) => {
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [copyError, setCopyError] = useState(false);

  const recent = useMemo(
    () =>
      [...links]
        .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
        .slice(0, 5),
    [links],
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
      setCopyError(false);
    } catch {
      setCopyError(true);
    }
  }

  return (
    <section className="rounded-2xl border border-white/[0.06] bg-[var(--uw-card)] p-5 sm:p-6">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-lg font-semibold text-[var(--uw-text)]">Recent links</h2>
        <Link
          to="/user/links-generated"
          className="inline-flex min-h-11 items-center text-sm font-medium text-[var(--uw-cyan)] hover:underline"
        >
          View all
        </Link>
      </div>

      {copyError ? (
        <p className="mt-2 text-sm text-[#ff9b9b]" role="alert">
          Copy failed. Open the link and copy it from the address bar.
        </p>
      ) : null}

      {loading ? (
        <div className="mt-4 space-y-2" aria-busy="true">
          {[0, 1, 2].map((i) => (
            <div key={i} className="h-14 animate-pulse rounded-xl bg-white/[0.04] motion-reduce:animate-none" />
          ))}
        </div>
      ) : recent.length === 0 ? (
        <p className="mt-4 text-sm text-[var(--uw-muted)]">
          No links yet. Your newest links will appear here after you shorten one.
        </p>
      ) : (
        <ul className="mt-2 divide-y divide-white/[0.06]">
          {recent.map((row) => {
            const host = displayHost(buildShortUrl(row.code));
            const copied = copiedId === row.id;
            return (
              <li key={row.id} className="flex items-center gap-3 py-3">
                <div className="min-w-0 flex-1">
                  <div className="flex min-w-0 items-center gap-2">
                    <span className="truncate text-[15px] font-medium text-[var(--uw-text)]">
                      {row.title || host}
                    </span>
                    <StatusBadge row={row} />
                  </div>
                  <p className="mt-0.5 truncate text-sm text-[var(--uw-muted)]">
                    <span className="font-mono-label text-[var(--uw-cyan)]">{host}</span>
                    {" · "}
                    {row.click_count} {row.click_count === 1 ? "click" : "clicks"}
                    {" · "}
                    {formatRelativeDate(row.created_at)}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => void copy(row)}
                  className={BTN_ICON}
                  aria-label={copied ? "Copied" : `Copy ${host}`}
                  title="Copy short link"
                >
                  {copied ? (
                    <Check size={18} className="text-[var(--uw-cyan)]" aria-hidden />
                  ) : (
                    <Copy size={18} aria-hidden />
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => onOpenStudio(row.id, "edit")}
                  className={BTN_ICON}
                  aria-label={`Edit ${host}`}
                  title="Edit link"
                >
                  <Settings2 size={18} aria-hidden />
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
};

export default RecentLinks;
