import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import Navbar from "./Navbar";

const LOGO_SRC = "/img/pinalink_logo.png";

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

const Layout = ({ children }: LayoutProps) => {
  return (
    <div className="min-h-screen bg-surface text-on-surface font-body-md">
      <Navbar />
      <main>{children}</main>
      <footer className="w-full py-wide bg-surface-container dark:bg-surface-container-lowest transition-standard">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-gutter px-gutter max-w-container-max mx-auto">
          <div className="md:col-span-1">
            <Link to="/" className="inline-flex items-center mb-cozy">
              <img
                alt="Pinalink"
                className="h-12 w-auto max-w-[220px] object-contain"
                src={LOGO_SRC}
              />
            </Link>
            <p className="font-label-sm text-label-sm text-on-surface-variant leading-relaxed">
              © 2024 Pinalink. Precision shortening for modern scale.
            </p>
          </div>
          {FOOTER_COLUMNS.map((column) => (
            <div key={column.title}>
              <h4 className="font-label-sm text-label-sm text-on-surface font-bold mb-cozy uppercase tracking-wider">
                {column.title}
              </h4>
              <ul className="space-y-snug">
                {column.links.map((link) => (
                  <li key={`${column.title}-${link.label}`}>
                    <a
                      className="font-label-sm text-label-sm text-on-surface-variant hover:text-primary transition-colors duration-200"
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
