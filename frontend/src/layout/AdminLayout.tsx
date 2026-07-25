import { useState, type ReactNode } from "react";
import { Menu, X } from "lucide-react";
import AdminSidebar from "./AdminSidebar";

type AdminLayoutProps = {
  children: ReactNode;
  title?: string;
};

const AdminLayout = ({ children, title }: AdminLayoutProps) => {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="min-h-screen bg-surface text-on-surface font-body-md flex">
      {/* Desktop sidebar */}
      <div className="hidden md:flex md:w-72 lg:w-80 shrink-0 border-r border-outline-variant/60 h-screen sticky top-0">
        <AdminSidebar />
      </div>

      {/* Mobile drawer */}
      {mobileOpen ? (
        <div className="fixed inset-0 z-50 md:hidden">
          <button
            type="button"
            className="absolute inset-0 bg-on-surface/40"
            aria-label="Close sidebar"
            onClick={() => setMobileOpen(false)}
          />
          <div className="absolute inset-y-0 left-0 w-[min(100%,20rem)] bg-surface-container-low shadow-xl">
            <AdminSidebar onNavigate={() => setMobileOpen(false)} />
          </div>
        </div>
      ) : null}

      <div className="flex-1 min-w-0 flex flex-col min-h-screen">
        <header className="md:hidden sticky top-0 z-40 flex items-center gap-snug border-b border-outline-variant/60 bg-surface-container-lowest px-gutter py-tight">
          <button
            type="button"
            className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-xl text-on-surface hover:bg-surface-container"
            aria-label="Open sidebar"
            onClick={() => setMobileOpen(true)}
          >
            {mobileOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
          <p className="font-headline-md text-headline-md text-primary truncate">
            {title ?? "Pinalink Console"}
          </p>
        </header>

        <main className="flex-1 p-gutter md:p-roomy">{children}</main>
      </div>
    </div>
  );
};

export default AdminLayout;
