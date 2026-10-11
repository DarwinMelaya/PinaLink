import type { ReactNode } from "react";
import { Check, Copy, QrCode, Settings2, Star } from "lucide-react";
import { buildShortUrl } from "../../../utils/shortLink";
import type { ShortLinkRow } from "../../../utils/shortLinkApi";
import StatusBadge from "./StatusBadge";
import { BTN_ICON, displayHost, type LinkActions } from "./linkUi";

type LinkListRowProps = {
  row: ShortLinkRow;
  isSelected: boolean;
  isChecked: boolean;
  isCopied: boolean;
  disabled: boolean;
  actions: LinkActions;
  /** Inline details, shown under the row on screens without the side panel. */
  children?: ReactNode;
};

const LinkListRow = ({
  row,
  isSelected,
  isChecked,
  isCopied,
  disabled,
  actions,
  children,
}: LinkListRowProps) => {
  const host = displayHost(buildShortUrl(row.code));

  return (
    <li
      className={[
        "rounded-2xl border bg-[var(--uw-card)] transition-colors",
        isSelected
          ? "border-[var(--uw-cyan)]/40"
          : "border-white/[0.06] hover:border-white/15",
      ].join(" ")}
    >
      <div className="grid grid-cols-[auto_minmax(0,1fr)] items-center gap-x-1 p-2 sm:grid-cols-[auto_minmax(0,1fr)_auto_auto] sm:gap-x-3 sm:p-3">
        <label className="inline-flex size-11 cursor-pointer items-center justify-center">
          <span className="sr-only">Select {host}</span>
          <input
            type="checkbox"
            checked={isChecked}
            disabled={disabled}
            onChange={() => actions.toggleChecked(row.id)}
            className="size-4 accent-[var(--uw-cyan)]"
          />
        </label>

        <button
          type="button"
          onClick={() => actions.select(row.id)}
          aria-expanded={isSelected}
          className="min-w-0 rounded-xl py-1.5 pr-2 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--uw-cyan)]/50"
        >
          <span className="flex min-w-0 items-center gap-2">
            <span className="truncate text-[15px] font-semibold text-[var(--uw-text)]">
              {row.title || host}
            </span>
            {row.is_favorite ? (
              <Star
                size={14}
                fill="currentColor"
                className="shrink-0 text-[var(--uw-cyan)]"
                aria-label="Favorite"
              />
            ) : null}
            <StatusBadge row={row} />
          </span>
          <span className="mt-0.5 block truncate font-mono-label text-sm text-[var(--uw-cyan)]">
            {host}
          </span>
          <span className="block truncate text-sm text-[var(--uw-muted)]">
            {row.original_url}
          </span>
        </button>

        <div className="col-start-2 flex items-center justify-between gap-2 sm:contents">
          <p className="text-sm text-[var(--uw-muted)] sm:text-right">
            <span className="font-semibold tabular-nums text-[var(--uw-text)]">
              {row.click_count}
            </span>{" "}
            {row.click_count === 1 ? "click" : "clicks"}
          </p>

          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => actions.copy(row)}
              className={BTN_ICON}
              aria-label={isCopied ? "Copied" : "Copy short link"}
              title="Copy short link"
            >
              {isCopied ? (
                <Check
                  size={18}
                  className="text-[var(--uw-cyan)]"
                  aria-hidden
                />
              ) : (
                <Copy size={18} aria-hidden />
              )}
            </button>
            <button
              type="button"
              onClick={() => actions.openStudio(row.id, "qr")}
              className={BTN_ICON}
              aria-label="Design QR code"
              title="Design QR code"
            >
              <QrCode size={18} aria-hidden />
            </button>
            <button
              type="button"
              onClick={() => actions.openStudio(row.id, "edit")}
              className={BTN_ICON}
              aria-label="Edit link"
              title="Edit link"
            >
              <Settings2 size={18} aria-hidden />
            </button>
          </div>
        </div>
      </div>

      {children}
    </li>
  );
};

export default LinkListRow;
