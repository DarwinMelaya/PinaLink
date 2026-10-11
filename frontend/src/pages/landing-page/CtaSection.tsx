import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import { motion } from "motion/react";
import { PRIMARY_CTA, SECONDARY_CTA } from "./landingStyles";
import { useLandingVariants } from "./landingMotion";

const CtaSection = () => {
  const { fadeUp } = useLandingVariants();

  return (
    <section id="pricing" className="scroll-mt-28 border-t border-white/5 py-wide">
      <div className="mx-auto max-w-container-max px-gutter">
        <motion.div
          className="rounded-3xl border border-white/5 bg-[var(--uw-card)] px-cozy py-wide text-center sm:px-wide"
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, amount: 0.35 }}
          variants={fadeUp}
        >
          <div className="mx-auto max-w-2xl">
            <h2 className="mb-cozy text-[clamp(28px,5vw,48px)] font-bold leading-tight tracking-tight text-[var(--uw-text)]">
              Try it with your next link.
            </h2>
            <p className="mb-roomy font-body-lg text-body-lg text-[var(--uw-muted)]">
              Make an account and shorten your first URL, design a QR code, or
              set up a certificate batch.
            </p>
            <div className="flex flex-col justify-center gap-snug sm:flex-row">
              <Link to="/signup" className={PRIMARY_CTA}>
                Create an account
                <ArrowRight
                  size={18}
                  className="transition-transform group-hover:translate-x-1"
                  aria-hidden
                />
              </Link>
              <a href="#features" className={SECONDARY_CTA}>
                See features
              </a>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default CtaSection;
