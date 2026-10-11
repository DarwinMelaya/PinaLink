import { motion } from "motion/react";
import SectionHeading from "./SectionHeading";
import { useLandingVariants } from "./landingMotion";

type Step = {
  title: string;
  description: string;
};

const STEPS: Step[] = [
  {
    title: "Paste a link",
    description: "Drop in a long URL. You get a short link back right away.",
  },
  {
    title: "Customize it",
    description: "Set your own code, design a QR code, or attach the link to a certificate.",
  },
  {
    title: "Share it",
    description: "Send the link or print the QR code, then check the click count on your dashboard.",
  },
];

const HowItWorksSection = () => {
  const { stagger, fadeUp } = useLandingVariants();

  return (
    <section id="how-it-works" className="scroll-mt-28 border-t border-white/5 py-wide">
      <div className="mx-auto max-w-container-max px-gutter">
        <SectionHeading
          title="How it works"
          description="Sign up, paste a URL, and share the result."
        />

        <motion.ol
          className="grid grid-cols-1 gap-gutter md:grid-cols-3"
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, amount: 0.3 }}
          variants={stagger}
        >
          {STEPS.map(({ title, description }, i) => (
            <motion.li key={title} variants={fadeUp} className="border-t border-white/10 pt-cozy">
              <p className="mb-tight font-mono-label text-label-sm text-[var(--uw-cyan)]">
                {String(i + 1).padStart(2, "0")}
              </p>
              <h3 className="mb-tight font-headline-md text-headline-md text-[var(--uw-text)]">
                {title}
              </h3>
              <p className="max-w-xs text-[var(--uw-muted)]">{description}</p>
            </motion.li>
          ))}
        </motion.ol>
      </div>
    </section>
  );
};

export default HowItWorksSection;
