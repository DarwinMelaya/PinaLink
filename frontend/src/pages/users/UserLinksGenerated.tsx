import { useEffect, useMemo, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { ArrowLeft, Download, Link2, Plus, QrCode, RefreshCw, Settings2 } from "lucide-react";
import { getSession } from "../../utils/authApi";
import { buildShortUrl } from "../../utils/shortLink";
import { isExpiringSoon, isLinkExpired, isLinkLive, parseQrStyle } from "../../utils/qrStyle";
import {
  deleteShortLink,
  duplicateShortLink,
  exportShortLinksCsv,
  listShortLinksByUser,
  updateShortLink,
  type ShortLinkRow,
} from "../../utils/shortLinkApi";
import ConfirmDialog from "../../components/ui/ConfirmDialog";
import LinkEditorPanel from "./LinkEditorPanel";
import QrStudioPanel from "./QrStudioPanel";
import BulkActionsBar, { type BulkAction } from "./links/BulkActionsBar";
import LinkDetailsPanel from "./links/LinkDetailsPanel";
import LinkListRow from "./links/LinkListRow";
import LinksSummary from "./links/LinksSummary";
import LinksToolbar, { type FilterMode, type SortMode } from "./links/LinksToolbar";
import StatusBadge from "./links/StatusBadge";
import {
  BTN_ICON,
  BTN_PRIMARY,
  BTN_SECONDARY,
  displayHost,
  type LinkActions,
  type StudioTab,
} from "./links/linkUi";

type LinksLocationState = {
  selectId: string;
  tab?: StudioTab;
};

/** Dashboard navigates here with `{ selectId, tab }` right after creating a link. */
function readFocusState(state: unknown): LinksLocationState | null {
  if (!state || typeof state !== "object") return null;
  if (!("selectId" in state) || typeof state.selectId !== "string") return null;
  const tab =
    "tab" in state && (state.tab === "edit" || state.tab === "qr" || state.tab === "overview")
      ? state.tab
      : undefined;
  return { selectId: state.selectId, tab };
}

const UserLinksGenerated = () => {
  const session = getSession();
  const userId = session?.id ?? null;
  const location = useLocation();
  const navigate = useNavigate();
  const [initialFocus] = useState(() => readFocusState(location.state));
  const [myLinks, setMyLinks] = useState<ShortLinkRow[]>([]);
  const [status, setStatus] = useState<"idle" | "loading" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState("");
  const [infoMessage, setInfoMessage] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [checkedIds, setCheckedIds] = useState<Set<string>>(() => new Set());
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [sortMode, setSortMode] = useState<SortMode>("newest");
  const [filterMode, setFilterMode] = useState<FilterMode>("all");
  const [studioTab, setStudioTab] = useState<StudioTab>("overview");
  const [bulkBusy, setBulkBusy] = useState(false);
  const [rowBusyId, setRowBusyId] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [pendingDeleteIds, setPendingDeleteIds] = useState<string[] | null>(null);

  async function loadHistory(opts?: { quiet?: boolean }) {
    if (!session) {
      setMyLinks([]);
      setSelectedId(null);
      setCheckedIds(new Set());
      return;
    }

    if (!opts?.quiet) {
      setStatus("loading");
    } else {
      setRefreshing(true);
    }
    setErrorMessage("");

    try {
      const rows = await listShortLinksByUser(session.id);
      setMyLinks(rows);
      setSelectedId((prev) => {
        if (prev && rows.some((r) => r.id === prev)) return prev;
        return rows[0]?.id ?? null;
      });
      setCheckedIds((prev) => {
        const next = new Set<string>();
        for (const id of prev) {
          if (rows.some((r) => r.id === id)) next.add(id);
        }
        return next;
      });
      setStatus("idle");
    } catch (err) {
      setStatus("error");
      setErrorMessage(err instanceof Error ? err.message : "Could not load your links.");
    } finally {
      setRefreshing(false);
    }
  }

  useEffect(() => {
    if (!userId) return;

    let cancelled = false;

    async function initialLoad(ownerId: string) {
      setStatus("loading");
      setErrorMessage("");
      try {
        const rows = await listShortLinksByUser(ownerId);
        if (cancelled) return;
        setMyLinks(rows);
        const focusRow =
          initialFocus && rows.some((row) => row.id === initialFocus.selectId)
            ? initialFocus
            : null;
        setSelectedId(focusRow?.selectId ?? rows[0]?.id ?? null);
        if (focusRow?.tab) setStudioTab(focusRow.tab);
        setStatus("idle");
      } catch (err) {
        if (cancelled) return;
        setStatus("error");
        setErrorMessage(err instanceof Error ? err.message : "Could not load your links.");
      }
    }

    void initialLoad(userId);
    return () => {
      cancelled = true;
    };
  }, [userId, initialFocus]);

  useEffect(() => {
    if (!copiedCode) return;
    const timer = window.setTimeout(() => setCopiedCode(null), 2000);
    return () => window.clearTimeout(timer);
  }, [copiedCode]);

  useEffect(() => {
    if (!infoMessage) return;
    const timer = window.setTimeout(() => setInfoMessage(""), 2500);
    return () => window.clearTimeout(timer);
  }, [infoMessage]);

  // Focus state is read once on mount; clear it so a reload doesn't reapply it.
  useEffect(() => {
    if (!location.state) return;
    navigate(".", { replace: true, state: null });
  }, [location.state, navigate]);

  const filteredLinks = useMemo(() => {
    const q = query.trim().toLowerCase();
    const rows = myLinks.filter((row) => {
      if (filterMode === "favorites" && !row.is_favorite) return false;
      if (filterMode === "paused" && row.is_active) return false;
      if (filterMode === "expired" && !isLinkExpired(row.expires_at)) return false;

      if (!q) return true;
      const shortUrl = displayHost(buildShortUrl(row.code)).toLowerCase();
      const title = (row.title ?? "").toLowerCase();
      return (
        row.code.toLowerCase().includes(q) ||
        shortUrl.includes(q) ||
        title.includes(q) ||
        row.original_url.toLowerCase().includes(q)
      );
    });

    return [...rows].sort((a, b) => {
      if (sortMode === "clicks") return b.click_count - a.click_count;
      if (sortMode === "alpha") return a.code.localeCompare(b.code);
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    });
  }, [myLinks, query, sortMode, filterMode]);

  const selected = useMemo(
    () => myLinks.find((row) => row.id === selectedId) ?? null,
    [myLinks, selectedId],
  );

  const selectedShortUrl = selected ? buildShortUrl(selected.code) : null;

  const summary = useMemo(
    () => ({
      clicks: myLinks.reduce((sum, row) => sum + (row.click_count ?? 0), 0),
      live: myLinks.filter((row) => isLinkLive(row.is_active, row.expires_at)).length,
      expiringSoon: myLinks.filter(
        (row) =>
          row.is_active && !isLinkExpired(row.expires_at) && isExpiringSoon(row.expires_at),
      ).length,
    }),
    [myLinks],
  );

  const savedQrLogos = useMemo(() => {
    const logos = new Set<string>();
    for (const row of myLinks) {
      const logo = parseQrStyle(row.qr_style).logoDataUrl;
      if (logo) logos.add(logo);
    }
    return [...logos];
  }, [myLinks]);

  const allFilteredChecked =
    filteredLinks.length > 0 && filteredLinks.every((row) => checkedIds.has(row.id));

  function upsertLink(row: ShortLinkRow) {
    setMyLinks((prev) => prev.map((item) => (item.id === row.id ? row : item)));
  }

  function prependLink(row: ShortLinkRow) {
    setMyLinks((prev) => [row, ...prev]);
    setSelectedId(row.id);
  }

  function removeLink(id: string) {
    setMyLinks((prev) => {
      const next = prev.filter((item) => item.id !== id);
      setSelectedId((current) => {
        if (current !== id) return current;
        return next[0]?.id ?? null;
      });
      return next;
    });
    setCheckedIds((prev) => {
      if (!prev.has(id)) return prev;
      const next = new Set(prev);
      next.delete(id);
      return next;
    });
    setStudioTab("overview");
  }

  function removeLinks(ids: string[]) {
    const idSet = new Set(ids);
    setMyLinks((prev) => {
      const next = prev.filter((item) => !idSet.has(item.id));
      setSelectedId((current) => {
        if (!current || !idSet.has(current)) return current;
        return next[0]?.id ?? null;
      });
      return next;
    });
    setCheckedIds(new Set());
    setStudioTab("overview");
  }

  async function handleCopy(row: ShortLinkRow) {
    try {
      await navigator.clipboard.writeText(buildShortUrl(row.code));
      setCopiedCode(row.code);
      setErrorMessage("");
      setInfoMessage("Short link copied.");
    } catch {
      setErrorMessage("Copy failed. Select the link and copy manually.");
    }
  }

  async function toggleFavorite(row: ShortLinkRow) {
    setRowBusyId(row.id);
    try {
      const updated = await updateShortLink(row.id, { is_favorite: !row.is_favorite });
      upsertLink(updated);
      setErrorMessage("");
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : "Could not update favorite.");
    } finally {
      setRowBusyId(null);
    }
  }

  async function togglePause(row: ShortLinkRow) {
    setRowBusyId(row.id);
    try {
      const updated = await updateShortLink(row.id, { is_active: !row.is_active });
      upsertLink(updated);
      setErrorMessage("");
      setInfoMessage(updated.is_active ? "Link resumed." : "Link paused.");
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : "Could not update link status.");
    } finally {
      setRowBusyId(null);
    }
  }

  async function handleShare(row: ShortLinkRow) {
    const shortUrl = buildShortUrl(row.code);
    try {
      if (typeof navigator.share === "function") {
        await navigator.share({ title: row.title || "Pinalink short link", url: shortUrl });
        setInfoMessage("Shared.");
        return;
      }
      await navigator.clipboard.writeText(shortUrl);
      setInfoMessage("Share unavailable — link copied instead.");
    } catch (err) {
      // User cancel is not an error
      if (err instanceof DOMException && err.name === "AbortError") return;
      try {
        await navigator.clipboard.writeText(shortUrl);
        setInfoMessage("Share cancelled — link copied.");
      } catch {
        setErrorMessage("Could not share or copy link.");
      }
    }
  }

  async function handleDuplicate(row: ShortLinkRow) {
    if (!session) {
      setErrorMessage("Sign in to duplicate links.");
      return;
    }
    setRowBusyId(row.id);
    try {
      const copy = await duplicateShortLink(row, session.id);
      prependLink(copy);
      setErrorMessage("");
      setInfoMessage("Duplicate created.");
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : "Could not duplicate link.");
    } finally {
      setRowBusyId(null);
    }
  }

  function handleExportCsv() {
    if (filteredLinks.length === 0) {
      setErrorMessage("Nothing to export for this filter.");
      return;
    }
    exportShortLinksCsv(filteredLinks);
    setInfoMessage(`Exported ${filteredLinks.length} link(s).`);
    setErrorMessage("");
  }

  function toggleChecked(id: string) {
    setCheckedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function toggleAllFiltered() {
    setCheckedIds(
      allFilteredChecked ? new Set() : new Set(filteredLinks.map((row) => row.id)),
    );
  }

  async function runBulk(action: BulkAction) {
    const ids = [...checkedIds];
    if (ids.length === 0) return;

    if (action === "delete") {
      setPendingDeleteIds(ids);
      return;
    }

    setBulkBusy(true);
    setErrorMessage("");
    try {
      const patch =
        action === "pause"
          ? { is_active: false }
          : action === "resume"
            ? { is_active: true }
            : action === "favorite"
              ? { is_favorite: true }
              : { is_favorite: false };

      const updated = await Promise.all(ids.map((id) => updateShortLink(id, patch)));
      setMyLinks((prev) => {
        const map = new Map(updated.map((row) => [row.id, row]));
        return prev.map((row) => map.get(row.id) ?? row);
      });
      setInfoMessage(`Updated ${updated.length} link(s).`);
      setCheckedIds(new Set());
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : "Bulk action failed.");
    } finally {
      setBulkBusy(false);
    }
  }

  async function confirmBulkDelete() {
    if (!pendingDeleteIds) return;
    const ids = pendingDeleteIds;
    setBulkBusy(true);
    setErrorMessage("");
    try {
      await Promise.all(ids.map((id) => deleteShortLink(id)));
      removeLinks(ids);
      setInfoMessage(`Deleted ${ids.length} link${ids.length === 1 ? "" : "s"}.`);
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : "Delete failed.");
    } finally {
      setBulkBusy(false);
      setPendingDeleteIds(null);
    }
  }

  const pendingDeleteLabel = (() => {
    if (!pendingDeleteIds) return "";
    if (pendingDeleteIds.length !== 1) return `${pendingDeleteIds.length} short links`;
    const row = myLinks.find((item) => item.id === pendingDeleteIds[0]);
    return row ? displayHost(buildShortUrl(row.code)) : "1 short link";
  })();

  const actions: LinkActions = {
    select: (id) => {
      setSelectedId((prev) => (prev === id ? null : id));
      setStudioTab("overview");
    },
    openStudio: (id, tab) => {
      setSelectedId(id);
      setStudioTab(tab);
    },
    toggleChecked,
    copy: (row) => void handleCopy(row),
    share: (row) => void handleShare(row),
    duplicate: (row) => void handleDuplicate(row),
    toggleFavorite: (row) => void toggleFavorite(row),
    togglePause: (row) => void togglePause(row),
  };

  const focusMode = studioTab === "edit" || studioTab === "qr";

  useEffect(() => {
    if (!focusMode) return;
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [focusMode, selectedId]);

  const actionsDisabled = bulkBusy || refreshing || status === "loading";

  const messages = (
    <>
      {errorMessage ? (
        <p
          className="rounded-xl border border-[#ff6b6b]/25 bg-[#ff6b6b]/10 px-4 py-3 text-sm text-[#ff9b9b]"
          role="alert"
        >
          {errorMessage}
        </p>
      ) : null}
      {infoMessage ? (
        <p
          className="rounded-xl border border-[var(--uw-cyan)]/25 bg-[var(--uw-cyan)]/10 px-4 py-3 text-sm text-[var(--uw-cyan)]"
          role="status"
        >
          {infoMessage}
        </p>
      ) : null}
    </>
  );

  if (focusMode && selected && selectedShortUrl) {
    return (
      <section className="mx-auto w-full max-w-4xl space-y-5">
        <button
          type="button"
          onClick={() => setStudioTab("overview")}
          className={`${BTN_SECONDARY} w-fit`}
        >
          <ArrowLeft size={16} aria-hidden />
          All links
        </button>

        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h1 className="truncate text-[clamp(22px,3vw,28px)] font-semibold tracking-tight text-[var(--uw-text)]">
                {selected.title || displayHost(selectedShortUrl)}
              </h1>
              <StatusBadge row={selected} />
            </div>
            <p className="mt-1 break-all font-mono-label text-sm text-[var(--uw-cyan)]">
              {displayHost(selectedShortUrl)}
            </p>
          </div>

          <div
            role="tablist"
            aria-label="Link studio"
            className="flex w-full rounded-xl border border-white/10 bg-[var(--uw-card)] p-1 sm:w-auto"
          >
            {(
              [
                ["edit", "Edit link", Settings2],
                ["qr", "QR code", QrCode],
              ] as const
            ).map(([tab, label, Icon]) => (
              <button
                key={tab}
                type="button"
                role="tab"
                aria-selected={studioTab === tab}
                onClick={() => setStudioTab(tab)}
                className={[
                  "inline-flex min-h-10 flex-1 items-center justify-center gap-2 rounded-lg px-4 text-sm font-medium transition-colors sm:flex-none",
                  studioTab === tab
                    ? "bg-[var(--uw-card-hover)] text-[var(--uw-text)]"
                    : "text-[var(--uw-muted)] hover:text-[var(--uw-text)]",
                ].join(" ")}
              >
                <Icon size={16} aria-hidden />
                {label}
              </button>
            ))}
          </div>
        </div>

        {messages}

        <div className="rounded-2xl border border-white/[0.06] bg-[var(--uw-card)] p-4 sm:p-6">
          {studioTab === "edit" ? (
            <LinkEditorPanel link={selected} onSaved={upsertLink} onDeleted={removeLink} />
          ) : (
            <QrStudioPanel
              link={selected}
              shortUrl={selectedShortUrl}
              onSaved={upsertLink}
              linkLogos={savedQrLogos}
              onEditDestination={() => setStudioTab("edit")}
            />
          )}
        </div>
      </section>
    );
  }

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-[clamp(24px,4vw,32px)] font-semibold tracking-tight text-[var(--uw-text)]">
            My links
          </h1>
          <p className="mt-1 text-[15px] text-[var(--uw-muted)]">
            Pick a link to see its details, edit it, or design its QR code.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => void loadHistory({ quiet: true })}
            disabled={actionsDisabled || !session}
            className={BTN_ICON}
            aria-label="Refresh links"
            title="Refresh"
          >
            <RefreshCw
              size={18}
              className={refreshing ? "animate-spin motion-reduce:animate-none" : undefined}
              aria-hidden
            />
          </button>
          <button
            type="button"
            onClick={handleExportCsv}
            disabled={actionsDisabled || filteredLinks.length === 0}
            className={BTN_SECONDARY}
          >
            <Download size={16} aria-hidden />
            Export CSV
          </button>
          <Link to="/user/dashboard#create" className={BTN_PRIMARY}>
            <Plus size={16} aria-hidden />
            New link
          </Link>
        </div>
      </header>

      {myLinks.length > 0 ? (
        <LinksSummary
          total={myLinks.length}
          live={summary.live}
          clicks={summary.clicks}
          expiringSoon={summary.expiringSoon}
        />
      ) : null}

      {messages}

      {status === "loading" ? (
        <div className="space-y-2" aria-busy="true" aria-live="polite">
          <p className="sr-only">Loading your short links…</p>
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className="h-20 animate-pulse rounded-2xl border border-white/[0.06] bg-[var(--uw-card)] motion-reduce:animate-none"
            />
          ))}
        </div>
      ) : null}

      {status !== "loading" && myLinks.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-white/15 bg-[var(--uw-card)] px-6 py-16 text-center">
          <Link2 size={28} className="mx-auto text-[var(--uw-muted)]" aria-hidden />
          <h2 className="mt-4 text-lg font-semibold text-[var(--uw-text)]">No short links yet</h2>
          <p className="mx-auto mt-1 max-w-md text-[15px] text-[var(--uw-muted)]">
            Create one from the dashboard. It will show up here so you can edit it and make a
            QR code.
          </p>
          <Link to="/user/dashboard#create" className={`${BTN_PRIMARY} mt-6`}>
            <Plus size={16} aria-hidden />
            Create short link
          </Link>
        </div>
      ) : null}

      {status !== "loading" && myLinks.length > 0 ? (
        <div className="grid grid-cols-1 items-start gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
          <div className="min-w-0 space-y-3">
            <LinksToolbar
              query={query}
              filter={filterMode}
              sort={sortMode}
              onQueryChange={setQuery}
              onFilterChange={setFilterMode}
              onSortChange={setSortMode}
            />

            {checkedIds.size > 0 ? (
              <BulkActionsBar
                count={checkedIds.size}
                disabled={actionsDisabled}
                onAction={(action) => void runBulk(action)}
                onClear={() => setCheckedIds(new Set())}
              />
            ) : (
              <div className="flex items-center gap-1 px-2">
                <label className="inline-flex size-11 cursor-pointer items-center justify-center">
                  <span className="sr-only">Select all shown links</span>
                  <input
                    type="checkbox"
                    checked={allFilteredChecked}
                    disabled={filteredLinks.length === 0 || actionsDisabled}
                    onChange={toggleAllFiltered}
                    className="size-4 accent-[var(--uw-cyan)]"
                  />
                </label>
                <p className="text-sm text-[var(--uw-muted)]">
                  Showing {filteredLinks.length} of {myLinks.length}
                </p>
              </div>
            )}

            {filteredLinks.length === 0 ? (
              <p className="rounded-2xl border border-white/[0.06] bg-[var(--uw-card)] p-6 text-center text-[15px] text-[var(--uw-muted)]">
                No links match your search or filter.
              </p>
            ) : (
              <ul className="space-y-2">
                {filteredLinks.map((row) => {
                  const isSelected = selectedId === row.id;
                  return (
                    <LinkListRow
                      key={row.id}
                      row={row}
                      isSelected={isSelected}
                      isChecked={checkedIds.has(row.id)}
                      isCopied={copiedCode === row.code}
                      disabled={actionsDisabled}
                      actions={actions}
                    >
                      {isSelected ? (
                        <div className="border-t border-white/[0.06] p-4 xl:hidden">
                          <LinkDetailsPanel
                            row={row}
                            isCopied={copiedCode === row.code}
                            disabled={rowBusyId === row.id || bulkBusy}
                            actions={actions}
                          />
                        </div>
                      ) : null}
                    </LinkListRow>
                  );
                })}
              </ul>
            )}
          </div>

          {selected ? (
            <aside className="hidden rounded-2xl border border-white/[0.06] bg-[var(--uw-card)] p-5 xl:sticky xl:top-6 xl:block">
              <LinkDetailsPanel
                row={selected}
                isCopied={copiedCode === selected.code}
                disabled={rowBusyId === selected.id || bulkBusy}
                actions={actions}
              />
            </aside>
          ) : null}
        </div>
      ) : null}

      <ConfirmDialog
        open={pendingDeleteIds !== null}
        title={
          pendingDeleteIds && pendingDeleteIds.length > 1
            ? `Delete ${pendingDeleteIds.length} links?`
            : "Delete this link?"
        }
        description={
          <>
            <span className="font-medium text-[var(--uw-text)]">{pendingDeleteLabel}</span> will
            stop working right away, along with click counts and QR designs. This can&apos;t be
            undone.
          </>
        }
        confirmLabel="Delete"
        busy={bulkBusy}
        onConfirm={() => void confirmBulkDelete()}
        onCancel={() => setPendingDeleteIds(null)}
      />
    </div>
  );
};

export default UserLinksGenerated;
