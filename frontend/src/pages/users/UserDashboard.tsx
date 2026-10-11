import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { RefreshCw } from "lucide-react";
import { getSession } from "../../utils/authApi";
import { listShortLinksByUser, type ShortLinkRow } from "../../utils/shortLinkApi";
import { isExpiringSoon, isLinkExpired, isLinkLive } from "../../utils/qrStyle";
import { listCertificatesByUser } from "../../utils/certificateApi";
import OverviewCard, { type DashboardStats } from "./dashboard/OverviewCard";
import RecentLinks from "./dashboard/RecentLinks";
import ShortenForm from "./dashboard/ShortenForm";
import TopLinks from "./dashboard/TopLinks";
import { BTN_ICON } from "./links/linkUi";

const UserDashboard = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const profile = getSession();
  const userId = profile?.id ?? null;
  const firstName = profile?.name?.trim().split(/\s+/)[0] ?? "";

  const [links, setLinks] = useState<ShortLinkRow[]>([]);
  const [certCount, setCertCount] = useState(0);
  const [certScans, setCertScans] = useState(0);
  const [loading, setLoading] = useState(userId !== null);
  const [refreshing, setRefreshing] = useState(false);
  const [loadError, setLoadError] = useState("");
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    if (!userId) return;
    let cancelled = false;

    async function fetchDashboard(ownerId: string) {
      try {
        const [linkRows, certRows] = await Promise.all([
          listShortLinksByUser(ownerId),
          listCertificatesByUser(ownerId),
        ]);
        if (cancelled) return;
        setLinks(linkRows);
        setCertCount(certRows.length);
        setCertScans(certRows.reduce((sum, row) => sum + (row.verify_count ?? 0), 0));
        setLoadError("");
      } catch (err) {
        if (cancelled) return;
        setLoadError(err instanceof Error ? err.message : "Could not load your dashboard.");
      } finally {
        if (!cancelled) {
          setLoading(false);
          setRefreshing(false);
        }
      }
    }

    void fetchDashboard(userId);
    return () => {
      cancelled = true;
    };
  }, [userId, reloadKey]);

  function handleRefresh() {
    setRefreshing(true);
    setReloadKey((key) => key + 1);
  }

  // Sidebar "New link" and Ctrl/Cmd+K navigate here with #create. `key` changes on
  // every navigation, so repeat clicks refocus even when already on this page.
  useEffect(() => {
    if (location.hash !== "#create") return;
    const el = document.getElementById("user-url-input");
    if (!(el instanceof HTMLTextAreaElement)) return;
    el.focus();
    el.scrollIntoView({ behavior: "smooth", block: "center" });
  }, [location.hash, location.key]);

  const stats = useMemo<DashboardStats>(
    () => ({
      links: links.length,
      live: links.filter((row) => isLinkLive(row.is_active, row.expires_at)).length,
      clicks: links.reduce((sum, row) => sum + (row.click_count ?? 0), 0),
      paused: links.filter((row) => !row.is_active).length,
      expiringSoon: links.filter(
        (row) =>
          row.is_active && !isLinkExpired(row.expires_at) && isExpiringSoon(row.expires_at),
      ).length,
      certificates: certCount,
      certificateScans: certScans,
    }),
    [links, certCount, certScans],
  );

  function openStudio(id: string, tab: "edit" | "qr") {
    navigate("/user/links-generated", { state: { selectId: id, tab } });
  }

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <header className="flex items-end justify-between gap-4">
        <div>
          <h1 className="text-[clamp(24px,4vw,32px)] font-semibold tracking-tight text-[var(--uw-text)]">
            {firstName ? `Hi, ${firstName}` : "Dashboard"}
          </h1>
          <p className="mt-1 text-[15px] text-[var(--uw-muted)]">
            Shorten a link, then track how often it gets opened.
          </p>
        </div>
        <button
          type="button"
          onClick={handleRefresh}
          disabled={refreshing || loading}
          className={BTN_ICON}
          aria-label="Refresh dashboard"
          title="Refresh"
        >
          <RefreshCw
            size={18}
            className={refreshing ? "animate-spin motion-reduce:animate-none" : undefined}
            aria-hidden
          />
        </button>
      </header>

      {loadError ? (
        <p
          className="rounded-xl border border-[#ff6b6b]/25 bg-[#ff6b6b]/10 px-4 py-3 text-sm text-[#ff9b9b]"
          role="alert"
        >
          {loadError}
        </p>
      ) : null}

      <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-12">
        <div className="lg:col-span-7">
          <ShortenForm
            onCreated={(rows) => setLinks((prev) => [...rows, ...prev])}
            onOpenStudio={openStudio}
          />
        </div>
        <div className="lg:col-span-5">
          <OverviewCard stats={stats} loading={loading} />
        </div>
        <div className="lg:col-span-7">
          <RecentLinks links={links} loading={loading} onOpenStudio={openStudio} />
        </div>
        <div className="lg:col-span-5">
          <TopLinks links={links} />
        </div>
      </div>
    </div>
  );
};

export default UserDashboard;
