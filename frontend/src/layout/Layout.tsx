import type { ReactNode, SVGProps } from "react";
import { Link } from "react-router-dom";
import Navbar from "./Navbar";

const LOGO_SRC = "/img/pinalink_logo.png";

const SOCIAL_LINKS = [
  {
    href: "https://www.instagram.com/drwn.mlya/",
    label: "Instagram",
    Icon: InstagramIcon,
  },
  {
    href: "https://www.facebook.com/darwin.melaya.9",
    label: "Facebook",
    Icon: FacebookIcon,
  },
] as const;

type FooterLink = { href: string; label: string };

const FOOTER_COLUMNS: { title: string; links: FooterLink[] }[] = [
  {
    title: "Product",
    links: [
      { href: "#features", label: "Analytics" },
      { href: "#features", label: "QR Codes" },
      { href: "#solutions", label: "API Docs" },
    ],
  },
  {
    title: "Company",
    links: [
      { href: "#", label: "About Us" },
      { href: "#", label: "Careers" },
      { href: "#", label: "Contact" },
    ],
  },
  {
    title: "Legal",
    links: [
      { href: "#", label: "Privacy Policy" },
      { href: "#", label: "Terms of Service" },
      { href: "#", label: "Security" },
    ],
  },
];

type LayoutProps = {
  children: ReactNode;
};

function InstagramIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden {...props}>
      <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z" />
    </svg>
  );
}

function FacebookIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden {...props}>
      <path d="M24 12.073C24 5.405 18.627 0 12 0S0 5.405 0 12.073C0 18.1 4.388 23.094 10.125 24v-8.437H7.078v-3.49h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.49h-2.796V24C19.612 23.094 24 18.1 24 12.073z" />
    </svg>
  );
}

const Layout = ({ children }: LayoutProps) => {
  return (
    <div className="user-workspace min-h-screen font-body-md">
      <Navbar />
      <main>{children}</main>
      <footer className="w-full py-wide border-t border-white/5 bg-[var(--uw-elevated)]">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-gutter px-gutter max-w-container-max mx-auto">
          <div className="md:col-span-1">
            <Link to="/" className="inline-flex items-center mb-cozy">
              <img
                alt="Pinalink"
                className="h-12 w-auto max-w-[220px] object-contain"
                src={LOGO_SRC}
              />
            </Link>
            <p className="font-label-sm text-label-sm text-[var(--uw-muted)] leading-relaxed mb-cozy">
              © 2026 Pinalink. Shorten. Share. Connect.
            </p>
            <p className="font-label-sm text-label-sm text-[var(--uw-text)] mb-snug">
              Developer Darwin Melaya
            </p>
            <div className="flex items-center gap-snug">
              {SOCIAL_LINKS.map(({ href, label, Icon }) => (
                <a
                  key={label}
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={label}
                  className="inline-flex size-11 items-center justify-center rounded-full border border-white/10 bg-[var(--uw-card)] text-[var(--uw-muted)] hover:text-[var(--uw-cyan)] hover:border-[var(--uw-cyan)]/40 transition-colors"
                >
                  <Icon className="size-5" />
                </a>
              ))}
            </div>
          </div>
          {FOOTER_COLUMNS.map((column) => (
            <div key={column.title}>
              <h4 className="font-label-sm text-label-sm text-[var(--uw-text)] font-bold mb-cozy uppercase tracking-wider">
                {column.title}
              </h4>
              <ul className="space-y-snug">
                {column.links.map((link) => (
                  <li key={`${column.title}-${link.label}`}>
                    <a
                      className="font-label-sm text-label-sm text-[var(--uw-muted)] hover:text-[var(--uw-cyan)] transition-colors duration-200"
                      href={link.href}
                    >
                      {link.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </footer>
    </div>
  );
};

export default Layout;
