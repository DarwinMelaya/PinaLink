import { useState } from "react";
import { Link } from "react-router-dom";

const LOGO_SRC = "/img/pinalink_logo.png";

const NAV_LINKS = [
  { href: "#features", label: "Features" },
  { href: "#pricing", label: "Pricing" },
  { href: "#solutions", label: "Solutions" },
] as const;

const idleLinkClass =
  "font-body-md text-body-md text-on-surface-variant hover:text-primary transition-colors duration-200";
const activeLinkClass =
  "font-body-md text-body-md text-primary dark:text-primary-fixed-dim font-bold border-b-2 border-primary";

const Navbar = () => {
  const [activeHref, setActiveHref] = useState<string | null>(null);

  return (
    <header className="w-full h-16 bg-surface dark:bg-surface-dim shadow-sm sticky top-0 z-50 transition-standard">
      <nav className="flex justify-between items-center px-gutter max-w-container-max mx-auto h-full">
        <Link to="/" className="flex items-center shrink-0">
          <img
            alt="Pinalink"
            className="h-10 w-auto max-h-10 object-contain"
            src={LOGO_SRC}
          />
        </Link>

        <div className="hidden md:flex items-center gap-roomy">
          {NAV_LINKS.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className={activeHref === link.href ? activeLinkClass : idleLinkClass}
              onClick={() => setActiveHref(link.href)}
            >
              {link.label}
            </a>
          ))}
        </div>

        <div className="flex items-center gap-cozy">
          <Link
            to="/login"
            className="font-body-md text-body-md text-on-surface-variant hover:text-primary active:scale-95 transition-all min-h-11 inline-flex items-center"
          >
            Login
          </Link>
          <Link
            to="/signup"
            className="bg-primary-container text-on-primary-container px-cozy py-tight rounded-lg font-body-md text-body-md font-bold active:scale-95 transition-all min-h-11 inline-flex items-center"
          >
            Sign Up
          </Link>
        </div>
      </nav>
    </header>
  );
};

export default Navbar;
