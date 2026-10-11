import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import { motion } from "motion/react";
import PhoneMockup from "./PhoneMockup";
import { PRIMARY_CTA, SECONDARY_CTA } from "./landingStyles";
import { useLandingVariants } from "./landingMotion";

const HeroSection = () => {
  const { reduce, fadeUp, stagger } = useLandingVariants();

  return (
    <section className="pb-wide pt-roomy md:pt-wide">
      <div className="mx-auto max-w-container-max px-gutter">
        <div className="grid grid-cols-1 items-center gap-roomy lg:grid-cols-[1.2fr_1fr] lg:gap-wide">
          <motion.div
            className="text-center lg:text-left"
            variants={stagger}
            initial="hidden"
            animate="show"
          >
            <motion.h1
              variants={fadeUp}
              className="mx-auto mb-cozy max-w-2xl text-[clamp(36px,5vw,56px)] font-bold leading-[1.05] tracking-tight text-[var(--uw-text)] lg:mx-0"
            >
              Short links, QR codes, and certificates people can verify.
            </motion.h1>

            <motion.p
              variants={fadeUp}
              className="mx-auto mb-roomy max-w-lg font-body-lg text-body-lg text-[var(--uw-muted)] lg:mx-0"
            >
              Shorten a URL, style a QR code with your logo, or issue a batch of
              certificates from a spreadsheet. Each certificate gets a public
              page anyone can scan to check it.
            </motion.p>

            <motion.div
              variants={fadeUp}
              className="flex flex-col justify-center gap-snug sm:flex-row lg:justify-start"
            >
              <Link to="/signup" className={PRIMARY_CTA}>
                Create an account
                <ArrowRight
                  size={18}
                  className="transition-transform group-hover:translate-x-1"
                  aria-hidden
                />
              </Link>
              <Link to="/login" className={SECONDARY_CTA}>
                Sign in
              </Link>
            </motion.div>
          </motion.div>

          <motion.div
            className="flex justify-center py-cozy lg:py-0"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: reduce ? 0.01 : 0.5, delay: reduce ? 0 : 0.15 }}
          >
            <PhoneMockup />
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
