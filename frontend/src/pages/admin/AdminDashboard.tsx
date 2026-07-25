import { Link, NavLink } from "react-router-dom";
import {
  Link2,
  MousePointerClick,
  Users,
  TrendingUp,
  LayoutDashboard,
  LineChart,
  Settings,
} from "lucide-react";
import { getSession } from "../../utils/authApi";

const STATS = [
  { label: "Total links", value: "—", icon: Link2, accent: "text-[var(--uw-cyan)]" },
  {
    label: "Clicks today",
    value: "—",
    icon: MousePointerClick,
    accent: "text-[var(--uw-cyan)]",
  },
  { label: "Active users", value: "—", icon: Users, accent: "text-white" },
  {
    label: "CTR (7d)",
    value: "—",
    icon: TrendingUp,
    accent: "text-[var(--uw-orange)]",
  },
] as const;

const AdminDashboard = () => {
  const profile = getSession();
  const displayName = profile?.name ?? "Admin";
  const handle = profile?.email
    ? `@${profile.email.split("@")[0]}`
    : "@admin";
  const initials = displayName
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <div className="mx-auto max-w-6xl space-y-roomy">
      <div className="flex flex-col gap-cozy lg:flex-row lg:items-center lg:justify-between uw-rise">
        <div className="flex flex-wrap items-center gap-tight">
          <NavLink
            to="/admin/dashboard"
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
            to="/admin/user"
            className={({ isActive }) =>
              [
                "inline-flex min-h-11 items-center gap-tight rounded-full px-cozy text-body-md font-bold transition-colors",
                isActive
                  ? "uw-gradient"
                  : "bg-[var(--uw-card)] text-[var(--uw-muted)] hover:text-[var(--uw-text)]",
              ].join(" ")
            }
          >
            <Users size={16} aria-hidden />
            Users
          </NavLink>
          <NavLink
            to="/admin/analytics"
            className={({ isActive }) =>
              [
                "inline-flex min-h-11 items-center gap-tight rounded-full px-cozy text-body-md font-bold transition-colors",
                isActive
                  ? "uw-gradient"
                  : "bg-[var(--uw-card)] text-[var(--uw-muted)] hover:text-[var(--uw-text)]",
              ].join(" ")
            }
          >
            <LineChart size={16} aria-hidden />
            Analytics
          </NavLink>
          <NavLink
            to="/admin/settings"
            className={({ isActive }) =>
              [
                "inline-flex min-h-11 items-center gap-tight rounded-full px-cozy text-body-md font-bold transition-colors",
                isActive
                  ? "uw-gradient"
                  : "bg-[var(--uw-card)] text-[var(--uw-muted)] hover:text-[var(--uw-text)]",
              ].join(" ")
            }
          >
            <Settings size={16} aria-hidden />
            Settings
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
            className="relative flex size-12 shrink-0 items-center justify-center rounded-full bg-[var(--uw-card)] text-[var(--uw-cyan)] font-bold ring-2 ring-white/10"
            aria-hidden
          >
            {initials || "A"}
          </div>
        </div>
      </div>

      <div className="uw-rise-delay-1">
        <h1 className="text-[clamp(28px,5vw,42px)] font-bold tracking-tight uppercase leading-none uw-gradient-text">
          Dashboard
        </h1>
        <p className="mt-snug text-body-md text-[var(--uw-muted)] max-w-2xl">
          Overview of link performance across your Pinalink workspace.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-gutter uw-rise-delay-2">
        {STATS.map((stat) => {
          const Icon = stat.icon;
          return (
            <div
              key={stat.label}
              className="rounded-[1.75rem] border border-white/5 bg-[var(--uw-card)] p-cozy"
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

      <div className="rounded-[1.75rem] border border-white/5 bg-[var(--uw-card)] p-roomy">
        <h2 className="font-headline-md text-headline-md text-[var(--uw-text)] mb-tight">
          Quick actions
        </h2>
        <p className="text-body-md text-[var(--uw-muted)] mb-cozy">
          Jump into common admin tasks.
        </p>
        <div className="flex flex-col sm:flex-row gap-snug">
          <Link
            to="/admin/user"
            className="inline-flex min-h-11 items-center justify-center rounded-full uw-gradient px-cozy font-bold hover:brightness-110 transition-all"
          >
            Manage Users
          </Link>
          <Link
            to="/admin/analytics"
            className="inline-flex min-h-11 items-center justify-center rounded-full border border-white/10 bg-white/5 px-cozy text-[var(--uw-text)] font-bold hover:bg-white/10 transition-colors"
          >
            View Analytics
          </Link>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
