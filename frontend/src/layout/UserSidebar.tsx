import { NavLink, Link, useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  Link2,
  LogOut,
  Plus,
} from "lucide-react";
import { getSession, logout } from "../utils/authApi";

const NAV_ITEMS = [
  {
    to: "/user/dashboard",
    label: "Dashboard",
    icon: LayoutDashboard,
    end: true,
  },
  {
    to: "/user/links-generated",
    label: "My Links",
    icon: Link2,
    end: false,
  },
] as const;

type UserSidebarProps = {
  onNavigate?: () => void;
};

const UserSidebar = ({ onNavigate }: UserSidebarProps) => {
  const navigate = useNavigate();
  const profile = getSession();

  async function handleLogout() {
    await logout();
    navigate("/login", { replace: true });
  }

  const displayName = profile?.name ?? "User";
  const displayEmail = profile?.email ?? "";
  const initials = displayName
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <aside className="flex h-full min-h-0 w-full flex-col bg-surface-container-low text-on-surface font-body-md">
      <div className="flex items-center gap-snug px-cozy pt-cozy pb-snug">
        <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-primary text-on-primary shadow-sm">
          <Link2 size={22} aria-hidden />
        </div>
        <div className="min-w-0">
          <p className="font-headline-md text-headline-md text-primary leading-tight truncate">
            Pinalink
          </p>
          <p className="font-label-sm text-label-sm text-on-surface-variant tracking-wide">
            Workspace
          </p>
        </div>
      </div>

      <div className="px-cozy pb-cozy">
        <Link
          to="/user/dashboard"
          onClick={onNavigate}
          className="flex min-h-12 w-full items-center justify-center gap-tight rounded-xl bg-primary text-on-primary font-bold text-body-md shadow-lg shadow-primary/20 hover:bg-surface-tint active:scale-[0.99] transition-all"
        >
          <span className="inline-flex size-6 items-center justify-center rounded-full bg-on-primary/15">
            <Plus size={16} aria-hidden />
          </span>
          Create New Link
        </Link>
      </div>

      <nav className="flex-1 overflow-y-auto px-snug" aria-label="User">
        <ul className="flex flex-col gap-1">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            return (
              <li key={item.to}>
                <NavLink
                  to={item.to}
                  end={item.end}
                  onClick={onNavigate}
                  className={({ isActive }) =>
                    [
                      "relative flex min-h-12 items-center gap-snug rounded-xl px-snug text-body-md font-medium transition-colors",
                      isActive
                        ? "bg-primary/10 text-primary"
                        : "text-on-surface-variant hover:bg-surface-container hover:text-on-surface",
                    ].join(" ")
                  }
                >
                  {({ isActive }) => (
                    <>
                      <Icon
                        size={20}
                        className={isActive ? "text-primary" : "text-outline"}
                        aria-hidden
                      />
                      <span>{item.label}</span>
                      {isActive ? (
                        <span
                          className="absolute inset-y-2 right-0 w-1 rounded-l-full bg-primary"
                          aria-hidden
                        />
                      ) : null}
                    </>
                  )}
                </NavLink>
              </li>
            );
          })}
        </ul>

        <div className="mt-roomy pt-snug border-t border-outline-variant/70">
          <button
            type="button"
            onClick={() => {
              onNavigate?.();
              void handleLogout();
            }}
            className="flex min-h-12 w-full items-center gap-snug rounded-xl px-snug text-body-md font-medium text-error hover:bg-error-container/60 transition-colors"
          >
            <LogOut size={20} aria-hidden />
            Logout
          </button>
        </div>
      </nav>

      <div className="mt-auto border-t border-outline-variant/70 p-cozy">
        <div className="flex items-center gap-snug rounded-xl bg-surface-container-lowest p-snug border border-outline-variant/50">
          <div
            className="flex size-11 shrink-0 items-center justify-center rounded-full bg-primary/15 text-primary font-bold text-label-sm"
            aria-hidden
          >
            {initials || "U"}
          </div>
          <div className="min-w-0">
            <p className="truncate font-bold text-body-md text-on-surface">
              {displayName}
            </p>
            {displayEmail ? (
              <p className="truncate font-label-sm text-label-sm text-on-surface-variant">
                {displayEmail}
              </p>
            ) : null}
          </div>
        </div>
      </div>
    </aside>
  );
};

export default UserSidebar;
