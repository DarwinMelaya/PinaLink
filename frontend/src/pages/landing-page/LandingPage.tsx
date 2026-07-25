import { useRef, type MouseEvent, type ReactNode } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, Link2, QrCode, BarChart3, Terminal } from "lucide-react";
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
            className={`inline-block ${gradient ? "uw-gradient-text" : ""}`}
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
  const reduce = useReducedMotion();
  const heroRef = useRef<HTMLElement>(null);
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
  const spotlight = useMotionTemplate`radial-gradient(520px circle at ${mouseX}% ${mouseY}%, rgba(0,212,197,0.16), transparent 55%)`;

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
          className="pointer-events-none absolute -top-10 right-[8%] size-40 rounded-full bg-[var(--uw-cyan)]/20 blur-3xl"
          style={{ y: orbA }}
          animate={reduce ? undefined : { x: [0, 24, 0], scale: [1, 1.15, 1] }}
          transition={{ duration: 9, repeat: Infinity, ease: "easeInOut" }}
          aria-hidden
        />
        <motion.div
          className="pointer-events-none absolute bottom-10 left-[5%] size-52 rounded-full bg-[var(--uw-navy)]/50 blur-3xl"
          style={{ y: orbB }}
          animate={reduce ? undefined : { x: [0, -18, 0], scale: [1, 1.1, 1] }}
          transition={{ duration: 11, repeat: Infinity, ease: "easeInOut" }}
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
                variants={fadeUp}
                src="/img/pinalink_logo.png"
                alt="Pinalink"
                className="mx-auto lg:mx-0 mb-cozy h-28 w-auto max-w-full object-contain sm:h-36 md:h-40"
                whileHover={
                  reduce
                    ? undefined
                    : { scale: 1.03, filter: "drop-shadow(0 0 24px rgba(0,212,197,0.35))" }
                }
                transition={{ type: "spring", stiffness: 260, damping: 18 }}
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
                Create branded aliases, generate dynamic QR codes, and track
                every click — all from one workspace.
              </motion.p>

              <motion.div
                variants={fadeUp}
                className="flex flex-col sm:flex-row justify-center lg:justify-start gap-cozy"
              >
                <Magnetic reduce={reduce}>
                  <Link
                    to="/signup"
                    className="uw-gradient px-wide h-14 rounded-full font-bold text-body-md shadow-[0_0_24px_rgba(0,212,197,0.25)] inline-flex items-center justify-center gap-tight w-full sm:w-auto"
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
                    className="bg-[var(--uw-card)] text-[var(--uw-text)] px-wide h-14 rounded-full font-bold text-body-md border border-white/10 hover:bg-[var(--uw-card-hover)] inline-flex items-center justify-center w-full sm:w-auto"
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
              Precision Built Features
            </motion.h2>
            <motion.p
              variants={fadeUp}
              className="text-[var(--uw-muted)] max-w-xl mx-auto"
            >
              Scaling your digital presence requires more than just short URLs.
              It requires clarity, speed, and intelligence.
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
              className="md:col-span-8 bg-[var(--uw-card)] p-roomy rounded-[1.75rem] border border-white/5 flex flex-col md:flex-row gap-roomy"
            >
              <div className="flex-grow min-w-0">
                <motion.div
                  className="w-12 h-12 uw-gradient rounded-2xl flex items-center justify-center mb-cozy"
                  whileHover={reduce ? undefined : { rotate: 12, scale: 1.1 }}
                  transition={{ type: "spring", stiffness: 300, damping: 14 }}
                >
                  <BarChart3 size={22} aria-hidden />
                </motion.div>
                <h3 className="font-headline-md text-headline-md text-[var(--uw-text)] mb-tight">
                  Precision Analytics
                </h3>
                <p className="text-[var(--uw-muted)] mb-cozy">
                  Track every click in real-time. Understand your audience with
                  geolocation, device types, and referral source tracking. Our
                  dashboard delivers actionable insights to optimize your
                  campaigns instantly.
                </p>
                <a
                  className="text-[var(--uw-cyan)] font-bold inline-flex items-center gap-tight hover:gap-cozy transition-all min-h-11"
                  href="#features"
                >
                  Learn about data points
                  <ArrowRight size={16} aria-hidden />
                </a>
              </div>
              <div className="md:w-64 flex-shrink-0 bg-[var(--uw-elevated)] rounded-[1.25rem] overflow-hidden relative border border-white/5 min-h-40">
                <div className="absolute inset-x-0 top-0 h-8 bg-white/5 border-b border-white/5 flex items-center px-snug gap-tight">
                  <div className="w-2 h-2 rounded-full bg-[#ff6b6b]/60" />
                  <div className="w-2 h-2 rounded-full bg-[var(--uw-cyan)]/80" />
                </div>
                <div className="mt-12 p-snug">
                  <div className="h-2 w-2/3 bg-white/10 rounded-full mb-tight" />
                  <motion.div
                    className="h-4 w-full rounded-full mb-cozy uw-gradient origin-left"
                    initial={{ scaleX: 0 }}
                    whileInView={{ scaleX: 1 }}
                    viewport={{ once: true }}
                    transition={{ duration: reduce ? 0.01 : 0.9, ease: easeOut }}
                  />
                  <div className="flex gap-tight items-end h-16">
                    {[
                      { h: 30, tone: "bg-[var(--uw-navy)]" },
                      { h: 60, tone: "bg-[var(--uw-cyan)]/40" },
                      { h: 90, tone: "bg-[var(--uw-cyan)]" },
                      { h: 45, tone: "bg-[var(--uw-navy)]/80" },
                      { h: 75, tone: "bg-[var(--uw-cyan)]/70" },
                    ].map((bar, i) => (
                      <motion.div
                        key={bar.h}
                        className={`flex-1 rounded-t-lg origin-bottom ${bar.tone}`}
                        style={{ height: `${bar.h}%` }}
                        initial={{ scaleY: 0 }}
                        whileInView={{ scaleY: 1 }}
                        viewport={{ once: true }}
                        transition={{
                          type: "spring",
                          stiffness: 160,
                          damping: 14,
                          delay: reduce ? 0 : 0.08 * i,
                        }}
                      />
                    ))}
                  </div>
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
              className="md:col-span-4 bg-[var(--uw-card)] p-roomy rounded-[1.75rem] border border-white/5"
            >
              <motion.div
                className="w-12 h-12 rounded-2xl flex items-center justify-center mb-cozy bg-[var(--uw-navy)] text-white"
                whileHover={reduce ? undefined : { rotate: -12, scale: 1.1 }}
              >
                <Link2 size={22} aria-hidden />
              </motion.div>
              <h3 className="font-headline-md text-headline-md text-[var(--uw-text)] mb-tight">
                Custom Aliases
              </h3>
              <p className="text-[var(--uw-muted)]">
                Ditch the random strings. Use branded keywords like{" "}
                <span className="font-mono-label text-[var(--uw-cyan)]">
                  /promo24
                </span>{" "}
                to build trust and increase CTR by up to 34%.
              </p>
            </motion.div>

            <motion.div
              variants={cardIn}
              whileHover={
                reduce
                  ? undefined
                  : { y: -8, borderColor: "rgba(0,212,197,0.4)" }
              }
              className="md:col-span-5 bg-[var(--uw-card)] p-roomy rounded-[1.75rem] border border-white/5"
            >
              <motion.div
                className="w-12 h-12 rounded-2xl flex items-center justify-center mb-cozy bg-white/10 text-[var(--uw-cyan)]"
                whileHover={reduce ? undefined : { rotate: 12, scale: 1.1 }}
              >
                <QrCode size={22} aria-hidden />
              </motion.div>
              <h3 className="font-headline-md text-headline-md text-[var(--uw-text)] mb-tight">
                QR Code Generation
              </h3>
              <p className="text-[var(--uw-muted)]">
                Instant, high-resolution QR codes for every link. Perfect for
                print materials, retail displays, and seamless bridge from
                physical to digital.
              </p>
            </motion.div>

            <motion.div
              id="solutions"
              variants={cardIn}
              whileHover={reduce ? undefined : { y: -8, scale: 1.015 }}
              className="md:col-span-7 rounded-[1.75rem] p-roomy flex items-center gap-roomy border border-white/5 uw-gradient"
            >
              <div className="flex-grow min-w-0">
                <h3 className="font-headline-md text-headline-md mb-tight text-[var(--uw-on-accent)]">
                  Developer First API
                </h3>
                <p className="mb-cozy text-[var(--uw-on-accent)]/80">
                  Integrate shortening directly into your stack. Scale from 10
                  to 10 million links per month with our robust REST API.
                </p>
                <code className="block bg-black/25 p-snug rounded-2xl font-mono-label text-label-sm text-[var(--uw-on-accent)] overflow-x-auto">
                  {'POST /v1/shorten { "url": "..." }'}
                </code>
              </div>
              <motion.div
                className="hidden lg:block shrink-0 text-[var(--uw-on-accent)]/30"
                animate={
                  reduce ? undefined : { y: [0, -10, 0], rotate: [0, 6, 0] }
                }
                transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
              >
                <Terminal size={80} aria-hidden />
              </motion.div>
            </motion.div>
          </motion.div>
        </div>
      </section>

      <section id="pricing" className="py-wide border-t border-white/5 relative overflow-hidden">
        <motion.div
          className="pointer-events-none absolute left-1/2 top-1/2 size-[28rem] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[var(--uw-cyan)]/10 blur-3xl"
          aria-hidden
          animate={
            reduce
              ? undefined
              : { scale: [1, 1.2, 1], opacity: [0.35, 0.65, 0.35] }
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
            Start Shortening{" "}
            <span className="uw-gradient-text">for Free.</span>
          </motion.h2>
          <motion.p
            variants={fadeUp}
            className="font-body-lg text-body-lg text-[var(--uw-muted)] mb-wide"
          >
            Join over 15,000 businesses using Pinalink to drive smarter traffic
            and measure every conversion.
          </motion.p>
          <motion.div
            variants={fadeUp}
            className="flex flex-col sm:flex-row justify-center gap-cozy"
          >
            <Magnetic reduce={reduce}>
              <Link
                to="/signup"
                className="uw-gradient px-wide h-14 rounded-full font-bold text-body-md shadow-[0_0_24px_rgba(0,212,197,0.25)] inline-flex items-center justify-center w-full sm:w-auto"
              >
                Get Started Now
              </Link>
            </Magnetic>
            <Magnetic reduce={reduce}>
              <a
                href="#pricing"
                className="bg-[var(--uw-card)] text-[var(--uw-text)] px-wide h-14 rounded-full font-bold text-body-md border border-white/10 hover:bg-[var(--uw-card-hover)] inline-flex items-center justify-center w-full sm:w-auto"
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
