import {
  Check,
  Copy,
  CopyPlus,
  ExternalLink,
  PauseCircle,
  PlayCircle,
  QrCode,
  Settings2,
  Share2,
  Star,
} from "lucide-react";
import { buildShortUrl } from "../../../utils/shortLink";
import type { ShortLinkRow } from "../../../utils/shortLinkApi";
import StatusBadge from "./StatusBadge";
import {
  BTN_PRIMARY,
  BTN_SECONDARY,
  displayHost,
  formatRelativeDate,
  type LinkActions,
} from "./linkUi";

type LinkDetailsPanelProps = {
  row: ShortLinkRow;
  isCopied: boolean;
  disabled: boolean;
  actions: LinkActions;
};

const LinkDetailsPanel = ({ row, isCopied, disabled, actions }: LinkDetailsPanelProps) => {
  const shortUrl = buildShortUrl(row.code);

  return (
    <div className="space-y-5">
      <div>
        <div className="flex items-center gap-2">
          <h2 className="min-w-0 truncate text-base font-semibold text-[var(--uw-text)]">
            {row.title || displayHost(shortUrl)}
          </h2>
          <StatusBadge row={row} />
        </div>
        <p className="mt-1 break-all font-mono-label text-sm text-[var(--uw-cyan)]">
          {displayHost(shortUrl)}
        </p>
      </div>

      <button type="button" onClick={() => actions.copy(row)} className={`${BTN_PRIMARY} w-full`}>
        {isCopied ? <Check size={16} aria-hidden /> : <Copy size={16} aria-hidden />}
        {isCopied ? "Copied" : "Copy short link"}
      </button>

      <dl className="grid grid-cols-2 gap-x-4 gap-y-3 text-sm">
        <div className="col-span-2">
          <dt className="text-[var(--uw-muted)]">Goes to</dt>
          <dd className="mt-0.5 break-all text-[var(--uw-text)]">{row.original_url}</dd>
        </div>
        <div>
          <dt className="text-[var(--uw-muted)]">Clicks</dt>
          <dd className="mt-0.5 font-semibold tabular-nums text-[var(--uw-text)]">
            {row.click_count}
          </dd>
        </div>
        <div>
          <dt className="text-[var(--uw-muted)]">Created</dt>
          <dd className="mt-0.5 text-[var(--uw-text)]">{formatRelativeDate(row.created_at)}</dd>
        </div>
        {row.expires_at ? (
          <div className="col-span-2">
            <dt className="text-[var(--uw-muted)]">Expires</dt>
            <dd className="mt-0.5 text-[var(--uw-text)]">
              {new Date(row.expires_at).toLocaleString()}
            </dd>
          </div>
        ) : null}
        {row.notes ? (
          <div className="col-span-2">
            <dt className="text-[var(--uw-muted)]">Notes</dt>
            <dd className="mt-0.5 whitespace-pre-wrap text-[var(--uw-text)]">{row.notes}</dd>
          </div>
        ) : null}
      </dl>

      <div className="grid grid-cols-2 gap-2">
        <button
          type="button"
          onClick={() => actions.openStudio(row.id, "edit")}
          className={BTN_SECONDARY}
        >
          <Settings2 size={16} aria-hidden />
          Edit
        </button>
        <button
          type="button"
          onClick={() => actions.openStudio(row.id, "qr")}
          className={BTN_SECONDARY}
        >
          <QrCode size={16} aria-hidden />
          QR code
        </button>
      </div>

      <div className="border-t border-white/[0.06] pt-4">
        <p className="mb-2 text-xs font-medium text-[var(--uw-muted)]">More actions</p>
        <div className="grid grid-cols-2 gap-2">
          <a href={shortUrl} target="_blank" rel="noopener noreferrer" className={BTN_SECONDARY}>
            <ExternalLink size={16} aria-hidden />
            Open
          </a>
          <button type="button" onClick={() => actions.share(row)} className={BTN_SECONDARY}>
            <Share2 size={16} aria-hidden />
            Share
          </button>
          <button
            type="button"
            disabled={disabled}
            onClick={() => actions.togglePause(row)}
            className={BTN_SECONDARY}
          >
            {row.is_active ? (
              <PauseCircle size={16} aria-hidden />
            ) : (
              <PlayCircle size={16} aria-hidden />
            )}
            {row.is_active ? "Pause" : "Resume"}
          </button>
          <button
            type="button"
            disabled={disabled}
            onClick={() => actions.toggleFavorite(row)}
            className={BTN_SECONDARY}
            aria-pressed={row.is_favorite}
          >
            <Star
              size={16}
              fill={row.is_favorite ? "currentColor" : "none"}
              className={row.is_favorite ? "text-[var(--uw-cyan)]" : undefined}
              aria-hidden
            />
            {row.is_favorite ? "Favorited" : "Favorite"}
          </button>
          <button
            type="button"
            disabled={disabled}
            onClick={() => actions.duplicate(row)}
            className={`${BTN_SECONDARY} col-span-2`}
          >
            <CopyPlus size={16} aria-hidden />
            Duplicate
          </button>
        </div>
      </div>
    </div>
  );
};

export default LinkDetailsPanel;
