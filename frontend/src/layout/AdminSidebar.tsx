import { NavLink, Link, useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  Users,
  LineChart,
  Settings,
  LogOut,
  Plus,
} from "lucide-react";
import { logout } from "../utils/authApi";

const NAV_ITEMS = [
  {
    to: "/admin/dashboard",
    label: "Dashboard",
    icon: LayoutDashboard,
    end: true,
  },
  { to: "/admin/user", label: "Users", icon: Users, end: false },
  { to: "/admin/analytics", label: "Analytics", icon: LineChart, end: false },
  { to: "/admin/settings", label: "Settings", icon: Settings, end: false },
] as const;

type AdminSidebarProps = {
  onNavigate?: () => void;
};

const AdminSidebar = ({ onNavigate }: AdminSidebarProps) => {
  const navigate = useNavigate();

  async function handleLogout() {
    await logout();
    navigate("/login", { replace: true });
  }

  return (
    <aside className="flex h-full min-h-0 w-full flex-col items-center bg-[var(--uw-elevated)] text-[var(--uw-text)] font-body-md py-cozy px-tight border-r border-white/5">
      <Link
        to="/admin/dashboard"
        onClick={onNavigate}
        className="flex size-12 shrink-0 items-center justify-center overflow-hidden rounded-full bg-black ring-1 ring-[var(--uw-cyan)]/40 hover:ring-[var(--uw-cyan)] transition-all uw-pop"
        aria-label="Pinalink admin home"
      >
        <img
          src="/img/pinalink_logo.png"
          alt=""
          className="h-10 w-10 object-cover object-left scale-[1.85]"
          aria-hidden
        />
      </Link>

      <nav
        className="mt-roomy flex flex-1 flex-col items-center gap-snug"
        aria-label="Admin"
      >
        <ul className="flex flex-col items-center gap-snug">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            return (
              <li key={item.to}>
                <NavLink
                  to={item.to}
                  end={item.end}
                  onClick={onNavigate}
                  title={item.label}
                  aria-label={item.label}
                  className={({ isActive }) =>
                    [
                      "relative flex size-12 items-center justify-center rounded-2xl transition-all",
                      isActive
                        ? "uw-gradient text-[var(--uw-on-accent)] shadow-[0_0_24px_rgba(0,212,197,0.35)]"
                        : "bg-[var(--uw-card)] text-[var(--uw-muted)] hover:text-[var(--uw-text)] hover:bg-[var(--uw-card-hover)]",
                    ].join(" ")
                  }
                >
                  <Icon size={20} aria-hidden />
                </NavLink>
              </li>
            );
          })}
        </ul>

        <div className="mt-auto flex flex-col items-center gap-snug pb-tight">
          <Link
            to="/admin/user"
            onClick={onNavigate}
            title="Manage users"
            aria-label="Manage users"
            className="flex size-12 items-center justify-center rounded-full uw-gradient font-bold hover:brightness-110 active:scale-95 transition-all shadow-[0_0_20px_rgba(0,212,197,0.3)]"
          >
            <Plus size={22} aria-hidden />
          </Link>

          <button
            type="button"
            title="Logout"
            aria-label="Logout"
            onClick={() => {
              onNavigate?.();
              void handleLogout();
            }}
            className="flex size-12 items-center justify-center rounded-2xl bg-[var(--uw-card)] text-[var(--uw-muted)] hover:text-[#ff6b6b] hover:bg-[var(--uw-card-hover)] transition-colors"
          >
            <LogOut size={18} aria-hidden />
          </button>
        </div>
      </nav>
    </aside>
  );
};

export default AdminSidebar;
