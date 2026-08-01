import { useEffect, useState } from "react";
import { NavLink, Link, useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  Link2,
  LogOut,
  Plus,
  BadgeCheck,
  Keyboard,
} from "lucide-react";
import { getSession, logout } from "../utils/authApi";
import { listShortLinksByUser } from "../utils/shortLinkApi";
import { listCertificatesByUser } from "../utils/certificateApi";

const NAV_ITEMS = [
  {
    to: "/user/dashboard",
    label: "Dashboard",
    icon: LayoutDashboard,
    end: true,
    badgeKey: null,
  },
  {
    to: "/user/links-generated",
    label: "My Links",
    icon: Link2,
    end: false,
    badgeKey: "links" as const,
  },
  {
    to: "/user/verified-certificate",
    label: "Certificates",
    icon: BadgeCheck,
    end: false,
    badgeKey: "certs" as const,
  },
] as const;

type UserSidebarProps = {
  onNavigate?: () => void;
  /** Always show labels (mobile drawer). Desktop uses hover expand. */
  expanded?: boolean;
};

function formatBadge(count: number): string {
  if (count <= 0) return "";
  return count > 9 ? "9+" : String(count);
}

const UserSidebar = ({ onNavigate, expanded = false }: UserSidebarProps) => {
  const navigate = useNavigate();
  const session = getSession();
  const [linkCount, setLinkCount] = useState(0);
  const [certCount, setCertCount] = useState(0);
  const [loggingOut, setLoggingOut] = useState(false);

  const displayName = session?.name ?? "User";
  const initials = displayName
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  useEffect(() => {
    if (!session) {
      setLinkCount(0);
      setCertCount(0);
      return;
    }
    let cancelled = false;
    void Promise.all([
      listShortLinksByUser(session.id),
      listCertificatesByUser(session.id),
    ])
      .then(([links, certs]) => {
        if (cancelled) return;
        setLinkCount(links.length);
        setCertCount(certs.length);
      })
      .catch(() => {
        if (cancelled) return;
        setLinkCount(0);
        setCertCount(0);
      });
    return () => {
      cancelled = true;
    };
  }, [session?.id]);

  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if (!(event.metaKey || event.ctrlKey)) return;
      if (event.key.toLowerCase() !== "k") return;
      // Let dashboard page handle focus if already there; always navigate to create
      event.preventDefault();
      onNavigate?.();
      navigate("/user/dashboard#create");
      window.setTimeout(() => {
        const el = document.getElementById("user-url-input");
        if (el instanceof HTMLTextAreaElement) {
          el.focus();
          el.scrollIntoView({ behavior: "smooth", block: "center" });
        }
      }, 50);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [navigate, onNavigate]);

  async function handleLogout() {
    const ok = window.confirm("Log out of Pinalink?");
    if (!ok) return;
    setLoggingOut(true);
    try {
      await logout();
      navigate("/login", { replace: true });
    } finally {
      setLoggingOut(false);
    }
  }

  function badgeFor(key: "links" | "certs" | null): string {
    if (key === "links") return formatBadge(linkCount);
    if (key === "certs") return formatBadge(certCount);
    return "";
  }

  const showLabel = expanded
    ? "inline"
    : "hidden group-hover/sidebar:inline md:group-hover/rail:inline";
  const showBlock = expanded
    ? "block"
    : "hidden group-hover/sidebar:block md:group-hover/rail:block";
  const showFlex = expanded
    ? "flex"
    : "hidden group-hover/sidebar:flex md:group-hover/rail:flex";
  const rowAlign = expanded
    ? "justify-start px-snug"
    : "justify-center group-hover/sidebar:justify-start group-hover/sidebar:px-snug md:group-hover/rail:justify-start md:group-hover/rail:px-snug";
  const hideWhenExpanded = expanded
    ? "hidden"
    : "group-hover/sidebar:hidden md:group-hover/rail:hidden";

  return (
    <aside className="group/sidebar flex h-full min-h-0 w-full flex-col bg-[var(--uw-elevated)] text-[var(--uw-text)] font-body-md py-cozy px-tight border-r border-white/5 transition-[width] duration-200">
      <Link
        to="/user/dashboard"
        onClick={onNavigate}
        className="mx-auto flex size-12 shrink-0 items-center justify-center overflow-hidden rounded-full bg-black ring-1 ring-[var(--uw-cyan)]/40 hover:ring-[var(--uw-cyan)] transition-all uw-pop"
        aria-label="Pinalink home"
      >
        <img
          src="/img/pinalink_logo.png"
          alt=""
          className="h-10 w-10 object-cover object-left scale-[1.85]"
          aria-hidden
        />
      </Link>

      <div
        className={[
          "mt-snug mx-auto flex max-w-full flex-col items-center gap-tight px-1 transition-all duration-200",
          expanded
            ? "opacity-100 max-h-20"
            : "opacity-0 max-h-0 overflow-hidden group-hover/sidebar:opacity-100 group-hover/sidebar:max-h-20 md:group-hover/rail:opacity-100 md:group-hover/rail:max-h-20",
        ].join(" ")}
      >
        <div
          className="flex size-10 items-center justify-center rounded-full bg-[var(--uw-card)] text-[var(--uw-lime)] text-label-sm font-bold ring-1 ring-white/10"
          aria-hidden
        >
          {initials || "U"}
        </div>
        <p
          className={`${showBlock} w-full truncate text-center text-[11px] font-bold text-[var(--uw-muted)]`}
        >
          {displayName}
        </p>
      </div>

      <nav
        className="mt-roomy flex flex-1 flex-col items-stretch gap-snug min-w-0"
        aria-label="User"
      >
        <ul className="flex flex-col items-stretch gap-snug">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const badge = badgeFor(item.badgeKey);
            return (
              <li key={item.to} className="px-0.5">
                <NavLink
                  to={item.to}
                  end={item.end}
                  onClick={onNavigate}
                  title={item.label}
                  aria-label={item.label}
                  className={({ isActive }) =>
                    [
                      "relative flex min-h-12 w-full items-center gap-snug rounded-2xl px-0 transition-all",
                      rowAlign,
                      isActive
                        ? "uw-gradient text-[var(--uw-on-accent)] shadow-[0_0_24px_rgba(0,212,197,0.35)]"
                        : "bg-[var(--uw-card)] text-[var(--uw-muted)] hover:text-[var(--uw-text)] hover:bg-[var(--uw-card-hover)]",
                    ].join(" ")
                  }
                >
                  <span className="relative inline-flex size-12 shrink-0 items-center justify-center">
                    <Icon size={20} aria-hidden />
                    {badge ? (
                      <span className="absolute -top-0.5 -right-0.5 flex min-w-5 h-5 items-center justify-center rounded-full bg-[#ff3b30] px-1 text-[10px] font-bold text-white">
                        {badge}
                      </span>
                    ) : null}
                  </span>
                  <span
                    className={`${showLabel} truncate text-label-sm font-bold pr-snug`}
                  >
                    {item.label}
                  </span>
                </NavLink>
              </li>
            );
          })}
        </ul>

        <div className="mt-auto flex flex-col items-stretch gap-snug pb-tight px-0.5">
          <button
            type="button"
            title="Create short link (Ctrl/Cmd+K)"
            aria-label="Create short link"
            onClick={() => {
              onNavigate?.();
              navigate("/user/dashboard#create");
              window.setTimeout(() => {
                document.getElementById("user-url-input")?.focus();
              }, 50);
            }}
            className={[
              "flex min-h-12 w-full items-center gap-snug rounded-full uw-gradient font-bold hover:brightness-110 active:scale-95 transition-all shadow-[0_0_20px_rgba(0,212,197,0.3)]",
              rowAlign,
            ].join(" ")}
          >
            <span className="inline-flex size-12 shrink-0 items-center justify-center">
              <Plus size={22} aria-hidden />
            </span>
            <span className={`${showLabel} truncate text-label-sm pr-snug`}>
              New link
            </span>
          </button>

          <p
            className={`${showFlex} items-center justify-center gap-1 text-[10px] text-[var(--uw-muted)] px-1`}
            title="Keyboard shortcut"
          >
            <Keyboard size={12} aria-hidden />
            Ctrl/Cmd+K
          </p>

          <div
            className={`mx-auto flex size-12 items-center justify-center rounded-full bg-[var(--uw-card)] text-[var(--uw-lime)] font-bold ring-1 ring-white/10 ${hideWhenExpanded}`}
            title={displayName}
            aria-hidden
          >
            {initials || "U"}
          </div>

          <button
            type="button"
            title="Logout"
            aria-label="Logout"
            disabled={loggingOut}
            onClick={() => {
              void handleLogout();
            }}
            className={[
              "flex min-h-12 w-full items-center gap-snug rounded-2xl bg-[var(--uw-card)] text-[var(--uw-muted)] hover:text-[#ff6b6b] hover:bg-[var(--uw-card-hover)] transition-colors disabled:opacity-60",
              rowAlign,
            ].join(" ")}
          >
            <span className="inline-flex size-12 shrink-0 items-center justify-center">
              <LogOut size={18} aria-hidden />
            </span>
            <span
              className={`${showLabel} truncate text-label-sm font-bold pr-snug`}
            >
              {loggingOut ? "Logging out…" : "Logout"}
            </span>
          </button>
        </div>
      </nav>
    </aside>
  );
};

export default UserSidebar;
