import { useEffect, useRef, type MouseEvent, type ReactNode } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowRight, Link2, QrCode, BarChart3, BadgeCheck } from "lucide-react";
import {
  motion,
  useReducedMotion,
  useScroll,
  useSpring,
  useTransform,
  useMotionValue,
  useMotionTemplate,
  type Variants,
} from "motion/react";
import Layout from "../../layout/Layout";
import PhoneMockup from "./PhoneMockup";

const easeOut = [0.22, 1, 0.36, 1] as const;

const HEADLINE_A = ["Shorten", "Your", "Links,"];
const HEADLINE_B = ["Expand", "Your", "Reach."];

type MagneticProps = {
  children: ReactNode;
  className?: string;
  reduce: boolean | null;
};

function Magnetic({ children, className, reduce }: MagneticProps) {
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const springX = useSpring(x, { stiffness: 260, damping: 20 });
  const springY = useSpring(y, { stiffness: 260, damping: 20 });

  function onMove(e: MouseEvent<HTMLDivElement>) {
    if (reduce) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const dx = e.clientX - (rect.left + rect.width / 2);
    const dy = e.clientY - (rect.top + rect.height / 2);
    x.set(dx * 0.22);
    y.set(dy * 0.22);
  }

  function onLeave() {
    x.set(0);
    y.set(0);
  }

  return (
    <motion.div
      className={className}
      style={{ x: springX, y: springY }}
      onMouseMove={onMove}
      onMouseLeave={onLeave}
      whileTap={reduce ? undefined : { scale: 0.96 }}
    >
      {children}
    </motion.div>
  );
}

type WordRevealProps = {
  words: string[];
  className?: string;
  gradient?: boolean;
  reduce: boolean | null;
};

function WordReveal({ words, className, gradient, reduce }: WordRevealProps) {
  return (
    <span className={className}>
      {words.map((word, i) => (
        <span key={`${word}-${i}`} className="inline-block overflow-hidden align-bottom mr-[0.28em] last:mr-0">
          <motion.span
            className={`inline-block ${gradient ? "uw-gradient-text uw-text-glow" : ""}`}
            initial={{ y: reduce ? 0 : "110%", opacity: reduce ? 1 : 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{
              duration: reduce ? 0.01 : 0.55,
              delay: reduce ? 0 : 0.35 + i * 0.07,
              ease: easeOut,
            }}
          >
            {word}
          </motion.span>
        </span>
      ))}
    </span>
  );
}

const LandingPage = () => {
  const navigate = useNavigate();
  const reduce = useReducedMotion();
  const heroRef = useRef<HTMLElement>(null);

  // Supabase Site URL errors land on `/` — send them to login with the message
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (!params.get("error")) return;
    navigate(`/login?${params.toString()}`, { replace: true });
  }, [navigate]);

  const { scrollYProgress } = useScroll({
    target: heroRef,
    offset: ["start start", "end start"],
  });

  const phoneY = useTransform(scrollYProgress, [0, 1], [0, reduce ? 0 : 80]);
  const phoneRotate = useTransform(
    scrollYProgress,
    [0, 1],
    [0, reduce ? 0 : -8],
  );
  const orbA = useTransform(scrollYProgress, [0, 1], [0, reduce ? 0 : -60]);
  const orbB = useTransform(scrollYProgress, [0, 1], [0, reduce ? 0 : 40]);
  const heroOpacity = useTransform(scrollYProgress, [0, 0.85], [1, 0.35]);

  const mouseX = useMotionValue(50);
  const mouseY = useMotionValue(40);
  const spotlight = useMotionTemplate`radial-gradient(560px circle at ${mouseX}% ${mouseY}%, rgba(0,212,197,0.28), rgba(0,212,197,0.08) 38%, transparent 62%)`;

  const fadeUp: Variants = {
    hidden: { opacity: 0, y: reduce ? 0 : 28, filter: reduce ? "blur(0px)" : "blur(8px)" },
    show: {
      opacity: 1,
      y: 0,
      filter: "blur(0px)",
      transition: { duration: reduce ? 0.01 : 0.6, ease: easeOut },
    },
  };

  const stagger: Variants = {
    hidden: {},
    show: {
      transition: {
        staggerChildren: reduce ? 0 : 0.11,
        delayChildren: reduce ? 0 : 0.06,
      },
    },
  };

  const cardIn: Variants = {
    hidden: {
      opacity: 0,
      y: reduce ? 0 : 40,
      scale: reduce ? 1 : 0.94,
      rotateX: reduce ? 0 : 8,
    },
    show: {
      opacity: 1,
      y: 0,
      scale: 1,
      rotateX: 0,
      transition: { type: "spring", stiffness: 120, damping: 18 },
    },
  };

  function onHeroMove(e: MouseEvent<HTMLElement>) {
    if (reduce) return;
    const rect = e.currentTarget.getBoundingClientRect();
    mouseX.set(((e.clientX - rect.left) / rect.width) * 100);
    mouseY.set(((e.clientY - rect.top) / rect.height) * 100);
  }

  return (
    <Layout>
      <motion.section
        ref={heroRef}
        className="relative pt-roomy md:pt-wide pb-roomy overflow-hidden"
        style={{ opacity: heroOpacity }}
        onMouseMove={onHeroMove}
      >
        <motion.div
          className="pointer-events-none absolute inset-0 -z-10"
          style={{ backgroundImage: spotlight }}
          aria-hidden
        />
        <div
          className="pointer-events-none absolute inset-0 -z-20 bg-[radial-gradient(ellipse_at_top_right,_rgba(0,212,197,0.1),_transparent_55%),radial-gradient(ellipse_at_bottom_left,_rgba(0,43,91,0.45),_transparent_50%)]"
          aria-hidden
        />

        {/* Floating orbs */}
        <motion.div
          className="pointer-events-none absolute -top-10 right-[8%] size-48 rounded-full bg-[var(--uw-cyan)]/35 blur-3xl"
          style={{ y: orbA }}
          animate={
            reduce
              ? undefined
              : { x: [0, 24, 0], scale: [1, 1.2, 1], opacity: [0.55, 0.95, 0.55] }
          }
          transition={{ duration: 9, repeat: Infinity, ease: "easeInOut" }}
          aria-hidden
        />
        <motion.div
          className="pointer-events-none absolute bottom-10 left-[5%] size-56 rounded-full bg-[var(--uw-navy)]/60 blur-3xl"
          style={{ y: orbB }}
          animate={
            reduce
              ? undefined
              : { x: [0, -18, 0], scale: [1, 1.15, 1], opacity: [0.5, 0.85, 0.5] }
          }
          transition={{ duration: 11, repeat: Infinity, ease: "easeInOut" }}
          aria-hidden
        />
        <motion.div
          className="pointer-events-none absolute top-1/3 left-1/2 size-64 -translate-x-1/2 rounded-full bg-[var(--uw-cyan)]/15 blur-3xl"
          animate={
            reduce
              ? undefined
              : { scale: [1, 1.25, 1], opacity: [0.35, 0.7, 0.35] }
          }
          transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
          aria-hidden
        />

        <div className="max-w-container-max mx-auto px-gutter">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-roomy lg:gap-wide items-center">
            <motion.div
              className="text-center lg:text-left order-2 lg:order-1"
              variants={stagger}
              initial="hidden"
              animate="show"
            >
              <motion.img
                src="/img/pinalink_logo.png"
                alt="Pinalink"
                className="mx-auto lg:mx-0 mb-cozy h-28 w-auto max-w-full object-contain sm:h-36 md:h-40"
                initial={{ opacity: 0, y: reduce ? 0 : 28 }}
                animate={
                  reduce
                    ? {
                        opacity: 1,
                        y: 0,
                        filter: "drop-shadow(0 0 28px rgba(0,212,197,0.45))",
                      }
                    : {
                        opacity: 1,
                        y: 0,
                        filter: [
                          "drop-shadow(0 0 22px rgba(0,212,197,0.35))",
                          "drop-shadow(0 0 38px rgba(0,212,197,0.65))",
                          "drop-shadow(0 0 22px rgba(0,212,197,0.35))",
                        ],
                      }
                }
                transition={
                  reduce
                    ? { duration: 0.01 }
                    : {
                        opacity: { duration: 0.6, ease: easeOut },
                        y: { duration: 0.6, ease: easeOut },
                        filter: {
                          duration: 3.6,
                          repeat: Infinity,
                          ease: "easeInOut",
                        },
                      }
                }
                whileHover={
                  reduce
                    ? undefined
                    : { scale: 1.03, filter: "drop-shadow(0 0 48px rgba(0,212,197,0.8))" }
                }
              />

              <h1 className="text-[clamp(28px,5vw,48px)] font-bold tracking-tight text-[var(--uw-text)] mb-cozy max-w-xl mx-auto lg:mx-0 leading-tight">
                <WordReveal words={HEADLINE_A} reduce={reduce} />
                <br className="hidden sm:block" />
                <WordReveal words={HEADLINE_B} gradient reduce={reduce} />
              </h1>

              <motion.p
                variants={fadeUp}
                className="font-body-lg text-body-lg text-[var(--uw-muted)] max-w-lg mx-auto lg:mx-0 mb-roomy"
              >
                Create short links, design advanced QR codes, and issue
                verifiable certificates — all from one workspace.
              </motion.p>

              <motion.div
                variants={fadeUp}
                className="flex flex-col sm:flex-row justify-center lg:justify-start gap-cozy"
              >
                <Magnetic reduce={reduce}>
                  <Link
                    to="/signup"
                    className="uw-glow-ring uw-glow-hover uw-gradient px-wide h-14 rounded-full font-bold text-body-md shadow-[0_0_32px_rgba(0,212,197,0.45)] inline-flex items-center justify-center gap-tight w-full sm:w-auto"
                  >
                    Get Started
                    <motion.span
                      aria-hidden
                      animate={reduce ? undefined : { x: [0, 4, 0] }}
                      transition={{ duration: 1.4, repeat: Infinity }}
                    >
                      <ArrowRight size={18} />
                    </motion.span>
                  </Link>
                </Magnetic>
                <Magnetic reduce={reduce}>
                  <Link
                    to="/login"
                    className="uw-glow-hover bg-[var(--uw-card)] text-[var(--uw-text)] px-wide h-14 rounded-full font-bold text-body-md border border-white/10 hover:bg-[var(--uw-card-hover)] inline-flex items-center justify-center w-full sm:w-auto"
                  >
                    Sign in
                  </Link>
                </Magnetic>
              </motion.div>
            </motion.div>

            <motion.div
              className="relative order-1 lg:order-2 flex justify-center py-cozy lg:py-0"
              style={{ y: phoneY, rotate: phoneRotate }}
              initial={{ opacity: 0, x: reduce ? 0 : 56, scale: reduce ? 1 : 0.9 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              transition={{
                type: "spring",
                stiffness: 90,
                damping: 16,
                delay: reduce ? 0 : 0.2,
              }}
            >
              <PhoneMockup />
            </motion.div>
          </div>
        </div>
      </motion.section>

      <section id="features" className="py-wide border-t border-white/5">
        <div className="max-w-container-max mx-auto px-gutter">
          <motion.div
            className="text-center mb-wide"
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, amount: 0.4 }}
            variants={stagger}
          >
            <motion.h2
              variants={fadeUp}
              className="text-[clamp(22px,3vw,32px)] font-bold text-[var(--uw-text)] mb-tight uppercase tracking-tight"
            >
              Built for links &amp; certificates
            </motion.h2>
            <motion.p
              variants={fadeUp}
              className="text-[var(--uw-muted)] max-w-xl mx-auto"
            >
              Short URLs with custom codes, branded QR studio, and public
              certificate verification — ready for events, trainings, and
              campaigns.
            </motion.p>
          </motion.div>

          <motion.div
            className="grid grid-cols-1 md:grid-cols-12 gap-gutter [perspective:1200px]"
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, amount: 0.12 }}
            variants={stagger}
          >
            <motion.div
              variants={cardIn}
              whileHover={
                reduce
                  ? undefined
                  : { y: -8, borderColor: "rgba(0,212,197,0.4)", scale: 1.01 }
              }
              transition={{ type: "spring", stiffness: 280, damping: 22 }}
              className="uw-glow-hover md:col-span-8 bg-[var(--uw-card)] p-roomy rounded-[1.75rem] border border-white/5 flex flex-col md:flex-row gap-roomy"
            >
              <div className="flex-grow min-w-0">
                <motion.div
                  className="uw-glow-ring w-12 h-12 uw-gradient rounded-2xl flex items-center justify-center mb-cozy shadow-[0_0_20px_rgba(0,212,197,0.4)]"
                  whileHover={reduce ? undefined : { rotate: 12, scale: 1.1 }}
                  transition={{ type: "spring", stiffness: 300, damping: 14 }}
                >
                  <BadgeCheck size={22} aria-hidden />
                </motion.div>
                <h3 className="font-headline-md text-headline-md text-[var(--uw-text)] mb-tight">
                  Verified Certificates
                </h3>
                <p className="text-[var(--uw-muted)] mb-cozy">
                  Issue certificates with unique IDs and QR codes that open a
                  public verify page. Bulk Excel upload, org logo branding,
                  revoke/delete, and PDF packs for attendees.
                </p>
                <Link
                  className="text-[var(--uw-cyan)] font-bold inline-flex items-center gap-tight hover:gap-cozy transition-all min-h-11"
                  to="/signup"
                >
                  Start issuing certificates
                  <ArrowRight size={16} aria-hidden />
                </Link>
              </div>
              <div className="md:w-64 flex-shrink-0 bg-[var(--uw-elevated)] rounded-[1.25rem] overflow-hidden relative border border-white/5 min-h-40">
                <div className="absolute inset-x-0 top-0 h-8 bg-white/5 border-b border-white/5 flex items-center px-snug gap-tight">
                  <div className="w-2 h-2 rounded-full bg-[#ff6b6b]/60" />
                  <div className="w-2 h-2 rounded-full bg-[var(--uw-cyan)]/80" />
                </div>
                <div className="mt-12 p-snug space-y-snug">
                  <p className="uw-text-glow font-mono-label text-[11px] text-[var(--uw-lime)] font-bold">
                    CERT-001 · VALID
                  </p>
                  <div className="h-2 w-2/3 bg-white/10 rounded-full" />
                  <div className="h-2 w-1/2 bg-white/10 rounded-full" />
                  <motion.div
                    className="mt-cozy mx-auto size-20 rounded-xl bg-white flex items-center justify-center"
                    initial={{ opacity: 0, scale: 0.85 }}
                    whileInView={{ opacity: 1, scale: 1 }}
                    viewport={{ once: true }}
                    transition={{ duration: reduce ? 0.01 : 0.5 }}
                  >
                    <QrCode size={40} className="text-black" aria-hidden />
                  </motion.div>
                  <p className="text-center text-[10px] text-[var(--uw-muted)]">
                    /cert/ABC123XYZ
                  </p>
                </div>
              </div>
            </motion.div>

            <motion.div
              variants={cardIn}
              whileHover={
                reduce
                  ? undefined
                  : { y: -8, borderColor: "rgba(0,212,197,0.4)" }
              }
              className="uw-glow-hover md:col-span-4 bg-[var(--uw-card)] p-roomy rounded-[1.75rem] border border-white/5"
            >
              <motion.div
                className="uw-glow-ring w-12 h-12 rounded-2xl flex items-center justify-center mb-cozy bg-[var(--uw-navy)] text-white shadow-[0_0_18px_rgba(0,212,197,0.3)]"
                whileHover={reduce ? undefined : { rotate: -12, scale: 1.1 }}
              >
                <Link2 size={22} aria-hidden />
              </motion.div>
              <h3 className="font-headline-md text-headline-md text-[var(--uw-text)] mb-tight">
                Short links &amp; aliases
              </h3>
              <p className="text-[var(--uw-muted)]">
                Paste a long URL, get a short link, then customize the vanity
                code — pause, favorite, expire, and edit destination anytime.
              </p>
            </motion.div>

            <motion.div
              variants={cardIn}
              whileHover={
                reduce
                  ? undefined
                  : { y: -8, borderColor: "rgba(0,212,197,0.4)" }
              }
              className="uw-glow-hover md:col-span-5 bg-[var(--uw-card)] p-roomy rounded-[1.75rem] border border-white/5"
            >
              <motion.div
                className="uw-glow-ring w-12 h-12 rounded-2xl flex items-center justify-center mb-cozy bg-white/10 text-[var(--uw-cyan)] shadow-[0_0_18px_rgba(0,212,197,0.35)]"
                whileHover={reduce ? undefined : { rotate: 12, scale: 1.1 }}
              >
                <QrCode size={22} aria-hidden />
              </motion.div>
              <h3 className="font-headline-md text-headline-md text-[var(--uw-text)] mb-tight">
                Advanced QR studio
              </h3>
              <p className="text-[var(--uw-muted)]">
                Logo in QR, shapes, frames, stickers. Export PNG (transparent),
                SVG, or PDF. Dynamic destination — change the URL without
                reprinting the QR.
              </p>
            </motion.div>

            <motion.div
              id="solutions"
              variants={cardIn}
              whileHover={reduce ? undefined : { y: -8, scale: 1.015 }}
              className="uw-glow-ring uw-glow-hover md:col-span-7 rounded-[1.75rem] p-roomy flex items-center gap-roomy border border-white/5 uw-gradient shadow-[0_0_40px_rgba(0,212,197,0.35)]"
            >
              <div className="flex-grow min-w-0">
                <h3 className="font-headline-md text-headline-md mb-tight text-[var(--uw-on-accent)]">
                  Click tracking
                </h3>
                <p className="mb-cozy text-[var(--uw-on-accent)]/80">
                  See total clicks per short link, live vs paused status, and
                  certificate verify scans — so you know what people actually
                  open.
                </p>
                <div className="flex flex-wrap gap-tight">
                  <span className="inline-flex min-h-10 items-center rounded-full bg-black/20 px-cozy text-label-sm font-bold text-[var(--uw-on-accent)]">
                    Link clicks
                  </span>
                  <span className="inline-flex min-h-10 items-center rounded-full bg-black/20 px-cozy text-label-sm font-bold text-[var(--uw-on-accent)]">
                    Cert scans
                  </span>
                  <span className="inline-flex min-h-10 items-center rounded-full bg-black/20 px-cozy text-label-sm font-bold text-[var(--uw-on-accent)]">
                    Live / revoked
                  </span>
                </div>
              </div>
              <motion.div
                className="hidden lg:block shrink-0 text-[var(--uw-on-accent)]/30"
                animate={
                  reduce ? undefined : { y: [0, -10, 0], rotate: [0, 6, 0] }
                }
                transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
              >
                <BarChart3 size={80} aria-hidden />
              </motion.div>
            </motion.div>
          </motion.div>
        </div>
      </section>

      <section id="pricing" className="py-wide border-t border-white/5 relative overflow-hidden">
        <motion.div
          className="pointer-events-none absolute left-1/2 top-1/2 size-[32rem] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[var(--uw-cyan)]/20 blur-3xl"
          aria-hidden
          animate={
            reduce
              ? undefined
              : { scale: [1, 1.25, 1], opacity: [0.4, 0.85, 0.4] }
          }
          transition={{ duration: 7, repeat: Infinity, ease: "easeInOut" }}
        />

        <motion.div
          className="relative max-w-3xl mx-auto px-gutter text-center"
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, amount: 0.35 }}
          variants={stagger}
        >
          <motion.div
            variants={fadeUp}
            className="inline-flex items-center gap-snug bg-[var(--uw-card)] text-[var(--uw-cyan)] px-cozy py-tight rounded-full font-label-sm text-label-sm mb-cozy border border-white/5"
          >
            <motion.span
              className="size-2 rounded-full bg-[var(--uw-cyan)]"
              aria-hidden
              animate={
                reduce
                  ? undefined
                  : { scale: [1, 1.4, 1], opacity: [1, 0.5, 1] }
              }
              transition={{ duration: 1.6, repeat: Infinity }}
            />
            Ready to scale?
          </motion.div>
          <motion.h2
            variants={fadeUp}
            className="text-[clamp(28px,5vw,48px)] font-bold tracking-tight text-[var(--uw-text)] mb-cozy"
          >
            Start with links &amp;{" "}
            <span className="uw-gradient-text uw-text-glow">certificates.</span>
          </motion.h2>
          <motion.p
            variants={fadeUp}
            className="font-body-lg text-body-lg text-[var(--uw-muted)] mb-wide"
          >
            Shorten URLs, design QR codes, and issue verifiable certificates
            with public scan pages — free to get started.
          </motion.p>
          <motion.div
            variants={fadeUp}
            className="flex flex-col sm:flex-row justify-center gap-cozy"
          >
            <Magnetic reduce={reduce}>
              <Link
                to="/signup"
                className="uw-glow-ring uw-glow-hover uw-gradient px-wide h-14 rounded-full font-bold text-body-md shadow-[0_0_32px_rgba(0,212,197,0.45)] inline-flex items-center justify-center w-full sm:w-auto"
              >
                Get Started Now
              </Link>
            </Magnetic>
            <Magnetic reduce={reduce}>
              <a
                href="#pricing"
                className="uw-glow-hover bg-[var(--uw-card)] text-[var(--uw-text)] px-wide h-14 rounded-full font-bold text-body-md border border-white/10 hover:bg-[var(--uw-card-hover)] inline-flex items-center justify-center w-full sm:w-auto"
              >
                View All Plans
              </a>
            </Magnetic>
          </motion.div>
          <motion.p
            variants={fadeUp}
            className="mt-cozy text-[var(--uw-muted)] font-label-sm text-label-sm"
          >
            No credit card required for our Free Forever tier.
          </motion.p>
        </motion.div>
      </section>
    </Layout>
  );
};

export default LandingPage;
