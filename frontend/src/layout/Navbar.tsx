import { useState } from "react";
import { Link } from "react-router-dom";
import { Menu, X } from "lucide-react";

const LOGO_SRC = "/img/pinalink_logo.png";

const NAV_LINKS = [
  { href: "#features", label: "Features" },
  { href: "#pricing", label: "Pricing" },
  { href: "#solutions", label: "Solutions" },
] as const;

const Navbar = () => {
  const [activeHref, setActiveHref] = useState<string | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 w-full pointer-events-none">
      <div className="px-gutter pt-tight md:pt-snug pb-tight">
        <nav
          className="pointer-events-auto mx-auto max-w-container-max flex items-center justify-between gap-snug rounded-full border border-outline-variant/60 bg-surface-container-lowest px-snug py-tight shadow-[0_8px_30px_rgba(25,27,35,0.08)] md:px-cozy md:py-2.5"
          aria-label="Primary"
        >
          <Link
            to="/"
            className="shrink-0 rounded-full focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/20"
            onClick={() => setMenuOpen(false)}
          >
            <img
              alt="Pinalink"
              className="h-9 w-auto max-h-9 object-contain md:h-10 md:max-h-10"
              src={LOGO_SRC}
            />
          </Link>

          <div className="hidden md:flex flex-1 items-center justify-center gap-6 lg:gap-8">
            {NAV_LINKS.map((link) => {
              const isActive = activeHref === link.href;
              return (
                <a
                  key={link.href}
                  href={link.href}
                  onClick={() => setActiveHref(link.href)}
                  className={`font-label-sm text-label-sm uppercase tracking-[0.08em] transition-colors duration-200 min-h-11 inline-flex items-center ${
                    isActive
                      ? "text-primary font-bold"
                      : "text-on-surface-variant hover:text-primary"
                  }`}
                >
                  {link.label}
                </a>
              );
            })}
          </div>

          <div className="hidden md:flex items-center gap-snug shrink-0">
            <Link
              to="/login"
              className="font-label-sm text-label-sm uppercase tracking-[0.08em] text-on-surface-variant hover:text-primary transition-colors min-h-11 inline-flex items-center px-tight"
            >
              Login
            </Link>
            <Link
              to="/signup"
              className="inline-flex min-h-11 items-center justify-center rounded-full bg-gradient-to-b from-primary-container to-primary px-cozy text-on-primary font-label-sm text-label-sm uppercase tracking-[0.06em] font-bold shadow-[0_6px_20px_rgba(0,74,198,0.35)] hover:brightness-105 active:scale-[0.98] transition-all"
            >
              Sign Up
            </Link>
          </div>

          <button
            type="button"
            className="md:hidden inline-flex min-h-11 min-w-11 items-center justify-center rounded-full text-on-surface hover:bg-surface-container transition-colors"
            aria-expanded={menuOpen}
            aria-controls="mobile-nav"
            aria-label={menuOpen ? "Close menu" : "Open menu"}
            onClick={() => setMenuOpen((open) => !open)}
          >
            {menuOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
        </nav>

        {menuOpen ? (
          <div
            id="mobile-nav"
            className="pointer-events-auto md:hidden mt-tight mx-auto max-w-container-max rounded-[1.5rem] border border-outline-variant/60 bg-surface-container-lowest p-snug shadow-[0_8px_30px_rgba(25,27,35,0.08)]"
          >
            <div className="flex flex-col gap-tight">
              {NAV_LINKS.map((link) => (
                <a
                  key={link.href}
                  href={link.href}
                  onClick={() => {
                    setActiveHref(link.href);
                    setMenuOpen(false);
                  }}
                  className="min-h-11 inline-flex items-center px-snug rounded-full font-label-sm text-label-sm uppercase tracking-[0.08em] text-on-surface-variant hover:bg-surface-container-low hover:text-primary transition-colors"
                >
                  {link.label}
                </a>
              ))}
              <div className="h-px bg-outline-variant/60 my-tight" />
              <Link
                to="/login"
                onClick={() => setMenuOpen(false)}
                className="min-h-11 inline-flex items-center justify-center rounded-full font-label-sm text-label-sm uppercase tracking-[0.08em] text-on-surface-variant hover:bg-surface-container-low"
              >
                Login
              </Link>
              <Link
                to="/signup"
                onClick={() => setMenuOpen(false)}
                className="min-h-11 inline-flex items-center justify-center rounded-full bg-gradient-to-b from-primary-container to-primary px-cozy text-on-primary font-label-sm text-label-sm uppercase tracking-[0.06em] font-bold shadow-[0_6px_20px_rgba(0,74,198,0.35)]"
              >
                Sign Up
              </Link>
            </div>
          </div>
        ) : null}
      </div>
    </header>
  );
};

export default Navbar;
