import { useEffect, useMemo, useState } from "react";
import { Link, NavLink } from "react-router-dom";
import {
  ArrowLeft,
  Copy,
  Check,
  ExternalLink,
  Link2,
  MousePointerClick,
  Plus,
  Search,
  Settings2,
  QrCode,
  Star,
  PauseCircle,
  Clock,
  Activity,
  LayoutDashboard,
  Sparkles,
} from "lucide-react";
import type { ReactNode } from "react";
import { getSession } from "../../utils/authApi";
import { buildShortUrl } from "../../utils/shortLink";
import {
  isLinkExpired,
  isLinkLive,
  parseQrStyle,
  QR_FEATURE_HIGHLIGHTS,
} from "../../utils/qrStyle";
import {
  listShortLinksByUser,
  updateShortLink,
  type ShortLinkRow,
} from "../../utils/shortLinkApi";
import LinkEditorPanel from "./LinkEditorPanel";
import QrStudioPanel from "./QrStudioPanel";

type StudioTab = "overview" | "edit" | "qr";
type SortMode = "newest" | "clicks" | "alpha";
type FilterMode = "all" | "favorites" | "paused" | "expired";

function displayHost(shortUrl: string): string {
  return shortUrl.replace(/^https?:\/\//, "");
}

function formatRelativeDate(iso: string): string {
  const date = new Date(iso);
  const diffMs = Date.now() - date.getTime();
  const minutes = Math.floor(diffMs / 60_000);
  if (minutes < 1) return "Just now";
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return date.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function barTone(row: ShortLinkRow, index: number): string {
  if (!row.is_active || isLinkExpired(row.expires_at)) {
    return "bg-white/10 text-[var(--uw-muted)] ring-1 ring-white/10";
  }
  if (row.is_favorite) return "uw-gradient";
  if (index % 3 === 1) return "bg-[var(--uw-navy)] text-white";
  if (index % 3 === 2) return "bg-white text-black";
  return "uw-gradient";
}

const UserLinksGenerated = () => {
  const session = getSession();
  const [myLinks, setMyLinks] = useState<ShortLinkRow[]>([]);
  const [status, setStatus] = useState<"idle" | "loading" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [sortMode, setSortMode] = useState<SortMode>("newest");
  const [filterMode, setFilterMode] = useState<FilterMode>("all");
  const [studioTab, setStudioTab] = useState<StudioTab>("overview");

  const displayName = session?.name ?? "User";
  const handle = session?.email
    ? `@${session.email.split("@")[0]}`
    : "@guest";
  const initials = displayName
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  useEffect(() => {
    if (!session) {
      setMyLinks([]);
      setSelectedId(null);
      return;
    }

    let cancelled = false;

    async function loadHistory() {
      setStatus("loading");
      setErrorMessage("");
      try {
        const rows = await listShortLinksByUser(session!.id);
        if (cancelled) return;
        setMyLinks(rows);
        setSelectedId(rows[0]?.id ?? null);
        setStatus("idle");
      } catch (err) {
        if (cancelled) return;
        setStatus("error");
        setErrorMessage(
          err instanceof Error ? err.message : "Could not load your links.",
        );
      }
    }

    void loadHistory();
    return () => {
      cancelled = true;
    };
  }, [session?.id]);

  useEffect(() => {
    if (!copiedCode) return;
    const timer = window.setTimeout(() => setCopiedCode(null), 2000);
    return () => window.clearTimeout(timer);
  }, [copiedCode]);

  const filteredLinks = useMemo(() => {
    const q = query.trim().toLowerCase();
    let rows = myLinks.filter((row) => {
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

    rows = [...rows].sort((a, b) => {
      if (sortMode === "clicks") return b.click_count - a.click_count;
      if (sortMode === "alpha") return a.code.localeCompare(b.code);
      return (
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );
    });

    return rows;
  }, [myLinks, query, sortMode, filterMode]);

  const selected = useMemo(
    () => myLinks.find((row) => row.id === selectedId) ?? null,
    [myLinks, selectedId],
  );

  const selectedShortUrl = selected ? buildShortUrl(selected.code) : null;
  const selectedLive = selected
    ? isLinkLive(selected.is_active, selected.expires_at)
    : false;

  const totalClicks = useMemo(
    () => myLinks.reduce((sum, row) => sum + (row.click_count ?? 0), 0),
    [myLinks],
  );

  const liveCount = useMemo(
    () =>
      myLinks.filter((row) => isLinkLive(row.is_active, row.expires_at)).length,
    [myLinks],
  );

  function upsertLink(row: ShortLinkRow) {
    setMyLinks((prev) => {
      const next = prev.map((item) => (item.id === row.id ? row : item));
      return next;
    });
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
    setStudioTab("overview");
  }

  async function handleCopy(shortUrl: string, code: string) {
    try {
      await navigator.clipboard.writeText(shortUrl);
      setCopiedCode(code);
      setErrorMessage("");
    } catch {
      setErrorMessage("Copy failed. Select the link and copy manually.");
    }
  }

  async function toggleFavorite(row: ShortLinkRow) {
    try {
      const updated = await updateShortLink(row.id, {
        is_favorite: !row.is_favorite,
      });
      upsertLink(updated);
    } catch (err) {
      setErrorMessage(
        err instanceof Error ? err.message : "Could not update favorite.",
      );
    }
  }

  function selectLink(id: string, tab: StudioTab = "overview") {
    setSelectedId(id);
    setStudioTab(tab);
  }

  const focusMode = studioTab === "edit" || studioTab === "qr";

  useEffect(() => {
    if (!focusMode) return;
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [focusMode, selectedId]);

  const tabBtn = (tab: StudioTab, label: string, icon: ReactNode) => (
    <button
      type="button"
      onClick={() => setStudioTab(tab)}
      className={[
        "inline-flex min-h-11 flex-1 items-center justify-center gap-tight rounded-full px-snug text-body-md font-bold transition-colors",
        studioTab === tab
          ? "uw-gradient"
          : "text-[var(--uw-muted)] hover:bg-white/5 hover:text-[var(--uw-text)]",
      ].join(" ")}
    >
      {icon}
      {label}
    </button>
  );

  return (
    <div className="mx-auto max-w-6xl space-y-roomy">
      <div className="flex flex-col gap-cozy lg:flex-row lg:items-center lg:justify-between uw-rise">
        <div className="flex flex-wrap items-center gap-tight">
          <NavLink
            to="/user/dashboard"
            className={({ isActive }) =>
              [
                "inline-flex min-h-11 items-center gap-tight rounded-full px-cozy text-body-md font-bold transition-colors",
                isActive
                  ? "uw-gradient"
                  : "bg-[var(--uw-card)] text-[var(--uw-muted)] hover:text-[var(--uw-text)]",
              ].join(" ")
            }
          >
            <LayoutDashboard size={16} aria-hidden />
            Dashboard
          </NavLink>
          <NavLink
            to="/user/links-generated"
            end
            className={({ isActive }) =>
              [
                "inline-flex min-h-11 items-center gap-tight rounded-full px-cozy text-body-md font-bold transition-colors",
                isActive
                  ? "uw-gradient"
                  : "bg-[var(--uw-card)] text-[var(--uw-muted)] hover:text-[var(--uw-text)]",
              ].join(" ")
            }
          >
            <Link2 size={16} aria-hidden />
            My Links
          </NavLink>
          <Link
            to="/user/dashboard"
            className="inline-flex min-h-11 items-center gap-tight rounded-full uw-gradient px-cozy font-bold hover:brightness-110 transition-all"
          >
            <Plus size={16} aria-hidden />
            New
          </Link>
        </div>

        <div className="flex items-center gap-snug self-end lg:self-auto">
          <div className="text-right min-w-0">
            <p className="font-bold text-body-md text-[var(--uw-text)] truncate">
              {displayName}
            </p>
            <p className="font-label-sm text-label-sm text-[var(--uw-muted)] truncate">
              {handle}
            </p>
          </div>
          <div
            className="relative flex size-12 shrink-0 items-center justify-center rounded-full bg-[var(--uw-card)] text-[var(--uw-lime)] font-bold ring-2 ring-white/10"
            aria-hidden
          >
            {initials || "U"}
            <span className="absolute -top-0.5 -right-0.5 flex size-5 items-center justify-center rounded-full bg-[#ff3b30] text-[10px] text-white font-bold">
              {myLinks.length > 9 ? "9+" : myLinks.length}
            </span>
          </div>
        </div>
      </div>

      {!focusMode ? (
        <div className="flex flex-col gap-cozy sm:flex-row sm:items-end sm:justify-between uw-rise-delay-1">
          <div className="min-w-0">
            <h1 className="text-[clamp(28px,5vw,42px)] font-bold tracking-tight uppercase leading-none uw-gradient-text">
              My Links
            </h1>
            <p className="mt-snug text-body-md text-[var(--uw-muted)] max-w-2xl">
              Customize vanity codes, pause links, and design branded QR codes.
            </p>
          </div>
          <div className="flex flex-wrap gap-tight">
            <span className="inline-flex min-h-11 items-center rounded-full bg-[var(--uw-card)] px-cozy text-label-sm font-bold text-[var(--uw-muted)]">
              Sort:{" "}
              <select
                value={sortMode}
                onChange={(e) => setSortMode(e.target.value as SortMode)}
                className="ml-1 bg-transparent text-[var(--uw-text)] outline-none cursor-pointer"
                aria-label="Sort links"
              >
                <option value="newest" className="bg-[var(--uw-card)]">
                  Newest
                </option>
                <option value="clicks" className="bg-[var(--uw-card)]">
                  Most clicks
                </option>
                <option value="alpha" className="bg-[var(--uw-card)]">
                  A–Z code
                </option>
              </select>
            </span>
          </div>
        </div>
      ) : null}

      {!focusMode ? (
        <div className="rounded-[1.75rem] border border-white/5 bg-[var(--uw-card)] p-cozy uw-rise-delay-2">
          <div className="flex items-start gap-snug mb-cozy">
            <span className="inline-flex size-10 shrink-0 items-center justify-center rounded-2xl uw-gradient">
              <Sparkles size={18} aria-hidden />
            </span>
            <div className="min-w-0">
              <h2 className="font-bold text-body-md text-[var(--uw-text)]">
                Advanced QR Code Features
              </h2>
              <p className="mt-tight text-label-sm text-[var(--uw-muted)]">
                Open any link → QR tab. Logo, shapes, frames, PNG/SVG/PDF, dynamic
                destination.
              </p>
            </div>
          </div>
          <ul className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-snug">
            {QR_FEATURE_HIGHLIGHTS.map((feature) => (
              <li
                key={feature.title}
                className="rounded-2xl border border-white/5 bg-[var(--uw-elevated)] px-cozy py-snug"
              >
                <p className="font-bold text-label-sm text-[var(--uw-cyan)]">
                  {feature.title}
                </p>
                <p className="mt-tight text-[12px] text-[var(--uw-muted)] leading-snug">
                  {feature.detail}
                </p>
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      {!focusMode && myLinks.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-gutter uw-rise-delay-2">
          {[
            {
              label: "Short links",
              value: myLinks.length,
              icon: Link2,
              accent: "text-[var(--uw-lime)]",
            },
            {
              label: "Live now",
              value: liveCount,
              icon: Activity,
              accent: "text-[var(--uw-orange)]",
            },
            {
              label: "Total clicks",
              value: totalClicks,
              icon: MousePointerClick,
              accent: "text-white",
            },
          ].map((stat) => {
            const Icon = stat.icon;
            return (
              <div
                key={stat.label}
                className="rounded-[1.75rem] bg-[var(--uw-card)] p-cozy border border-white/5"
              >
                <div className="flex items-center justify-between gap-snug">
                  <p className="font-label-sm text-label-sm text-[var(--uw-muted)] uppercase tracking-wide">
                    {stat.label}
                  </p>
                  <span
                    className={`inline-flex size-10 items-center justify-center rounded-2xl bg-white/5 ${stat.accent}`}
                  >
                    <Icon size={18} aria-hidden />
                  </span>
                </div>
                <p className="mt-snug text-display-lg-mobile font-display-lg text-[var(--uw-text)]">
                  {stat.value}
                </p>
              </div>
            );
          })}
        </div>
      ) : null}

      {status === "loading" ? (
        <div className="space-y-snug" aria-busy="true" aria-live="polite">
          <p className="text-[var(--uw-muted)] text-body-md">
            Loading your short links…
          </p>
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className="h-16 rounded-full bg-[var(--uw-card)] animate-pulse border border-white/5"
            />
          ))}
        </div>
      ) : null}

      {status === "error" || errorMessage ? (
        <p className="text-[#ff6b6b] text-body-md" role="alert">
          {errorMessage}
        </p>
      ) : null}

      {status !== "loading" && myLinks.length === 0 ? (
        <div className="rounded-[1.75rem] border border-dashed border-white/15 bg-[var(--uw-card)] px-cozy py-wide text-center">
          <span className="mx-auto mb-cozy flex size-14 items-center justify-center rounded-full uw-gradient">
            <Link2 size={28} aria-hidden />
          </span>
          <h2 className="font-headline-md text-headline-md text-[var(--uw-text)]">
            No short links yet
          </h2>
          <p className="mt-tight mx-auto max-w-md text-body-md text-[var(--uw-muted)]">
            Create one from the dashboard, then customize the code and QR here.
          </p>
          <Link
            to="/user/dashboard"
            className="mt-cozy inline-flex min-h-11 items-center justify-center gap-tight rounded-full uw-gradient px-cozy font-bold hover:brightness-110 transition-all"
          >
            <Plus size={18} aria-hidden />
            Create short link
          </Link>
        </div>
      ) : null}

      {status !== "loading" && myLinks.length > 0 && focusMode && selected && selectedShortUrl ? (
        <section className="mx-auto w-full max-w-4xl space-y-cozy uw-rise">
          <div className="flex flex-col gap-snug sm:flex-row sm:items-center sm:justify-between">
            <button
              type="button"
              onClick={() => setStudioTab("overview")}
              className="inline-flex min-h-11 w-fit items-center gap-tight rounded-full bg-[var(--uw-card)] px-cozy font-bold text-[var(--uw-text)] hover:bg-white/10 transition-colors border border-white/5"
            >
              <ArrowLeft size={16} aria-hidden />
              Back to links
            </button>
            <p className="font-mono-label text-label-sm text-[var(--uw-lime)] font-bold break-all sm:text-right">
              {displayHost(selectedShortUrl)}
            </p>
          </div>

          <div className="rounded-[1.75rem] bg-[var(--uw-card)] p-cozy sm:p-roomy border border-white/5 space-y-cozy">
            <div className="min-w-0">
              <h2 className="font-bold text-[clamp(20px,3vw,28px)] text-[var(--uw-text)] tracking-tight">
                {selected.title || "Link studio"}
              </h2>
              <p className="mt-tight font-label-sm text-label-sm text-[var(--uw-muted)]">
                {selectedLive
                  ? "Live · redirects work"
                  : "Not live · redirect blocked"}
                {" · "}
                {studioTab === "edit" ? "Edit details" : "QR design"}
              </p>
            </div>

            <div className="flex gap-1 rounded-full bg-[var(--uw-elevated)] p-1 max-w-md">
              {tabBtn("overview", "Info", <Link2 size={16} aria-hidden />)}
              {tabBtn("edit", "Edit", <Settings2 size={16} aria-hidden />)}
              {tabBtn("qr", "QR", <QrCode size={16} aria-hidden />)}
            </div>

            {studioTab === "edit" ? (
              <LinkEditorPanel
                link={selected}
                onSaved={upsertLink}
                onDeleted={removeLink}
              />
            ) : null}

            {studioTab === "qr" ? (
              <QrStudioPanel
                link={selected}
                shortUrl={selectedShortUrl}
                onSaved={upsertLink}
                onEditDestination={() => setStudioTab("edit")}
              />
            ) : null}
          </div>
        </section>
      ) : null}

      {status !== "loading" && myLinks.length > 0 && !focusMode ? (
        <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,1fr)_minmax(300px,380px)] gap-gutter items-start">
          <div className="space-y-snug min-w-0">
            <div className="flex flex-col gap-snug sm:flex-row">
              <label className="relative block flex-1">
                <span className="sr-only">Search short links</span>
                <Search
                  size={18}
                  className="pointer-events-none absolute left-snug top-1/2 -translate-y-1/2 text-[var(--uw-muted)]"
                  aria-hidden
                />
                <input
                  type="search"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search code, label, destination…"
                  className="w-full min-h-12 rounded-full border border-white/5 bg-[var(--uw-card)] pl-11 pr-cozy text-body-md text-[var(--uw-text)] placeholder:text-[var(--uw-muted)] outline-none focus:ring-2 focus:ring-[var(--uw-lime)]/30 transition-all"
                />
              </label>
            </div>

            <div className="flex flex-wrap gap-tight">
              {(
                [
                  ["all", "All"],
                  ["favorites", "Favorites"],
                  ["paused", "Paused"],
                  ["expired", "Expired"],
                ] as const
              ).map(([value, label]) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setFilterMode(value)}
                  className={[
                    "inline-flex min-h-11 items-center rounded-full px-cozy font-bold text-label-sm transition-colors",
                    filterMode === value
                      ? "uw-gradient"
                      : "bg-[var(--uw-card)] text-[var(--uw-muted)] hover:text-[var(--uw-text)]",
                  ].join(" ")}
                >
                  {label}
                </button>
              ))}
            </div>

            {filteredLinks.length === 0 ? (
              <p className="rounded-[1.75rem] bg-[var(--uw-card)] p-cozy text-body-md text-[var(--uw-muted)] border border-white/5">
                No short links match this filter.
              </p>
            ) : (
              <ul className="space-y-snug">
                {filteredLinks.map((row, index) => {
                  const shortUrl = buildShortUrl(row.code);
                  const host = displayHost(shortUrl);
                  const isSelected = selectedId === row.id;
                  const isCopied = copiedCode === row.code;
                  const live = isLinkLive(row.is_active, row.expires_at);
                  const expired = isLinkExpired(row.expires_at);
                  const qrPreview = parseQrStyle(row.qr_style);
                  const tone = barTone(row, index);

                  return (
                    <li key={row.id} className="uw-pop">
                      <div
                        className={[
                          "rounded-[1.5rem] bg-[var(--uw-card)] p-snug border transition-colors",
                          isSelected
                            ? "border-[var(--uw-lime)]/50"
                            : "border-white/5 hover:border-white/15",
                        ].join(" ")}
                      >
                        <button
                          type="button"
                          onClick={() => selectLink(row.id, "overview")}
                          className="w-full min-w-0 text-left"
                          aria-pressed={isSelected}
                        >
                          <div className="flex items-center gap-snug">
                            <span className="w-10 shrink-0 font-label-sm text-label-sm text-[var(--uw-muted)]">
                              {new Date(row.created_at).toLocaleDateString(
                                undefined,
                                { day: "2-digit", month: "2-digit" },
                              )}
                            </span>
                            <div
                              className={`flex min-h-12 flex-1 items-center justify-between gap-snug rounded-full px-cozy ${tone} transition-transform hover:scale-[1.01]`}
                            >
                              <span className="inline-flex items-center gap-tight min-w-0">
                                <span
                                  className="size-8 shrink-0 rounded-full border border-black/10"
                                  style={{
                                    background: `linear-gradient(135deg, ${qrPreview.fgColor} 50%, ${qrPreview.bgColor} 50%)`,
                                  }}
                                  title="Saved QR colors"
                                  aria-hidden
                                />
                                <span className="min-w-0">
                                  <span className="block font-bold text-label-sm truncate">
                                    {row.title || host}
                                  </span>
                                  <span className="block text-[11px] opacity-70 truncate">
                                    {host}
                                  </span>
                                </span>
                              </span>
                              <span className="inline-flex items-center gap-1 shrink-0 font-bold text-label-sm">
                                <MousePointerClick size={14} aria-hidden />
                                {row.click_count}
                              </span>
                            </div>
                          </div>

                          <p className="mt-snug pl-[3.25rem] text-[var(--uw-muted)] font-label-sm text-label-sm break-all line-clamp-1">
                            {row.original_url}
                          </p>
                          <div className="mt-tight pl-[3.25rem] flex flex-wrap items-center gap-tight">
                            {row.is_favorite ? (
                              <span className="inline-flex items-center gap-1 rounded-full bg-[var(--uw-lime)]/15 px-2.5 py-1 text-[var(--uw-lime)] font-label-sm text-label-sm font-bold">
                                <Star size={12} fill="currentColor" aria-hidden />
                                Fav
                              </span>
                            ) : null}
                            {!row.is_active ? (
                              <span className="inline-flex items-center gap-1 rounded-full bg-[#ff6b6b]/15 px-2.5 py-1 text-[#ff6b6b] font-label-sm text-label-sm font-bold">
                                <PauseCircle size={12} aria-hidden />
                                Paused
                              </span>
                            ) : null}
                            {expired ? (
                              <span className="inline-flex items-center gap-1 rounded-full bg-white/10 px-2.5 py-1 text-[var(--uw-muted)] font-label-sm text-label-sm font-bold">
                                <Clock size={12} aria-hidden />
                                Expired
                              </span>
                            ) : null}
                            {live ? (
                              <span className="inline-flex items-center gap-1 rounded-full bg-[var(--uw-lime)]/15 px-2.5 py-1 text-[var(--uw-lime)] font-label-sm text-label-sm font-bold">
                                Live
                              </span>
                            ) : null}
                            <span className="text-[var(--uw-muted)] font-label-sm text-label-sm">
                              {formatRelativeDate(row.created_at)}
                            </span>
                          </div>
                        </button>

                        <div className="mt-snug pl-[3.25rem] flex flex-wrap gap-tight">
                          <button
                            type="button"
                            onClick={() => void handleCopy(shortUrl, row.code)}
                            className="inline-flex min-h-11 items-center gap-tight rounded-full bg-white/5 px-snug text-body-md font-bold text-[var(--uw-lime)] hover:bg-white/10 transition-colors"
                          >
                            {isCopied ? (
                              <Check size={16} aria-hidden />
                            ) : (
                              <Copy size={16} aria-hidden />
                            )}
                            {isCopied ? "Copied" : "Copy"}
                          </button>
                          <a
                            href={shortUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex min-h-11 items-center gap-tight rounded-full bg-white/5 px-snug text-body-md font-bold text-[var(--uw-text)] hover:bg-white/10 transition-colors"
                          >
                            <ExternalLink size={16} aria-hidden />
                            Open
                          </a>
                          <button
                            type="button"
                            onClick={() => void toggleFavorite(row)}
                            className="inline-flex min-h-11 items-center gap-tight rounded-full bg-white/5 px-snug font-bold text-[var(--uw-text)] hover:bg-white/10 transition-colors"
                            aria-label={
                              row.is_favorite
                                ? "Remove favorite"
                                : "Add favorite"
                            }
                          >
                            <Star
                              size={16}
                              fill={row.is_favorite ? "currentColor" : "none"}
                              className={
                                row.is_favorite
                                  ? "text-[var(--uw-lime)]"
                                  : undefined
                              }
                              aria-hidden
                            />
                          </button>
                          <button
                            type="button"
                            onClick={() => selectLink(row.id, "edit")}
                            className="inline-flex min-h-11 items-center gap-tight rounded-full bg-white/5 px-snug font-bold text-[var(--uw-text)] hover:bg-white/10 transition-colors"
                          >
                            <Settings2 size={16} aria-hidden />
                            Edit
                          </button>
                          <button
                            type="button"
                            onClick={() => selectLink(row.id, "qr")}
                            className="inline-flex min-h-11 items-center gap-tight rounded-full bg-white/5 px-snug font-bold text-[var(--uw-text)] hover:bg-white/10 transition-colors"
                          >
                            <QrCode size={16} aria-hidden />
                            QR
                          </button>
                        </div>
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}

            <div className="flex flex-wrap gap-cozy pt-snug">
              <span className="inline-flex items-center gap-tight text-label-sm text-[var(--uw-muted)]">
                <span className="size-2 rounded-full bg-[var(--uw-cyan)]" aria-hidden />
                Favorite / hot
              </span>
              <span className="inline-flex items-center gap-tight text-label-sm text-[var(--uw-muted)]">
                <span className="size-2 rounded-full bg-[var(--uw-navy)]" aria-hidden />
                Active
              </span>
              <span className="inline-flex items-center gap-tight text-label-sm text-[var(--uw-muted)]">
                <span className="size-2 rounded-full bg-white/40" aria-hidden />
                Paused / expired
              </span>
            </div>
          </div>

          {selected && selectedShortUrl ? (
            <aside className="rounded-[1.75rem] bg-[var(--uw-card)] p-cozy xl:sticky xl:top-cozy space-y-cozy border border-white/5">
              <div>
                <p className="font-bold text-body-md text-[var(--uw-text)]">
                  {selected.title || "Link studio"}
                </p>
                <p className="font-mono-label text-[var(--uw-lime)] font-bold break-all text-label-sm mt-tight">
                  {displayHost(selectedShortUrl)}
                </p>
                <p className="mt-tight font-label-sm text-label-sm text-[var(--uw-muted)]">
                  {selectedLive
                    ? "Live · redirects work"
                    : "Not live · redirect blocked"}
                </p>
              </div>

              <dl className="space-y-snug text-body-md">
                <div>
                  <dt className="font-label-sm text-label-sm text-[var(--uw-muted)]">
                    Destination
                  </dt>
                  <dd className="break-all text-[var(--uw-text)]">
                    {selected.original_url}
                  </dd>
                </div>
                <div>
                  <dt className="font-label-sm text-label-sm text-[var(--uw-muted)]">
                    Clicks
                  </dt>
                  <dd className="text-[var(--uw-text)] font-bold">
                    {selected.click_count}
                  </dd>
                </div>
                {selected.notes ? (
                  <div>
                    <dt className="font-label-sm text-label-sm text-[var(--uw-muted)]">
                      Notes
                    </dt>
                    <dd className="text-[var(--uw-text)] whitespace-pre-wrap">
                      {selected.notes}
                    </dd>
                  </div>
                ) : null}
                {selected.expires_at ? (
                  <div>
                    <dt className="font-label-sm text-label-sm text-[var(--uw-muted)]">
                      Expires
                    </dt>
                    <dd className="text-[var(--uw-text)]">
                      {new Date(selected.expires_at).toLocaleString()}
                    </dd>
                  </div>
                ) : null}
              </dl>

              <button
                type="button"
                onClick={() =>
                  void handleCopy(selectedShortUrl, selected.code)
                }
                className="inline-flex min-h-11 w-full items-center justify-center gap-tight rounded-full uw-gradient px-cozy font-bold hover:brightness-110 transition-all"
              >
                {copiedCode === selected.code ? (
                  <Check size={16} aria-hidden />
                ) : (
                  <Copy size={16} aria-hidden />
                )}
                {copiedCode === selected.code ? "Copied" : "Copy short link"}
              </button>
              <div className="grid grid-cols-2 gap-tight">
                <button
                  type="button"
                  onClick={() => setStudioTab("edit")}
                  className="inline-flex min-h-11 items-center justify-center gap-tight rounded-full bg-white/5 font-bold text-[var(--uw-text)] hover:bg-white/10 transition-colors"
                >
                  <Settings2 size={16} aria-hidden />
                  Edit
                </button>
                <button
                  type="button"
                  onClick={() => setStudioTab("qr")}
                  className="inline-flex min-h-11 items-center justify-center gap-tight rounded-full bg-white/5 font-bold text-[var(--uw-text)] hover:bg-white/10 transition-colors"
                >
                  <QrCode size={16} aria-hidden />
                  QR
                </button>
              </div>
            </aside>
          ) : null}
        </div>
      ) : null}
    </div>
  );
};

export default UserLinksGenerated;
