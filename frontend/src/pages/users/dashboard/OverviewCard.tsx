import { Link } from "react-router-dom";
import { AlertCircle } from "lucide-react";

export type DashboardStats = {
  links: number;
  live: number;
  clicks: number;
  paused: number;
  expiringSoon: number;
  certificates: number;
  certificateScans: number;
};

type OverviewCardProps = {
  stats: DashboardStats;
  loading: boolean;
};

type StatProps = {
  label: string;
  value: number;
  loading: boolean;
};

const Stat = ({ label, value, loading }: StatProps) => (
  <div>
    <dt className="text-sm text-[var(--uw-muted)]">{label}</dt>
    <dd className="mt-1 text-2xl font-semibold tabular-nums text-[var(--uw-text)]">
      {loading ? <span className="text-[var(--uw-muted)]">–</span> : value.toLocaleString()}
    </dd>
  </div>
);

const OverviewCard = ({ stats, loading }: OverviewCardProps) => {
  const attention = [
    stats.paused > 0 ? `${stats.paused} paused link${stats.paused === 1 ? "" : "s"}` : null,
    stats.expiringSoon > 0
      ? `${stats.expiringSoon} link${stats.expiringSoon === 1 ? "" : "s"} expiring within 7 days`
      : null,
  ].filter((item): item is string => item !== null);

  return (
    <section className="rounded-2xl border border-white/[0.06] bg-[var(--uw-card)] p-5 sm:p-6">
      <h2 className="text-lg font-semibold text-[var(--uw-text)]">Overview</h2>

      <h3 className="mt-5 text-xs font-medium text-[var(--uw-muted)]">Short links</h3>
      <dl className="mt-2 grid grid-cols-3 gap-4">
        <Stat label="Links" value={stats.links} loading={loading} />
        <Stat label="Live" value={stats.live} loading={loading} />
        <Stat label="Clicks" value={stats.clicks} loading={loading} />
      </dl>

      <div className="mt-5 flex items-end justify-between gap-4 border-t border-white/[0.06] pt-5">
        <div className="min-w-0">
          <h3 className="text-xs font-medium text-[var(--uw-muted)]">Certificates</h3>
          <dl className="mt-2 grid grid-cols-2 gap-x-8 gap-y-4">
            <Stat label="Issued" value={stats.certificates} loading={loading} />
            <Stat label="Verify scans" value={stats.certificateScans} loading={loading} />
          </dl>
        </div>
        <Link
          to="/user/verified-certificate"
          className="inline-flex min-h-11 shrink-0 items-center text-sm font-medium text-[var(--uw-cyan)] hover:underline"
        >
          Open
        </Link>
      </div>

      {!loading && attention.length > 0 ? (
        <Link
          to="/user/links-generated"
          className="mt-5 flex items-start gap-3 rounded-xl border border-[#f2a65a]/25 bg-[#f2a65a]/10 p-3.5 text-sm text-[#f2c08a] transition-colors hover:bg-[#f2a65a]/15"
        >
          <AlertCircle size={18} className="mt-0.5 shrink-0" aria-hidden />
          <span>
            {attention.join(" · ")}
            <span className="mt-0.5 block font-medium text-[#f2a65a]">Review in My links</span>
          </span>
        </Link>
      ) : null}
    </section>
  );
};

export default OverviewCard;
