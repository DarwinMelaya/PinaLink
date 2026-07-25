import { useState, type ReactNode } from "react";
import { Menu, X } from "lucide-react";
import UserSidebar from "./UserSidebar";

type UserLayoutProps = {
  children: ReactNode;
  title?: string;
};

const UserLayout = ({ children, title }: UserLayoutProps) => {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="user-workspace min-h-screen font-body-md flex">
      <div className="hidden md:flex md:w-[88px] shrink-0 h-screen sticky top-0">
        <UserSidebar />
      </div>

      {mobileOpen ? (
        <div className="fixed inset-0 z-50 md:hidden">
          <button
            type="button"
            className="absolute inset-0 bg-black/60"
            aria-label="Close sidebar"
            onClick={() => setMobileOpen(false)}
          />
          <div className="absolute inset-y-0 left-0 w-[min(100%,5.5rem)] bg-[var(--uw-elevated)] shadow-xl border-r border-white/5">
            <UserSidebar onNavigate={() => setMobileOpen(false)} />
          </div>
        </div>
      ) : null}

      <div className="flex-1 min-w-0 flex flex-col min-h-screen">
        <header className="md:hidden sticky top-0 z-40 flex items-center gap-snug border-b border-white/5 bg-[var(--uw-elevated)] px-gutter py-tight">
          <button
            type="button"
            className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-2xl text-[var(--uw-text)] hover:bg-white/5"
            aria-label="Open sidebar"
            onClick={() => setMobileOpen(true)}
          >
            {mobileOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
          <p className="font-headline-md text-headline-md uw-gradient-text truncate">
            {title ?? "Pinalink"}
          </p>
        </header>

        <main className="flex-1 p-gutter md:p-roomy md:pl-cozy">{children}</main>
      </div>
    </div>
  );
};

export default UserLayout;
