import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, BadgeCheck, Link2, QrCode } from "lucide-react";
import { motion } from "motion/react";
import SectionHeading from "./SectionHeading";
import { useLandingVariants } from "./landingMotion";

const TRACKING_TAGS = ["Link clicks", "Cert scans", "Live / revoked"];
const CHART_BARS = [38, 62, 45, 80, 58, 92, 70];

type FeatureCardProps = {
  children: ReactNode;
  className?: string;
  id?: string;
};

const FeatureCard = ({ children, className = "", id }: FeatureCardProps) => {
  const { reduce, cardIn } = useLandingVariants();

  return (
    <motion.article
      id={id}
      variants={cardIn}
      whileHover={reduce ? undefined : { y: -6 }}
      transition={{ type: "spring", stiffness: 280, damping: 22 }}
      className={`uw-glow-hover scroll-mt-32 rounded-[1.75rem] border border-white/5 p-roomy transition-colors hover:border-[var(--uw-cyan)]/30 ${className}`}
    >
      {children}
    </motion.article>
  );
};

type FeatureIconProps = {
  children: ReactNode;
  className?: string;
};

const FeatureIcon = ({ children, className = "" }: FeatureIconProps) => (
  <div
    className={`mb-cozy flex size-12 items-center justify-center rounded-2xl shadow-[0_0_18px_rgba(0,212,197,0.3)] ${className}`}
  >
    {children}
  </div>
);

const CertificatePreview = () => {
  const { reduce } = useLandingVariants();

  return (
    <div
      className="relative min-h-44 shrink-0 overflow-hidden rounded-[1.25rem] border border-white/5 bg-[var(--uw-elevated)] md:w-64"
      aria-hidden
    >
      <div className="absolute inset-x-0 top-0 flex h-8 items-center gap-tight border-b border-white/5 bg-white/5 px-snug">
        <span className="size-2 rounded-full bg-[#ff6b6b]/60" />
        <span className="size-2 rounded-full bg-[var(--uw-cyan)]/80" />
      </div>
      <div className="mt-12 space-y-snug p-snug">
        <p className="inline-flex items-center gap-tight rounded-full bg-[var(--uw-cyan)]/10 px-tight py-0.5 font-mono-label text-xs font-bold text-[var(--uw-cyan)]">
          <BadgeCheck size={14} />
          CERT-001 · VALID
        </p>
        <div className="h-2 w-2/3 rounded-full bg-white/10" />
        <div className="h-2 w-1/2 rounded-full bg-white/10" />
        <motion.div
          className="mx-auto mt-cozy flex size-20 items-center justify-center rounded-xl bg-white"
          initial={{ opacity: 0, scale: 0.85 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ duration: reduce ? 0.01 : 0.5 }}
        >
          <QrCode size={40} className="text-black" />
        </motion.div>
        <p className="text-center font-mono-label text-xs text-[var(--uw-muted)]">
          /cert/ABC123XYZ
        </p>
      </div>
    </div>
  );
};

const ClickChart = () => {
  const { reduce } = useLandingVariants();

  return (
    <div
      className="flex h-28 w-full shrink-0 items-end gap-tight rounded-2xl border border-white/10 bg-black/25 p-snug sm:w-56"
      aria-hidden
    >
      {CHART_BARS.map((height, i) => (
        <motion.span
          key={`bar-${height}-${i}`}
          className="flex-1 origin-bottom rounded-t-md bg-gradient-to-t from-[var(--uw-cyan)]/40 to-[var(--uw-cyan)]"
          style={{ height: `${height}%` }}
          initial={{ scaleY: reduce ? 1 : 0 }}
          whileInView={{ scaleY: 1 }}
          viewport={{ once: true }}
          transition={{ duration: reduce ? 0.01 : 0.6, delay: reduce ? 0 : 0.2 + i * 0.06, ease: "easeOut" }}
        />
      ))}
    </div>
  );
};

const FeaturesSection = () => {
  const { stagger } = useLandingVariants();

  return (
    <section id="features" className="scroll-mt-28 border-t border-white/5 py-wide">
      <div className="mx-auto max-w-container-max px-gutter">
        <SectionHeading
          eyebrow="Features"
          title="Built for links & certificates"
          description="Short URLs with custom codes, a branded QR studio, and public certificate verification — ready for events, trainings, and campaigns."
        />

        <motion.div
          className="grid grid-cols-1 gap-gutter md:grid-cols-12"
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, amount: 0.12 }}
          variants={stagger}
        >
          <FeatureCard className="flex flex-col gap-roomy bg-[var(--uw-card)] md:col-span-8 md:flex-row">
            <div className="min-w-0 flex-grow">
              <FeatureIcon className="uw-gradient">
                <BadgeCheck size={22} aria-hidden />
              </FeatureIcon>
              <h3 className="mb-tight font-headline-md text-headline-md text-[var(--uw-text)]">
                Verified certificates
              </h3>
              <p className="mb-cozy text-[var(--uw-muted)]">
                Issue certificates with unique IDs and QR codes that open a
                public verify page. Bulk Excel upload, org logo branding,
                revoke/delete, and PDF packs for attendees.
              </p>
              <Link
                className="group inline-flex min-h-11 items-center gap-tight font-bold text-[var(--uw-cyan)]"
                to="/signup"
              >
                Start issuing certificates
                <ArrowRight
                  size={16}
                  className="transition-transform group-hover:translate-x-1"
                  aria-hidden
                />
              </Link>
            </div>
            <CertificatePreview />
          </FeatureCard>

          <FeatureCard className="bg-[var(--uw-card)] md:col-span-4">
            <FeatureIcon className="bg-[var(--uw-navy)] text-white">
              <Link2 size={22} aria-hidden />
            </FeatureIcon>
            <h3 className="mb-tight font-headline-md text-headline-md text-[var(--uw-text)]">
              Short links &amp; aliases
            </h3>
            <p className="text-[var(--uw-muted)]">
              Paste a long URL, get a short link, then customize the vanity
              code — pause, favorite, expire, and edit the destination anytime.
            </p>
          </FeatureCard>

          <FeatureCard className="bg-[var(--uw-card)] md:col-span-5">
            <FeatureIcon className="bg-white/10 text-[var(--uw-cyan)]">
              <QrCode size={22} aria-hidden />
            </FeatureIcon>
            <h3 className="mb-tight font-headline-md text-headline-md text-[var(--uw-text)]">
              Advanced QR studio
            </h3>
            <p className="text-[var(--uw-muted)]">
              Logo in QR, shapes, frames, stickers. Export PNG (transparent),
              SVG, or PDF. Dynamic destination — change the URL without
              reprinting the QR.
            </p>
          </FeatureCard>

          <FeatureCard
            id="solutions"
            className="flex flex-col gap-roomy bg-[linear-gradient(135deg,var(--uw-navy)_0%,#013a5e_45%,rgba(0,212,197,0.35)_100%)] sm:flex-row sm:items-center md:col-span-7"
          >
            <div className="min-w-0 flex-grow">
              <h3 className="mb-tight font-headline-md text-headline-md text-white">
                Click tracking
              </h3>
              <p className="mb-cozy text-white/75">
                See total clicks per short link, live vs paused status, and
                certificate verify scans — so you know what people actually
                open.
              </p>
              <ul className="flex flex-wrap gap-tight">
                {TRACKING_TAGS.map((tag) => (
                  <li
                    key={tag}
                    className="inline-flex min-h-9 items-center rounded-full border border-white/15 bg-white/10 px-snug text-label-sm font-bold text-white"
                  >
                    {tag}
                  </li>
                ))}
              </ul>
            </div>
            <ClickChart />
          </FeatureCard>
        </motion.div>
      </div>
    </section>
  );
};

export default FeaturesSection;
