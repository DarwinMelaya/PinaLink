import { useEffect, useMemo, useState, type FormEvent } from "react";
import { Link, NavLink } from "react-router-dom";
import { QRCodeSVG } from "qrcode.react";
import {
  ArrowDownRight,
  ArrowUpRight,
  BadgeCheck,
  Copy,
  Check,
  Download,
  LayoutDashboard,
  Link2,
  MousePointerClick,
  QrCode,
  ShieldCheck,
} from "lucide-react";
import { getSession } from "../../utils/authApi";
import { buildShortUrl, normalizeUrl } from "../../utils/shortLink";
import {
  createShortLink,
  listShortLinksByUser,
  type ShortLinkRow,
} from "../../utils/shortLinkApi";
import { isLinkLive } from "../../utils/qrStyle";
import { listCertificatesByUser } from "../../utils/certificateApi";

type ShortenStatus = "idle" | "loading" | "success" | "error";

type ShortenResult = {
  shortUrl: string;
  code: string;
  originalUrl: string;
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

const UserDashboard = () => {
  const [urlInput, setUrlInput] = useState("");
  const [status, setStatus] = useState<ShortenStatus>("idle");
  const [errorMessage, setErrorMessage] = useState("");
  const [result, setResult] = useState<ShortenResult | null>(null);
  const [copied, setCopied] = useState(false);
  const [links, setLinks] = useState<ShortLinkRow[]>([]);
  const [certCount, setCertCount] = useState(0);
  const [certScans, setCertScans] = useState(0);

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

  useEffect(() => {
    if (!profile) {
      setLinks([]);
      setCertCount(0);
      setCertScans(0);
      return;
    }
    let cancelled = false;
    void listShortLinksByUser(profile.id)
      .then((rows) => {
        if (!cancelled) setLinks(rows);
      })
      .catch(() => {
        if (!cancelled) setLinks([]);
      });
    void listCertificatesByUser(profile.id)
      .then((rows) => {
        if (cancelled) return;
        setCertCount(rows.length);
        setCertScans(
          rows.reduce((sum, row) => sum + (row.verify_count ?? 0), 0),
        );
      })
      .catch(() => {
        if (cancelled) return;
        setCertCount(0);
        setCertScans(0);
      });
    return () => {
      cancelled = true;
    };
    // Refetch after successful shorten so stats / recent list stay fresh.
  }, [profile?.id, status === "success" ? result?.code : null]);

  const totalClicks = useMemo(
    () => links.reduce((sum, row) => sum + (row.click_count ?? 0), 0),
    [links],
  );
  const liveCount = useMemo(
    () =>
      links.filter((row) => isLinkLive(row.is_active, row.expires_at)).length,
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

  async function handleShorten(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setCopied(false);
    setErrorMessage("");

    const current = getSession();
    if (!current) {
      setStatus("error");
      setErrorMessage("Session expired. Please log in again.");
      setResult(null);
      return;
    }

    const normalized = normalizeUrl(urlInput);
    if (!normalized) {
      setStatus("error");
      setErrorMessage("Enter a valid http(s) URL.");
      setResult(null);
      return;
    }

    setStatus("loading");
    try {
      const row = await createShortLink(normalized, current.id);
      setResult({
        shortUrl: buildShortUrl(row.code),
        code: row.code,
        originalUrl: row.original_url,
      });
      setUrlInput("");
      setStatus("success");
    } catch (err) {
      setStatus("error");
      setResult(null);
      setErrorMessage(err instanceof Error ? err.message : "Shorten failed.");
    }
  }

  async function handleCopy() {
    if (!result) return;
    try {
      await navigator.clipboard.writeText(result.shortUrl);
      setCopied(true);
    } catch {
      setErrorMessage("Copy failed. Select the link and copy manually.");
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
        <h1 className="text-[clamp(28px,5vw,42px)] font-bold tracking-tight uppercase leading-none uw-gradient-text">
          Dashboard
        </h1>
        <div className="flex flex-wrap gap-tight">
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

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-gutter uw-rise-delay-2">
        <form
          onSubmit={handleShorten}
          className="lg:col-span-7 rounded-[1.75rem] bg-[var(--uw-card)] p-cozy md:p-roomy border border-white/5"
        >
          <div className="flex items-start justify-between gap-snug mb-cozy">
            <div>
              <p className="font-label-sm text-label-sm uppercase tracking-wide text-[var(--uw-muted)]">
                Shorten
              </p>
              <h2 className="mt-tight text-headline-md font-headline-md text-[var(--uw-text)]">
                Paste long URL
              </h2>
            </div>
            <span className="text-[var(--uw-muted)] text-xl leading-none" aria-hidden>
              ···
            </span>
          </div>

          <label className="sr-only" htmlFor="user-url-input">
            Paste your long URL
          </label>
          <div className="flex flex-col sm:flex-row gap-tight sm:gap-0 sm:rounded-full sm:bg-[var(--uw-elevated)] sm:p-1.5 sm:ring-1 sm:ring-white/5 focus-within:sm:ring-[var(--uw-lime)]/40 transition-all">
            <input
              className="w-full min-h-12 px-cozy bg-[var(--uw-elevated)] sm:bg-transparent rounded-2xl sm:rounded-full border border-white/5 sm:border-0 text-body-md text-[var(--uw-text)] placeholder:text-[var(--uw-muted)] outline-none"
              id="user-url-input"
              placeholder="https://example.com/your/long/path"
              type="url"
              value={urlInput}
              onChange={(e) => setUrlInput(e.target.value)}
              autoComplete="url"
              required
            />
            <button
              type="submit"
              disabled={status === "loading"}
              className="shrink-0 min-h-12 uw-gradient px-roomy rounded-full font-bold hover:brightness-110 active:scale-[0.98] transition-all disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {status === "loading" ? "Creating..." : "Shorten"}
            </button>
          </div>

          {status === "error" && errorMessage ? (
            <p className="mt-cozy text-[#ff6b6b] text-body-md" role="alert">
              {errorMessage}
            </p>
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
                <Link
                  to="/user/links-generated"
                  className="inline-flex min-h-11 items-center text-[var(--uw-lime)] font-bold hover:underline"
                >
                  View all your links
                </Link>
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
                return (
                  <li key={row.id} className="flex items-center gap-snug">
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
