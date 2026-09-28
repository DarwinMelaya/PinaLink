import { useRef, type MouseEvent } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, Check } from "lucide-react";
import {
  motion,
  useMotionTemplate,
  useMotionValue,
  useScroll,
  useTransform,
} from "motion/react";
import Magnetic from "./Magnetic";
import PhoneMockup from "./PhoneMockup";
import { GRADIENT_TEXT, PRIMARY_CTA, SECONDARY_CTA } from "./landingStyles";
import { easeOut, useLandingVariants } from "./landingMotion";

const HEADLINE_A = ["Shorten", "Your", "Links,"];
const HEADLINE_B = ["Expand", "Your", "Reach."];
const TRUST_POINTS = ["Free forever tier", "No credit card", "Custom vanity codes"];

type WordRevealProps = {
  words: string[];
  reduce: boolean | null;
  delay?: number;
  gradient?: boolean;
};

const WordReveal = ({ words, reduce, delay = 0, gradient }: WordRevealProps) => (
  <span className="block">
    {words.map((word, i) => (
      <span
        key={`${word}-${i}`}
        className="mr-[0.25em] inline-block overflow-hidden pb-[0.08em] align-bottom last:mr-0"
      >
        <motion.span
          className={`inline-block ${gradient ? GRADIENT_TEXT : ""}`}
          initial={{ y: reduce ? 0 : "110%", opacity: reduce ? 1 : 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{
            duration: reduce ? 0.01 : 0.55,
            delay: reduce ? 0 : delay + i * 0.07,
            ease: easeOut,
          }}
        >
          {word}
        </motion.span>
      </span>
    ))}
  </span>
);

const HeroSection = () => {
  const { reduce, fadeUp, stagger } = useLandingVariants();
  const heroRef = useRef<HTMLElement>(null);

  const { scrollYProgress } = useScroll({
    target: heroRef,
    offset: ["start start", "end start"],
  });
  const phoneY = useTransform(scrollYProgress, [0, 1], [0, reduce ? 0 : 80]);
  const phoneRotate = useTransform(scrollYProgress, [0, 1], [0, reduce ? 0 : -6]);
  const orbA = useTransform(scrollYProgress, [0, 1], [0, reduce ? 0 : -60]);
  const orbB = useTransform(scrollYProgress, [0, 1], [0, reduce ? 0 : 40]);
  const heroOpacity = useTransform(scrollYProgress, [0, 0.85], [1, 0.35]);

  const mouseX = useMotionValue(50);
  const mouseY = useMotionValue(40);
  const spotlight = useMotionTemplate`radial-gradient(560px circle at ${mouseX}% ${mouseY}%, rgba(0,212,197,0.22), rgba(0,212,197,0.06) 38%, transparent 62%)`;

  function onHeroMove(e: MouseEvent<HTMLElement>) {
    if (reduce) return;
    const rect = e.currentTarget.getBoundingClientRect();
    mouseX.set(((e.clientX - rect.left) / rect.width) * 100);
    mouseY.set(((e.clientY - rect.top) / rect.height) * 100);
  }

  return (
    <motion.section
      ref={heroRef}
      className="relative overflow-hidden pb-wide pt-roomy md:pt-wide"
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
      <div
        className="pointer-events-none absolute inset-0 -z-20 bg-[radial-gradient(rgba(255,255,255,0.07)_1px,transparent_1px)] [background-size:28px_28px] [mask-image:radial-gradient(ellipse_at_center,black_20%,transparent_70%)]"
        aria-hidden
      />

      <motion.div
        className="pointer-events-none absolute -top-10 right-[8%] size-48 rounded-full bg-[var(--uw-cyan)]/30 blur-3xl"
        style={{ y: orbA }}
        animate={reduce ? undefined : { x: [0, 24, 0], opacity: [0.5, 0.85, 0.5] }}
        transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
        aria-hidden
      />
      <motion.div
        className="pointer-events-none absolute bottom-10 left-[5%] size-56 rounded-full bg-[var(--uw-navy)]/60 blur-3xl"
        style={{ y: orbB }}
        aria-hidden
      />

      <div className="mx-auto max-w-container-max px-gutter">
        <div className="grid grid-cols-1 items-center gap-roomy lg:grid-cols-[1.2fr_1fr] lg:gap-wide">
          <motion.div
            className="text-center lg:text-left"
            variants={stagger}
            initial="hidden"
            animate="show"
          >
            <motion.p
              variants={fadeUp}
              className="mb-cozy inline-flex items-center gap-tight rounded-full border border-[var(--uw-cyan)]/25 bg-[var(--uw-cyan)]/10 px-snug py-tight font-label-sm text-label-sm text-[var(--uw-cyan)]"
            >
              <span className="size-2 rounded-full bg-[var(--uw-cyan)]" aria-hidden />
              Links · QR codes · Certificates
            </motion.p>

            <h1 className="mx-auto mb-cozy max-w-2xl text-[clamp(36px,5vw,56px)] font-bold leading-[1.05] tracking-tight text-[var(--uw-text)] lg:mx-0">
              <WordReveal words={HEADLINE_A} reduce={reduce} delay={0.2} />
              <WordReveal words={HEADLINE_B} reduce={reduce} delay={0.45} gradient />
            </h1>

            <motion.p
              variants={fadeUp}
              className="mx-auto mb-roomy max-w-lg font-body-lg text-body-lg text-[var(--uw-muted)] lg:mx-0"
            >
              Create short links, design branded QR codes, and issue
              verifiable certificates — all from one workspace.
            </motion.p>

            <motion.div
              variants={fadeUp}
              className="flex flex-col justify-center gap-snug sm:flex-row lg:justify-start"
            >
              <Magnetic reduce={reduce}>
                <Link to="/signup" className={PRIMARY_CTA}>
                  Get started free
                  <ArrowRight
                    size={18}
                    className="transition-transform group-hover:translate-x-1"
                    aria-hidden
                  />
                </Link>
              </Magnetic>
              <Magnetic reduce={reduce}>
                <Link to="/login" className={SECONDARY_CTA}>
                  Sign in
                </Link>
              </Magnetic>
            </motion.div>

            <motion.ul
              variants={fadeUp}
              className="mt-roomy flex flex-wrap justify-center gap-x-cozy gap-y-tight lg:justify-start"
            >
              {TRUST_POINTS.map((point) => (
                <li
                  key={point}
                  className="inline-flex items-center gap-tight font-label-sm text-label-sm text-[var(--uw-muted)]"
                >
                  <Check size={16} className="text-[var(--uw-cyan)]" aria-hidden />
                  {point}
                </li>
              ))}
            </motion.ul>
          </motion.div>

          <motion.div
            className="relative flex justify-center py-cozy lg:py-0"
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
  );
};

export default HeroSection;
