import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import { motion } from "motion/react";
import Magnetic from "./Magnetic";
import { GRADIENT_TEXT, PRIMARY_CTA, SECONDARY_CTA } from "./landingStyles";
import { useLandingVariants } from "./landingMotion";

const CtaSection = () => {
  const { reduce, fadeUp, stagger } = useLandingVariants();

  return (
    <section id="pricing" className="scroll-mt-28 border-t border-white/5 py-wide">
      <div className="mx-auto max-w-container-max px-gutter">
        <motion.div
          className="relative overflow-hidden rounded-[2rem] border border-[var(--uw-cyan)]/20 bg-[var(--uw-card)] px-cozy py-wide text-center sm:px-wide"
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, amount: 0.35 }}
          variants={stagger}
        >
          <div
            className="pointer-events-none absolute -top-1/2 left-1/2 size-[36rem] -translate-x-1/2 rounded-full bg-[var(--uw-cyan)]/15 blur-3xl"
            aria-hidden
          />
          <div
            className="pointer-events-none absolute inset-0 bg-[radial-gradient(rgba(255,255,255,0.06)_1px,transparent_1px)] [background-size:24px_24px] [mask-image:radial-gradient(ellipse_at_top,black,transparent_70%)]"
            aria-hidden
          />

          <div className="relative mx-auto max-w-2xl">
            <motion.p
              variants={fadeUp}
              className="mb-cozy inline-flex items-center gap-tight rounded-full border border-white/10 bg-black/30 px-snug py-tight font-label-sm text-label-sm text-[var(--uw-cyan)]"
            >
              <span className="size-2 rounded-full bg-[var(--uw-cyan)]" aria-hidden />
              Free to start
            </motion.p>
            <motion.h2
              variants={fadeUp}
              className="mb-cozy text-[clamp(28px,5vw,48px)] font-bold leading-tight tracking-tight text-[var(--uw-text)]"
            >
              Start with links &amp;{" "}
              <span className={GRADIENT_TEXT}>certificates.</span>
            </motion.h2>
            <motion.p
              variants={fadeUp}
              className="mb-roomy font-body-lg text-body-lg text-[var(--uw-muted)]"
            >
              Shorten URLs, design QR codes, and issue verifiable certificates
              with public scan pages — free to get started.
            </motion.p>
            <motion.div
              variants={fadeUp}
              className="flex flex-col justify-center gap-snug sm:flex-row"
            >
              <Magnetic reduce={reduce}>
                <Link to="/signup" className={PRIMARY_CTA}>
                  Create free account
                  <ArrowRight
                    size={18}
                    className="transition-transform group-hover:translate-x-1"
                    aria-hidden
                  />
                </Link>
              </Magnetic>
              <Magnetic reduce={reduce}>
                <a href="#features" className={SECONDARY_CTA}>
                  Explore features
                </a>
              </Magnetic>
            </motion.div>
            <motion.p
              variants={fadeUp}
              className="mt-cozy font-label-sm text-label-sm text-[var(--uw-muted)]"
            >
              No credit card required for our Free Forever tier.
            </motion.p>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default CtaSection;
