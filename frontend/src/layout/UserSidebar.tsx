import { useEffect, useState } from "react";
import { Link, NavLink, useNavigate } from "react-router-dom";
import { BadgeCheck, LayoutDashboard, Link2, LogOut, Plus, type LucideIcon } from "lucide-react";
import { getSession, logout } from "../utils/authApi";
import { listShortLinksByUser } from "../utils/shortLinkApi";
import { listCertificatesByUser } from "../utils/certificateApi";

type CountKey = "links" | "certs";

type NavItem = {
  to: string;
  label: string;
  icon: LucideIcon;
  end: boolean;
  countKey: CountKey | null;
};

const NAV_ITEMS: NavItem[] = [
  { to: "/user/dashboard", label: "Dashboard", icon: LayoutDashboard, end: true, countKey: null },
  { to: "/user/links-generated", label: "My links", icon: Link2, end: false, countKey: "links" },
  {
    to: "/user/verified-certificate",
    label: "Certificates",
    icon: BadgeCheck,
    end: false,
    countKey: "certs",
  },
];

const FOCUS_RING =
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--uw-cyan)]/50";

const SHORTCUT_LABEL = /Mac|iPhone|iPad/.test(navigator.userAgent) ? "⌘K" : "Ctrl K";

type UserSidebarProps = {
  /** Called after any navigation so the mobile drawer can close. */
  onNavigate?: () => void;
};

const UserSidebar = ({ onNavigate }: UserSidebarProps) => {
  const navigate = useNavigate();
  const session = getSession();
  const userId = session?.id ?? null;
  const [counts, setCounts] = useState<Record<CountKey, number> | null>(null);
  const [loggingOut, setLoggingOut] = useState(false);

  const displayName = session?.name?.trim() || "Account";
  const initials =
    displayName
      .split(/\s+/)
      .map((part) => part[0])
      .join("")
      .slice(0, 2)
      .toUpperCase() || "U";

  useEffect(() => {
    if (!userId) return;
    let cancelled = false;
    Promise.all([listShortLinksByUser(userId), listCertificatesByUser(userId)])
      .then(([links, certs]) => {
        if (!cancelled) setCounts({ links: links.length, certs: certs.length });
      })
      .catch(() => {
        // Counts are a convenience; leave them hidden if loading fails.
        if (!cancelled) setCounts(null);
      });
    return () => {
      cancelled = true;
    };
  }, [userId]);

  async function handleLogout() {
    setLoggingOut(true);
    try {
      await logout();
      navigate("/login", { replace: true });
    } finally {
      setLoggingOut(false);
    }
  }

  return (
    <aside className="flex h-full min-h-0 w-full flex-col border-r border-white/[0.06] bg-[var(--uw-elevated)] font-body-md text-[var(--uw-text)]">
      <div className="px-4 pb-4 pt-5">
        <Link
          to="/user/dashboard"
          onClick={onNavigate}
          className={`inline-flex min-h-11 items-center rounded-lg ${FOCUS_RING}`}
        >
          <img src="/img/pinalink_logo.png" alt="Pinalink home" className="h-8 w-auto" />
        </Link>
      </div>

      <div className="px-3">
        <Link
          to="/user/dashboard#create"
          onClick={onNavigate}
          className={`flex min-h-11 w-full items-center gap-2 rounded-xl bg-[var(--uw-cyan)] px-3.5 text-sm font-semibold text-[var(--uw-on-accent)] transition hover:brightness-110 ${FOCUS_RING}`}
        >
          <Plus size={18} aria-hidden />
          New link
          <kbd className="ml-auto hidden rounded-md bg-black/15 px-1.5 py-0.5 font-sans text-[11px] font-medium md:inline">
            {SHORTCUT_LABEL}
          </kbd>
        </Link>
      </div>

      <nav className="mt-6 flex-1 overflow-y-auto px-3" aria-label="Main">
        <ul className="space-y-1">
          {NAV_ITEMS.map(({ to, label, icon: Icon, end, countKey }) => {
            const count = countKey && counts ? counts[countKey] : null;
            return (
              <li key={to}>
                <NavLink
                  to={to}
                  end={end}
                  onClick={onNavigate}
                  className={({ isActive }) =>
                    [
                      "relative flex min-h-11 items-center gap-3 rounded-xl px-3 text-sm font-medium transition-colors",
                      FOCUS_RING,
                      isActive
                        ? "bg-[var(--uw-card-hover)] text-[var(--uw-text)] before:absolute before:inset-y-2.5 before:left-0 before:w-[3px] before:rounded-full before:bg-[var(--uw-cyan)]"
                        : "text-[var(--uw-muted)] hover:bg-[var(--uw-card)] hover:text-[var(--uw-text)]",
                    ].join(" ")
                  }
                >
                  <Icon size={18} aria-hidden />
                  <span className="flex-1 truncate">{label}</span>
                  {count !== null && count > 0 ? (
                    <span className="text-xs tabular-nums text-[var(--uw-muted)]">
                      <span className="sr-only">(</span>
                      {count}
                      <span className="sr-only">)</span>
                    </span>
                  ) : null}
                </NavLink>
              </li>
            );
          })}
        </ul>
      </nav>

      <div className="flex items-center gap-3 border-t border-white/[0.06] px-3 py-3">
        <span
          className="flex size-9 shrink-0 items-center justify-center rounded-full bg-[var(--uw-card)] text-xs font-semibold text-[var(--uw-text)]"
          aria-hidden
        >
          {initials}
        </span>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium text-[var(--uw-text)]">{displayName}</p>
          {session?.email ? (
            <p className="truncate text-xs text-[var(--uw-muted)]">{session.email}</p>
          ) : null}
        </div>
        <button
          type="button"
          onClick={() => void handleLogout()}
          disabled={loggingOut}
          aria-label={loggingOut ? "Logging out" : "Log out"}
          title="Log out"
          className={`inline-flex size-11 shrink-0 items-center justify-center rounded-xl text-[var(--uw-muted)] transition-colors hover:bg-[#ff6b6b]/10 hover:text-[#ff8a8a] disabled:opacity-60 ${FOCUS_RING}`}
        >
          <LogOut size={18} aria-hidden />
        </button>
      </div>
    </aside>
  );
};

export default UserSidebar;
