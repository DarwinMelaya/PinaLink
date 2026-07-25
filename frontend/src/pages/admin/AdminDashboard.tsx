import { Link } from "react-router-dom";
import { Link2, MousePointerClick, Users, TrendingUp } from "lucide-react";

const STATS = [
  { label: "Total links", value: "—", icon: Link2 },
  { label: "Clicks today", value: "—", icon: MousePointerClick },
  { label: "Active users", value: "—", icon: Users },
  { label: "CTR (7d)", value: "—", icon: TrendingUp },
] as const;

const AdminDashboard = () => {
  return (
    <div className="space-y-roomy max-w-6xl">
      <div>
        <h1 className="font-headline-md text-headline-md text-on-surface">
          Dashboard
        </h1>
        <p className="mt-tight text-body-md text-on-surface-variant max-w-2xl">
          Overview of link performance across your Pinalink workspace.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-gutter">
        {STATS.map((stat) => {
          const Icon = stat.icon;
          return (
            <div
              key={stat.label}
              className="rounded-xl border border-outline-variant bg-surface-container-lowest p-cozy"
            >
              <div className="flex items-center justify-between gap-snug">
                <p className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wide">
                  {stat.label}
                </p>
                <span className="inline-flex size-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <Icon size={18} aria-hidden />
                </span>
              </div>
              <p className="mt-snug text-display-lg-mobile font-display-lg text-on-surface">
                {stat.value}
              </p>
            </div>
          );
        })}
      </div>

      <div className="rounded-xl border border-outline-variant bg-surface-container-lowest p-roomy">
        <h2 className="font-headline-md text-headline-md text-on-surface mb-tight">
          Quick actions
        </h2>
        <p className="text-body-md text-on-surface-variant mb-cozy">
          Jump into common admin tasks.
        </p>
        <div className="flex flex-col sm:flex-row gap-snug">
          <Link
            to="/home"
            className="inline-flex min-h-11 items-center justify-center rounded-xl bg-primary px-cozy text-on-primary font-bold hover:bg-surface-tint transition-colors"
          >
            Create New Link
          </Link>
          <Link
            to="/admin/user"
            className="inline-flex min-h-11 items-center justify-center rounded-xl border border-outline-variant px-cozy text-on-surface font-bold hover:bg-surface-container-low transition-colors"
          >
            Manage Users
          </Link>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
