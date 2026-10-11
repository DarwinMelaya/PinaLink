import { useEffect, useState, type ReactNode } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Menu, X } from "lucide-react";
import UserSidebar from "./UserSidebar";

type UserLayoutProps = {
  children: ReactNode;
};

const UserLayout = ({ children }: UserLayoutProps) => {
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);

  // Ctrl/Cmd+K from any user page jumps to the create form on the dashboard.
  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if (!(event.metaKey || event.ctrlKey) || event.key.toLowerCase() !== "k") return;
      event.preventDefault();
      setMobileOpen(false);
      navigate("/user/dashboard#create");
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [navigate]);

  useEffect(() => {
    if (!mobileOpen) return;
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") setMobileOpen(false);
    }
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", onKey);
    };
  }, [mobileOpen]);

  return (
    <div className="user-workspace flex min-h-screen font-body-md">
      <div className="sticky top-0 z-30 hidden h-screen w-60 shrink-0 md:block">
        <UserSidebar />
      </div>

      {mobileOpen ? (
        <div className="fixed inset-0 z-50 md:hidden" role="dialog" aria-modal="true" aria-label="Menu">
          <button
            type="button"
            className="absolute inset-0 bg-black/60"
            aria-label="Close menu"
            onClick={() => setMobileOpen(false)}
          />
          <div className="absolute inset-y-0 left-0 w-[min(85vw,18rem)] shadow-xl">
            <UserSidebar onNavigate={() => setMobileOpen(false)} />
            <button
              type="button"
              onClick={() => setMobileOpen(false)}
              className="absolute right-2 top-4 inline-flex size-11 items-center justify-center rounded-xl text-[var(--uw-muted)] hover:bg-[var(--uw-card)] hover:text-[var(--uw-text)]"
              aria-label="Close menu"
            >
              <X size={20} aria-hidden />
            </button>
          </div>
        </div>
      ) : null}

      <div className="flex min-h-screen min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-40 flex items-center gap-2 border-b border-white/[0.06] bg-[var(--uw-elevated)] px-3 py-2 md:hidden">
          <button
            type="button"
            className="inline-flex size-11 items-center justify-center rounded-xl text-[var(--uw-text)] hover:bg-[var(--uw-card)]"
            aria-label="Open menu"
            aria-expanded={mobileOpen}
            onClick={() => setMobileOpen(true)}
          >
            <Menu size={22} aria-hidden />
          </button>
          <Link to="/user/dashboard" className="inline-flex min-h-11 items-center">
            <img src="/img/pinalink_logo.png" alt="Pinalink home" className="h-7 w-auto" />
          </Link>
        </header>

        <main className="flex-1 p-gutter md:p-roomy">
          {children}
        </main>
      </div>
    </div>
  );
};

export default UserLayout;
