import { useMemo } from "react";
import { buildShortUrl } from "../../../utils/shortLink";
import type { ShortLinkRow } from "../../../utils/shortLinkApi";
import { displayHost } from "../links/linkUi";

type TopLinksProps = {
  links: ShortLinkRow[];
};

const TopLinks = ({ links }: TopLinksProps) => {
  const top = useMemo(
    () =>
      links
        .filter((row) => row.click_count > 0)
        .sort((a, b) => b.click_count - a.click_count)
        .slice(0, 5),
    [links],
  );
  const max = top[0]?.click_count ?? 0;

  return (
    <section className="rounded-2xl border border-white/[0.06] bg-[var(--uw-card)] p-5 sm:p-6">
      <h2 className="text-lg font-semibold text-[var(--uw-text)]">Most clicked</h2>
      <p className="mt-1 text-sm text-[var(--uw-muted)]">All-time clicks per link.</p>

      {top.length === 0 ? (
        <p className="mt-6 text-sm text-[var(--uw-muted)]">
          No clicks yet. Share one of your links and it will show up here.
        </p>
      ) : (
        <ol className="mt-5 space-y-4">
          {top.map((row) => {
            const label = row.title || displayHost(buildShortUrl(row.code));
            return (
              <li key={row.id}>
                <div className="flex items-baseline justify-between gap-3 text-sm">
                  <span className="min-w-0 truncate text-[var(--uw-text)]">{label}</span>
                  <span className="shrink-0 font-semibold tabular-nums text-[var(--uw-text)]">
                    {row.click_count.toLocaleString()}
                  </span>
                </div>
                <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-white/[0.06]" aria-hidden>
                  <div
                    className="h-full rounded-full bg-[var(--uw-cyan)]"
                    style={{ width: `${Math.max(4, (row.click_count / max) * 100)}%` }}
                  />
                </div>
              </li>
            );
          })}
        </ol>
      )}
    </section>
  );
};

export default TopLinks;
