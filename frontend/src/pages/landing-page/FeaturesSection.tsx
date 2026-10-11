import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, BadgeCheck, BarChart3, Link2, QrCode } from "lucide-react";
import { motion } from "motion/react";
import SectionHeading from "./SectionHeading";
import { useLandingVariants } from "./landingMotion";

type FeatureCardProps = {
  children: ReactNode;
  className?: string;
  id?: string;
};

const FeatureCard = ({ children, className = "", id }: FeatureCardProps) => {
  const { fadeUp } = useLandingVariants();

  return (
    <motion.article
      id={id}
      variants={fadeUp}
      className={`scroll-mt-32 rounded-3xl border border-white/5 bg-[var(--uw-card)] p-roomy ${className}`}
    >
      {children}
    </motion.article>
  );
};

type FeatureTitleProps = {
  icon: ReactNode;
  children: ReactNode;
};

const FeatureTitle = ({ icon, children }: FeatureTitleProps) => (
  <h3 className="mb-tight flex items-center gap-snug font-headline-md text-headline-md text-[var(--uw-text)]">
    <span className="text-[var(--uw-cyan)]">{icon}</span>
    {children}
  </h3>
);

const CertificatePreview = () => (
  <div
    className="shrink-0 space-y-snug rounded-2xl border border-white/5 bg-[var(--uw-elevated)] p-cozy md:w-64"
    aria-hidden
  >
    <p className="inline-flex items-center gap-tight font-mono-label text-xs font-bold text-[var(--uw-cyan)]">
      <BadgeCheck size={14} />
      CERT-001 · VALID
    </p>
    <div className="h-2 w-2/3 rounded-full bg-white/10" />
    <div className="h-2 w-1/2 rounded-full bg-white/10" />
    <div className="mx-auto mt-cozy flex size-20 items-center justify-center rounded-xl bg-white">
      <QrCode size={40} className="text-black" />
    </div>
    <p className="text-center font-mono-label text-xs text-[var(--uw-muted)]">
      /cert/ABC123XYZ
    </p>
  </div>
);

const FeaturesSection = () => {
  const { stagger } = useLandingVariants();

  return (
    <section id="features" className="scroll-mt-28 border-t border-white/5 py-wide">
      <div className="mx-auto max-w-container-max px-gutter">
        <SectionHeading
          title="What you can do"
          description="Three tools in one account: short links, a QR code designer, and certificates with a public verify page."
        />

        <motion.div
          className="grid grid-cols-1 gap-gutter md:grid-cols-2"
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, amount: 0.12 }}
          variants={stagger}
        >
          <FeatureCard className="flex flex-col gap-roomy md:col-span-2 md:flex-row md:items-center">
            <div className="min-w-0 flex-grow">
              <FeatureTitle icon={<BadgeCheck size={22} aria-hidden />}>
                Certificates
              </FeatureTitle>
              <p className="mb-cozy max-w-prose text-[var(--uw-muted)]">
                Each certificate gets a unique ID and a QR code that opens a
                public verify page. Upload attendees from an Excel file, add
                your organization&apos;s logo, revoke a certificate if needed,
                and download PDFs in bulk.
              </p>
              <Link
                className="group inline-flex min-h-11 items-center gap-tight font-bold text-[var(--uw-cyan)]"
                to="/signup"
              >
                Issue certificates
                <ArrowRight
                  size={16}
                  className="transition-transform group-hover:translate-x-1"
                  aria-hidden
                />
              </Link>
            </div>
            <CertificatePreview />
          </FeatureCard>

          <FeatureCard>
            <FeatureTitle icon={<Link2 size={22} aria-hidden />}>
              Short links
            </FeatureTitle>
            <p className="text-[var(--uw-muted)]">
              Paste a long URL and get a short one. Pick your own code, pause or
              expire a link, and change where it points at any time.
            </p>
          </FeatureCard>

          <FeatureCard>
            <FeatureTitle icon={<QrCode size={22} aria-hidden />}>
              QR codes
            </FeatureTitle>
            <p className="text-[var(--uw-muted)]">
              Add a logo, change shapes and frames, then export as PNG, SVG, or
              PDF. The destination can change later without reprinting.
            </p>
          </FeatureCard>

          <FeatureCard id="solutions" className="md:col-span-2">
            <FeatureTitle icon={<BarChart3 size={22} aria-hidden />}>
              Click counts
            </FeatureTitle>
            <p className="max-w-prose text-[var(--uw-muted)]">
              See how many times each short link was opened, which links are
              live or paused, and how often certificates were scanned.
            </p>
          </FeatureCard>
        </motion.div>
      </div>
    </section>
  );
};

export default FeaturesSection;
