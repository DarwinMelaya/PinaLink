import { useEffect, useMemo, useRef, useState, type FormEvent } from "react";
import { Link, NavLink, useNavigate } from "react-router-dom";
import { QRCodeSVG } from "qrcode.react";
import {
  ArrowDownRight,
  ArrowUpRight,
  BadgeCheck,
  ClipboardPaste,
  Copy,
  Check,
  Download,
  ExternalLink,
  LayoutDashboard,
  Link2,
  MousePointerClick,
  PauseCircle,
  PlayCircle,
  QrCode,
  RefreshCw,
  Settings2,
  Share2,
  ShieldCheck,
  Star,
  Clock,
  Heart,
} from "lucide-react";
import { getSession } from "../../utils/authApi";
import { buildShortUrl, normalizeUrl } from "../../utils/shortLink";
import {
  createShortLink,
  listShortLinksByUser,
  updateShortLink,
  type ShortLinkRow,
} from "../../utils/shortLinkApi";
import {
  isExpiringSoon,
  isLinkExpired,
  isLinkLive,
} from "../../utils/qrStyle";
import { listCertificatesByUser } from "../../utils/certificateApi";

type ShortenStatus = "idle" | "loading" | "success" | "error";

type ShortenResult = {
  id: string;
  shortUrl: string;
  code: string;
  originalUrl: string;
  title: string | null;
};

type BatchResult = {
  created: ShortenResult[];
  failed: string[];
};

function SparkLine({
  points,
  stroke,
}: {
  points: number[];
  stroke: string;
}) {
  const max = Math.max(...points, 1);
  const min = Math.min(...points, 0);
  const range = max - min || 1;
  const coords = points
    .map((value, index) => {
      const x = (index / Math.max(points.length - 1, 1)) * 100;
      const y = 36 - ((value - min) / range) * 28;
      return `${x},${y}`;
    })
    .join(" ");

  return (
    <svg viewBox="0 0 100 40" className="h-10 w-full" aria-hidden>
      <polyline
        fill="none"
        stroke={stroke}
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        points={coords}
      />
    </svg>
  );
}

function CapsuleStack({
  values,
  colors,
}: {
  values: number[];
  colors: string[];
}) {
  return (
    <div className="flex items-end justify-between gap-2 h-36 px-1">
      {values.map((value, index) => {
        const color = colors[index % colors.length];
        const height = `${Math.max(28, Math.min(100, value))}%`;
        const darkFill =
          color.includes("navy") ||
          color.includes("orange") ||
          color === "#002b5b" ||
          color === "#1b4f8a";
        return (
          <div
            key={`${color}-${index}`}
            className="flex flex-1 flex-col items-center justify-end gap-1.5 h-full"
          >
            <div
              className={[
                "w-full max-w-[2.75rem] rounded-full flex items-center justify-center text-[11px] font-bold shadow-sm transition-transform hover:scale-[1.03]",
                darkFill ? "text-white" : "text-[var(--uw-on-accent)]",
              ].join(" ")}
              style={{ background: color, height }}
            >
              {value}
            </div>
            <span className="size-1.5 rounded-full bg-white/40" aria-hidden />
          </div>
        );
      })}
    </div>
  );
}

function parseUrlLines(raw: string): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const line of raw.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed) continue;
    const normalized = normalizeUrl(trimmed);
    if (!normalized) continue;
    if (seen.has(normalized)) continue;
    seen.add(normalized);
    out.push(normalized);
  }
  return out;
}

const UserDashboard = () => {
  const navigate = useNavigate();
  const urlInputRef = useRef<HTMLTextAreaElement>(null);
  const [urlInput, setUrlInput] = useState("");
  const [titleInput, setTitleInput] = useState("");
  const [status, setStatus] = useState<ShortenStatus>("idle");
  const [errorMessage, setErrorMessage] = useState("");
  const [infoMessage, setInfoMessage] = useState("");
  const [result, setResult] = useState<ShortenResult | null>(null);
  const [batchResult, setBatchResult] = useState<BatchResult | null>(null);
  const [copied, setCopied] = useState(false);
  const [links, setLinks] = useState<ShortLinkRow[]>([]);
  const [certCount, setCertCount] = useState(0);
  const [certScans, setCertScans] = useState(0);
  const [refreshing, setRefreshing] = useState(false);
  const [rowBusyId, setRowBusyId] = useState<string | null>(null);

  const profile = getSession();
  const displayName = profile?.name ?? "User";
  const handle = profile?.email
    ? `@${profile.email.split("@")[0]}`
    : "@guest";
  const initials = displayName
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  async function loadDashboard(opts?: { quiet?: boolean }) {
    if (!profile) {
      setLinks([]);
      setCertCount(0);
      setCertScans(0);
      return;
    }
    if (opts?.quiet) setRefreshing(true);
    try {
      const [linkRows, certRows] = await Promise.all([
        listShortLinksByUser(profile.id),
        listCertificatesByUser(profile.id),
      ]);
      setLinks(linkRows);
      setCertCount(certRows.length);
      setCertScans(
        certRows.reduce((sum, row) => sum + (row.verify_count ?? 0), 0),
      );
    } catch {
      if (!opts?.quiet) {
        setLinks([]);
        setCertCount(0);
        setCertScans(0);
      }
    } finally {
      setRefreshing(false);
    }
  }

  useEffect(() => {
    void loadDashboard();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- reload on profile change only
  }, [profile?.id]);

  useEffect(() => {
    if (!infoMessage) return;
    const timer = window.setTimeout(() => setInfoMessage(""), 2500);
    return () => window.clearTimeout(timer);
  }, [infoMessage]);

  // Focus create box when landing with #create (sidebar Ctrl/Cmd+K)
  useEffect(() => {
    function focusCreate() {
      const el = document.getElementById("user-url-input");
      if (el instanceof HTMLTextAreaElement) {
        el.focus();
        el.scrollIntoView({ behavior: "smooth", block: "center" });
      }
    }

    function onHash() {
      if (window.location.hash === "#create") focusCreate();
    }

    window.addEventListener("hashchange", onHash);
    if (window.location.hash === "#create") focusCreate();
    return () => window.removeEventListener("hashchange", onHash);
  }, []);

  const totalClicks = useMemo(
    () => links.reduce((sum, row) => sum + (row.click_count ?? 0), 0),
    [links],
  );
  const liveCount = useMemo(
    () =>
      links.filter((row) => isLinkLive(row.is_active, row.expires_at)).length,
    [links],
  );
  const pausedCount = useMemo(
    () => links.filter((row) => !row.is_active).length,
    [links],
  );
  const favoriteCount = useMemo(
    () => links.filter((row) => row.is_favorite).length,
    [links],
  );
  const expiringSoonCount = useMemo(
    () =>
      links.filter(
        (row) =>
          row.is_active &&
          !isLinkExpired(row.expires_at) &&
          isExpiringSoon(row.expires_at),
      ).length,
    [links],
  );
  const avgClicks =
    links.length > 0 ? Math.round(totalClicks / links.length) : 0;

  const clickSpark = useMemo(() => {
    const recent = [...links]
      .sort(
        (a, b) =>
          new Date(a.created_at).getTime() - new Date(b.created_at).getTime(),
      )
      .slice(-8)
      .map((row) => row.click_count ?? 0);
    return recent.length >= 2 ? recent : [0, 1, 2, 1, 3, 2, 4, avgClicks || 2];
  }, [links, avgClicks]);

  const capsuleValues = useMemo(() => {
    const top = [...links]
      .sort((a, b) => b.click_count - a.click_count)
      .slice(0, 6)
      .map((row) => Math.max(12, Math.min(96, row.click_count || 12)));
    while (top.length < 6) top.push(18 + top.length * 8);
    return top;
  }, [links]);

  const recentLinks = useMemo(
    () =>
      [...links]
        .sort(
          (a, b) =>
            new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
        )
        .slice(0, 5),
    [links],
  );

  const lineCount = useMemo(
    () => urlInput.split(/\r?\n/).filter((line) => line.trim()).length,
    [urlInput],
  );

  async function handlePasteClipboard() {
    try {
      const text = await navigator.clipboard.readText();
      if (!text.trim()) {
        setErrorMessage("Clipboard is empty.");
        return;
      }
      setUrlInput((prev) => (prev.trim() ? `${prev.trim()}\n${text.trim()}` : text.trim()));
      setErrorMessage("");
      setInfoMessage("Pasted from clipboard.");
      urlInputRef.current?.focus();
    } catch {
      setErrorMessage("Could not read clipboard. Paste manually (Ctrl/Cmd+V).");
    }
  }

  async function handleShorten(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setCopied(false);
    setErrorMessage("");
    setBatchResult(null);

    const current = getSession();
    if (!current) {
      setStatus("error");
      setErrorMessage("Session expired. Please log in again.");
      setResult(null);
      return;
    }

    const urls = parseUrlLines(urlInput);
    if (urls.length === 0) {
      setStatus("error");
      setErrorMessage("Enter at least one valid http(s) URL (one per line).");
      setResult(null);
      return;
    }

    const title = titleInput.trim() || null;
    setStatus("loading");

    try {
      if (urls.length === 1) {
        const row = await createShortLink(urls[0], current.id, { title });
        setResult({
          id: row.id,
          shortUrl: buildShortUrl(row.code),
          code: row.code,
          originalUrl: row.original_url,
          title: row.title,
        });
        setBatchResult(null);
        setUrlInput("");
        setTitleInput("");
        setStatus("success");
        setLinks((prev) => [row, ...prev]);
        return;
      }

      const created: ShortenResult[] = [];
      const failed: string[] = [];
      const newRows: ShortLinkRow[] = [];

      for (let i = 0; i < urls.length; i++) {
        const url = urls[i];
        try {
          const rowTitle =
            title && i === 0
              ? title
              : title
                ? `${title} (${i + 1})`
                : null;
          const row = await createShortLink(url, current.id, {
            title: rowTitle,
          });
          newRows.push(row);
          created.push({
            id: row.id,
            shortUrl: buildShortUrl(row.code),
            code: row.code,
            originalUrl: row.original_url,
            title: row.title,
          });
        } catch {
          failed.push(url);
        }
      }

      setLinks((prev) => [...newRows, ...prev]);
      setBatchResult({ created, failed });
      setResult(created[0] ?? null);
      setUrlInput("");
      setTitleInput("");
      setStatus(created.length > 0 ? "success" : "error");
      if (created.length === 0) {
        setErrorMessage("Batch create failed for all URLs.");
      } else if (failed.length > 0) {
        setInfoMessage(
          `Created ${created.length}; ${failed.length} failed.`,
        );
      } else {
        setInfoMessage(`Created ${created.length} short links.`);
      }
    } catch (err) {
      setStatus("error");
      setResult(null);
      setErrorMessage(err instanceof Error ? err.message : "Shorten failed.");
    }
  }

  async function handleCopy(text?: string) {
    const value = text ?? result?.shortUrl;
    if (!value) return;
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      setInfoMessage("Copied.");
    } catch {
      setErrorMessage("Copy failed. Select the link and copy manually.");
    }
  }

  async function handleShareResult() {
    if (!result) return;
    try {
      if (typeof navigator.share === "function") {
        await navigator.share({
          title: result.title || "Pinalink short link",
          url: result.shortUrl,
        });
        setInfoMessage("Shared.");
        return;
      }
      await handleCopy(result.shortUrl);
      setInfoMessage("Share unavailable — link copied.");
    } catch (err) {
      if (err instanceof DOMException && err.name === "AbortError") return;
      await handleCopy(result.shortUrl);
    }
  }

  function handleDownloadQr() {
    if (!result) return;
    const svg = document.getElementById("user-pinalink-qr");
    if (!(svg instanceof SVGElement)) return;

    const serializer = new XMLSerializer();
    const source = serializer.serializeToString(svg);
    const blob = new Blob([source], { type: "image/svg+xml;charset=utf-8" });
    const href = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = href;
    anchor.download = `pinalink-${result.code}.svg`;
    anchor.click();
    URL.revokeObjectURL(href);
  }

  function openStudio(id: string, tab: "edit" | "qr") {
    navigate("/user/links-generated", { state: { selectId: id, tab } });
  }

  async function toggleFavorite(row: ShortLinkRow) {
    setRowBusyId(row.id);
    try {
      const updated = await updateShortLink(row.id, {
        is_favorite: !row.is_favorite,
      });
      setLinks((prev) => prev.map((item) => (item.id === updated.id ? updated : item)));
      setInfoMessage(updated.is_favorite ? "Favorited." : "Unfavorited.");
    } catch (err) {
      setErrorMessage(
        err instanceof Error ? err.message : "Could not update favorite.",
      );
    } finally {
      setRowBusyId(null);
    }
  }

  async function togglePause(row: ShortLinkRow) {
    setRowBusyId(row.id);
    try {
      const updated = await updateShortLink(row.id, {
        is_active: !row.is_active,
      });
      setLinks((prev) => prev.map((item) => (item.id === updated.id ? updated : item)));
      setInfoMessage(updated.is_active ? "Resumed." : "Paused.");
    } catch (err) {
      setErrorMessage(
        err instanceof Error ? err.message : "Could not update link.",
      );
    } finally {
      setRowBusyId(null);
    }
  }

  return (
    <div className="mx-auto max-w-6xl space-y-roomy">
      <div className="flex flex-col gap-cozy lg:flex-row lg:items-center lg:justify-between uw-rise">
        <div className="flex flex-wrap items-center gap-tight">
          <NavLink
            to="/user/dashboard"
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
            <LayoutDashboard size={16} aria-hidden />
            Dashboard
          </NavLink>
          <NavLink
            to="/user/links-generated"
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
          <NavLink
            to="/user/verified-certificate"
            className={({ isActive }) =>
              [
                "inline-flex min-h-11 items-center gap-tight rounded-full px-cozy text-body-md font-bold transition-colors",
                isActive
                  ? "uw-gradient"
                  : "bg-[var(--uw-card)] text-[var(--uw-muted)] hover:text-[var(--uw-text)]",
              ].join(" ")
            }
          >
            <BadgeCheck size={16} aria-hidden />
            Certificates
          </NavLink>
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
              {links.length > 9 ? "9+" : links.length}
            </span>
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-cozy sm:flex-row sm:items-end sm:justify-between uw-rise-delay-1">
        <div>
          <h1 className="text-[clamp(28px,5vw,42px)] font-bold tracking-tight uppercase leading-none uw-gradient-text">
            Dashboard
          </h1>
          <p className="mt-snug text-label-sm text-[var(--uw-muted)]">
            Tip: Ctrl/Cmd+K jumps to create. Multi-line paste = batch shorten.
          </p>
        </div>
        <div className="flex flex-wrap gap-tight">
          <button
            type="button"
            onClick={() => void loadDashboard({ quiet: true })}
            disabled={refreshing}
            className="inline-flex min-h-11 items-center gap-tight rounded-full bg-[var(--uw-card)] px-cozy text-label-sm font-bold text-[var(--uw-text)] hover:bg-white/10 transition-colors disabled:opacity-60 border border-white/5"
          >
            <RefreshCw
              size={16}
              className={refreshing ? "animate-spin" : undefined}
              aria-hidden
            />
            Refresh
          </button>
          <span className="inline-flex min-h-11 items-center rounded-full bg-[var(--uw-card)] px-cozy text-label-sm font-bold text-[var(--uw-muted)]">
            Links:{" "}
            <span className="ml-1 text-[var(--uw-text)]">{links.length}</span>
          </span>
          <span className="inline-flex min-h-11 items-center rounded-full bg-[var(--uw-card)] px-cozy text-label-sm font-bold text-[var(--uw-muted)]">
            Live:{" "}
            <span className="ml-1 text-[var(--uw-lime)]">{liveCount}</span>
          </span>
          <span className="inline-flex min-h-11 items-center rounded-full bg-[var(--uw-card)] px-cozy text-label-sm font-bold text-[var(--uw-muted)]">
            Certs:{" "}
            <span className="ml-1 text-[var(--uw-cyan)]">{certCount}</span>
          </span>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-snug uw-rise-delay-1">
        {[
          {
            label: "Paused",
            value: pausedCount,
            icon: PauseCircle,
            accent: "text-[#ff6b6b]",
          },
          {
            label: "Favorites",
            value: favoriteCount,
            icon: Heart,
            accent: "text-[var(--uw-lime)]",
          },
          {
            label: "Expiring soon",
            value: expiringSoonCount,
            icon: Clock,
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
              className="rounded-[1.25rem] border border-white/5 bg-[var(--uw-card)] p-cozy"
            >
              <div className="flex items-center justify-between gap-snug">
                <p className="font-label-sm text-label-sm text-[var(--uw-muted)] uppercase tracking-wide">
                  {stat.label}
                </p>
                <span
                  className={`inline-flex size-9 items-center justify-center rounded-2xl bg-white/5 ${stat.accent}`}
                >
                  <Icon size={16} aria-hidden />
                </span>
              </div>
              <p className="mt-snug text-2xl font-bold text-[var(--uw-text)]">
                {stat.value}
              </p>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-snug uw-rise-delay-1">
        <Link
          to="/user/links-generated"
          className="rounded-[1.25rem] border border-white/5 bg-[var(--uw-card)] p-cozy hover:border-[var(--uw-cyan)]/40 transition-colors min-h-14 flex items-center gap-snug"
        >
          <span className="inline-flex size-10 shrink-0 items-center justify-center rounded-2xl bg-white/5 text-[var(--uw-cyan)]">
            <QrCode size={18} aria-hidden />
          </span>
          <span className="min-w-0">
            <span className="block font-bold text-body-md text-[var(--uw-text)]">
              QR studio
            </span>
            <span className="block text-label-sm text-[var(--uw-muted)]">
              Shapes, logo, PNG/SVG/PDF
            </span>
          </span>
        </Link>
        <Link
          to="/user/verified-certificate"
          className="rounded-[1.25rem] border border-white/5 bg-[var(--uw-card)] p-cozy hover:border-[var(--uw-cyan)]/40 transition-colors min-h-14 flex items-center gap-snug"
        >
          <span className="inline-flex size-10 shrink-0 items-center justify-center rounded-2xl bg-white/5 text-[var(--uw-lime)]">
            <BadgeCheck size={18} aria-hidden />
          </span>
          <span className="min-w-0">
            <span className="block font-bold text-body-md text-[var(--uw-text)]">
              Certificates
            </span>
            <span className="block text-label-sm text-[var(--uw-muted)]">
              Issue, bulk Excel, branding
            </span>
          </span>
        </Link>
        <Link
          to="/cert"
          target="_blank"
          rel="noopener noreferrer"
          className="rounded-[1.25rem] border border-white/5 bg-[var(--uw-card)] p-cozy hover:border-[var(--uw-cyan)]/40 transition-colors min-h-14 flex items-center gap-snug"
        >
          <span className="inline-flex size-10 shrink-0 items-center justify-center rounded-2xl bg-white/5 text-[var(--uw-orange)]">
            <ShieldCheck size={18} aria-hidden />
          </span>
          <span className="min-w-0">
            <span className="block font-bold text-body-md text-[var(--uw-text)]">
              Verify portal
            </span>
            <span className="block text-label-sm text-[var(--uw-muted)]">
              Public /cert lookup
            </span>
          </span>
        </Link>
      </div>

      {errorMessage ? (
        <p className="text-[#ff6b6b] text-body-md" role="alert">
          {errorMessage}
        </p>
      ) : null}
      {infoMessage ? (
        <p className="text-[var(--uw-lime)] text-body-md" role="status">
          {infoMessage}
        </p>
      ) : null}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-gutter uw-rise-delay-2">
        <form
          id="create-short-link"
          onSubmit={handleShorten}
          className="lg:col-span-7 rounded-[1.75rem] bg-[var(--uw-card)] p-cozy md:p-roomy border border-white/5 scroll-mt-24"
        >
          <div className="flex items-start justify-between gap-snug mb-cozy">
            <div>
              <p className="font-label-sm text-label-sm uppercase tracking-wide text-[var(--uw-muted)]">
                Shorten
              </p>
              <h2 className="mt-tight text-headline-md font-headline-md text-[var(--uw-text)]">
                Paste long URL{lineCount > 1 ? "s" : ""}
              </h2>
            </div>
            <button
              type="button"
              onClick={() => void handlePasteClipboard()}
              className="inline-flex min-h-11 items-center gap-tight rounded-full bg-white/5 px-cozy text-label-sm font-bold text-[var(--uw-text)] hover:bg-white/10 transition-colors"
            >
              <ClipboardPaste size={16} aria-hidden />
              Paste
            </button>
          </div>

          <label className="sr-only" htmlFor="user-title-input">
            Optional title
          </label>
          <input
            id="user-title-input"
            type="text"
            value={titleInput}
            onChange={(e) => setTitleInput(e.target.value)}
            placeholder="Optional title / label"
            maxLength={120}
            className="mb-tight w-full min-h-12 px-cozy rounded-full border border-white/5 bg-[var(--uw-elevated)] text-body-md text-[var(--uw-text)] placeholder:text-[var(--uw-muted)] outline-none focus:ring-2 focus:ring-[var(--uw-lime)]/30"
          />

          <label className="sr-only" htmlFor="user-url-input">
            Paste your long URL(s), one per line
          </label>
          <div className="flex flex-col gap-tight rounded-[1.25rem] bg-[var(--uw-elevated)] p-1.5 ring-1 ring-white/5 focus-within:ring-[var(--uw-lime)]/40 transition-all">
            <textarea
              ref={urlInputRef}
              className="w-full min-h-[5.5rem] px-cozy py-snug bg-transparent rounded-2xl border-0 text-body-md text-[var(--uw-text)] placeholder:text-[var(--uw-muted)] outline-none resize-y"
              id="user-url-input"
              placeholder={"https://example.com/path\nhttps://another.com/page"}
              value={urlInput}
              onChange={(e) => setUrlInput(e.target.value)}
              autoComplete="url"
              required
              rows={3}
            />
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-tight px-snug pb-snug">
              <p className="text-label-sm text-[var(--uw-muted)]">
                {lineCount > 1
                  ? `${lineCount} URLs detected · batch create`
                  : "One URL, or one per line for batch"}
              </p>
              <button
                type="submit"
                disabled={status === "loading"}
                className="shrink-0 min-h-12 uw-gradient px-roomy rounded-full font-bold hover:brightness-110 active:scale-[0.98] transition-all disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {status === "loading"
                  ? "Creating..."
                  : lineCount > 1
                    ? `Shorten ${lineCount}`
                    : "Shorten"}
              </button>
            </div>
          </div>

          {batchResult && batchResult.created.length > 1 ? (
            <div className="mt-cozy rounded-2xl border border-white/5 bg-[var(--uw-elevated)] p-cozy space-y-snug">
              <p className="font-bold text-body-md text-[var(--uw-text)]">
                Batch: {batchResult.created.length} created
                {batchResult.failed.length
                  ? `, ${batchResult.failed.length} failed`
                  : ""}
              </p>
              <ul className="space-y-tight max-h-40 overflow-y-auto">
                {batchResult.created.map((item) => (
                  <li
                    key={item.id}
                    className="flex flex-wrap items-center justify-between gap-tight text-label-sm"
                  >
                    <span className="font-mono-label text-[var(--uw-lime)] break-all">
                      {item.shortUrl.replace(/^https?:\/\//, "")}
                    </span>
                    <button
                      type="button"
                      onClick={() => void handleCopy(item.shortUrl)}
                      className="inline-flex min-h-11 items-center gap-1 rounded-full bg-white/5 px-snug font-bold text-[var(--uw-text)]"
                    >
                      <Copy size={14} aria-hidden />
                      Copy
                    </button>
                  </li>
                ))}
              </ul>
              <Link
                to="/user/links-generated"
                className="inline-flex min-h-11 items-center font-bold text-[var(--uw-lime)] hover:underline"
              >
                Open all in My Links
              </Link>
            </div>
          ) : null}

          {result ? (
            <div
              className="mt-roomy border-t border-white/5 pt-roomy flex flex-col md:flex-row items-center gap-roomy uw-pop"
              aria-live="polite"
            >
              <div className="flex-grow space-y-cozy w-full min-w-0">
                <div className="rounded-2xl bg-[var(--uw-elevated)] p-cozy flex items-center justify-between gap-snug ring-1 ring-white/5">
                  <span className="font-mono-label text-[var(--uw-lime)] font-bold break-all text-left">
                    {result.shortUrl.replace(/^https?:\/\//, "")}
                  </span>
                  <button
                    type="button"
                    onClick={() => void handleCopy()}
                    className="inline-flex items-center gap-tight rounded-full bg-[var(--uw-lime)]/15 px-snug min-h-11 text-[var(--uw-lime)] font-bold shrink-0 hover:bg-[var(--uw-lime)]/25 transition-colors"
                  >
                    {copied ? <Check size={16} aria-hidden /> : <Copy size={16} aria-hidden />}
                    <span>{copied ? "Copied" : "Copy"}</span>
                  </button>
                </div>
                <p className="text-[var(--uw-muted)] font-label-sm text-label-sm break-all">
                  Opens: {result.originalUrl}
                </p>
                <div className="flex flex-wrap gap-tight">
                  <button
                    type="button"
                    onClick={() => void handleShareResult()}
                    className="inline-flex min-h-11 items-center gap-tight rounded-full bg-white/5 px-cozy font-bold text-[var(--uw-text)] hover:bg-white/10"
                  >
                    <Share2 size={16} aria-hidden />
                    Share
                  </button>
                  <button
                    type="button"
                    onClick={() => openStudio(result.id, "edit")}
                    className="inline-flex min-h-11 items-center gap-tight rounded-full bg-white/5 px-cozy font-bold text-[var(--uw-text)] hover:bg-white/10"
                  >
                    <Settings2 size={16} aria-hidden />
                    Edit
                  </button>
                  <button
                    type="button"
                    onClick={() => openStudio(result.id, "qr")}
                    className="inline-flex min-h-11 items-center gap-tight rounded-full bg-white/5 px-cozy font-bold text-[var(--uw-text)] hover:bg-white/10"
                  >
                    <QrCode size={16} aria-hidden />
                    QR studio
                  </button>
                  <Link
                    to="/user/links-generated"
                    className="inline-flex min-h-11 items-center gap-tight rounded-full bg-white/5 px-cozy font-bold text-[var(--uw-lime)] hover:bg-white/10"
                  >
                    View all links
                  </Link>
                </div>
              </div>
              <div className="flex-shrink-0">
                <div className="bg-white p-snug rounded-3xl text-center">
                  <div className="w-32 h-32 mx-auto flex items-center justify-center">
                    <QRCodeSVG
                      id="user-pinalink-qr"
                      value={result.shortUrl}
                      size={128}
                      level="M"
                      includeMargin
                      title={`QR for ${result.shortUrl}`}
                    />
                  </div>
                  <button
                    type="button"
                    onClick={handleDownloadQr}
                    className="mt-tight font-label-sm text-label-sm text-black font-bold inline-flex items-center justify-center gap-tight mx-auto min-h-11"
                  >
                    <Download size={16} aria-hidden />
                    SVG QR
                  </button>
                </div>
              </div>
            </div>
          ) : null}
        </form>

        <div className="lg:col-span-5 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-gutter">
          <div className="rounded-[1.75rem] bg-[var(--uw-card)] p-cozy border border-white/5 flex flex-col">
            <div className="flex items-start justify-between">
              <p className="font-label-sm text-label-sm uppercase tracking-wide text-[var(--uw-muted)]">
                Clicks
              </p>
              <span className="text-[var(--uw-muted)]" aria-hidden>
                ···
              </span>
            </div>
            <div className="mt-cozy flex items-end gap-roomy">
              <div>
                <p className="text-3xl font-bold text-[var(--uw-text)] leading-none">
                  {totalClicks}
                </p>
                <p className="mt-tight inline-flex items-center gap-1 text-[var(--uw-lime)] font-bold text-label-sm">
                  <ArrowUpRight size={14} aria-hidden />
                  Total
                </p>
              </div>
              <div>
                <p className="text-3xl font-bold text-[var(--uw-text)] leading-none">
                  {avgClicks}
                </p>
                <p className="mt-tight inline-flex items-center gap-1 text-[var(--uw-orange)] font-bold text-label-sm">
                  <ArrowDownRight size={14} aria-hidden />
                  Avg
                </p>
              </div>
            </div>
            <div className="mt-auto pt-cozy">
              <SparkLine points={clickSpark} stroke="var(--uw-lime)" />
            </div>
          </div>

          <div className="rounded-[1.75rem] bg-[var(--uw-card)] p-cozy border border-white/5">
            <div className="flex items-start justify-between mb-cozy">
              <p className="font-label-sm text-label-sm uppercase tracking-wide text-[var(--uw-muted)]">
                Certificates
              </p>
              <Link
                to="/user/verified-certificate"
                className="text-label-sm font-bold text-[var(--uw-lime)] hover:underline"
              >
                Open
              </Link>
            </div>
            <div className="flex items-end gap-roomy mb-cozy">
              <div>
                <p className="text-3xl font-bold text-[var(--uw-text)] leading-none">
                  {certCount}
                </p>
                <p className="mt-tight inline-flex items-center gap-1 text-[var(--uw-lime)] font-bold text-label-sm">
                  <BadgeCheck size={14} aria-hidden />
                  Issued
                </p>
              </div>
              <div>
                <p className="text-3xl font-bold text-[var(--uw-text)] leading-none">
                  {certScans}
                </p>
                <p className="mt-tight inline-flex items-center gap-1 text-[var(--uw-cyan)] font-bold text-label-sm">
                  <ShieldCheck size={14} aria-hidden />
                  Scans
                </p>
              </div>
            </div>
            <p className="text-label-sm text-[var(--uw-muted)]">
              Bulk Excel, QR verify links, org branding, revoke.
            </p>
          </div>
        </div>

        <div className="lg:col-span-5 rounded-[1.75rem] bg-[var(--uw-card)] p-cozy border border-white/5">
          <div className="flex items-start justify-between mb-cozy">
            <p className="font-label-sm text-label-sm uppercase tracking-wide text-[var(--uw-muted)]">
              Top clicks
            </p>
            <span className="text-[var(--uw-muted)]" aria-hidden>
              ···
            </span>
          </div>
          <CapsuleStack
            values={capsuleValues}
            colors={[
              "var(--uw-cyan)",
              "var(--uw-navy)",
              "#ffffff",
              "var(--uw-cyan)",
              "var(--uw-navy)",
              "#ffffff",
            ]}
          />
        </div>

        <div className="lg:col-span-7 rounded-[1.75rem] bg-[var(--uw-card)] p-cozy border border-white/5">
          <div className="flex items-start justify-between mb-cozy">
            <p className="font-label-sm text-label-sm uppercase tracking-wide text-[var(--uw-muted)]">
              Recent links
            </p>
            <Link
              to="/user/links-generated"
              className="text-label-sm font-bold text-[var(--uw-lime)] hover:underline"
            >
              Open studio
            </Link>
          </div>

          {recentLinks.length === 0 ? (
            <p className="text-body-md text-[var(--uw-muted)] py-roomy text-center">
              No links yet — shorten one above.
            </p>
          ) : (
            <ul className="space-y-snug">
              {recentLinks.map((row, index) => {
                const shortUrl = buildShortUrl(row.code);
                const host = shortUrl.replace(/^https?:\/\//, "");
                const barColor =
                  index % 3 === 0
                    ? "uw-gradient"
                    : index % 3 === 1
                      ? "bg-[var(--uw-navy)] text-white"
                      : "bg-white text-black";
                const width = `${Math.max(42, Math.min(100, 40 + row.click_count * 4))}%`;
                const busy = rowBusyId === row.id;
                return (
                  <li key={row.id} className="space-y-tight">
                    <div className="flex items-center gap-snug">
                      <span className="w-10 shrink-0 font-label-sm text-label-sm text-[var(--uw-muted)]">
                        {new Date(row.created_at).toLocaleDateString(undefined, {
                          day: "2-digit",
                          month: "2-digit",
                        })}
                      </span>
                      <div
                        className={`flex min-h-11 items-center justify-between gap-snug rounded-full px-cozy ${barColor} transition-transform hover:scale-[1.01]`}
                        style={{ width }}
                      >
                        <span className="inline-flex items-center gap-tight min-w-0">
                          <span className="inline-flex size-7 shrink-0 items-center justify-center rounded-full bg-black/10">
                            <Link2 size={14} aria-hidden />
                          </span>
                          <span className="font-bold text-label-sm truncate">
                            {row.title || host}
                          </span>
                        </span>
                        <span className="inline-flex items-center gap-1 shrink-0 font-bold text-label-sm">
                          <MousePointerClick size={14} aria-hidden />
                          {row.click_count}
                        </span>
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-tight pl-12">
                      <button
                        type="button"
                        disabled={busy}
                        onClick={() => void handleCopy(shortUrl)}
                        className="inline-flex min-h-11 items-center gap-1 rounded-full bg-white/5 px-snug text-label-sm font-bold text-[var(--uw-lime)] hover:bg-white/10 disabled:opacity-60"
                      >
                        <Copy size={14} aria-hidden />
                        Copy
                      </button>
                      <a
                        href={shortUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex min-h-11 items-center gap-1 rounded-full bg-white/5 px-snug text-label-sm font-bold text-[var(--uw-text)] hover:bg-white/10"
                      >
                        <ExternalLink size={14} aria-hidden />
                        Open
                      </a>
                      <button
                        type="button"
                        disabled={busy}
                        onClick={() => void togglePause(row)}
                        className="inline-flex min-h-11 items-center gap-1 rounded-full bg-white/5 px-snug text-label-sm font-bold text-[var(--uw-text)] hover:bg-white/10 disabled:opacity-60"
                      >
                        {row.is_active ? (
                          <PauseCircle size={14} aria-hidden />
                        ) : (
                          <PlayCircle size={14} aria-hidden />
                        )}
                        {row.is_active ? "Pause" : "Resume"}
                      </button>
                      <button
                        type="button"
                        disabled={busy}
                        onClick={() => void toggleFavorite(row)}
                        className="inline-flex min-h-11 items-center gap-1 rounded-full bg-white/5 px-snug text-label-sm font-bold text-[var(--uw-text)] hover:bg-white/10 disabled:opacity-60"
                        aria-label={
                          row.is_favorite ? "Remove favorite" : "Add favorite"
                        }
                      >
                        <Star
                          size={14}
                          fill={row.is_favorite ? "currentColor" : "none"}
                          className={
                            row.is_favorite ? "text-[var(--uw-lime)]" : undefined
                          }
                          aria-hidden
                        />
                      </button>
                      <Link
                        to="/user/links-generated"
                        state={{ selectId: row.id, tab: "edit" as const }}
                        className="inline-flex min-h-11 items-center gap-1 rounded-full bg-white/5 px-snug text-label-sm font-bold text-[var(--uw-text)] hover:bg-white/10"
                      >
                        <Settings2 size={14} aria-hidden />
                        Edit
                      </Link>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}

          <div className="mt-cozy flex flex-wrap gap-cozy pt-snug border-t border-white/5">
            <span className="inline-flex items-center gap-tight text-label-sm text-[var(--uw-muted)]">
              <span className="size-2 rounded-full bg-[var(--uw-cyan)]" aria-hidden />
              Cyan
            </span>
            <span className="inline-flex items-center gap-tight text-label-sm text-[var(--uw-muted)]">
              <span className="size-2 rounded-full bg-[var(--uw-navy)]" aria-hidden />
              Navy
            </span>
            <span className="inline-flex items-center gap-tight text-label-sm text-[var(--uw-muted)]">
              <span className="size-2 rounded-full bg-white" aria-hidden />
              New
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserDashboard;
