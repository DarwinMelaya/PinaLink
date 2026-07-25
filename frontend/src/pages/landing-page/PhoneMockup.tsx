import { motion, useReducedMotion } from "motion/react";

const MOCKUP_SRC = "/img/mockup/phone-mockup.png";

/**
 * 3D phone frame with Pinalink dashboard mockup + Motion float/tilt.
 */
const PhoneMockup = () => {
  const reduce = useReducedMotion();

  return (
    <div className="phone-scene relative mx-auto w-full max-w-[260px] sm:max-w-[280px] lg:max-w-[300px]">
      <motion.div
        className="phone-glow pointer-events-none absolute inset-x-4 -bottom-2 h-28 blur-3xl bg-[radial-gradient(ellipse_at_center,_rgba(0,212,197,0.5),_transparent_70%)]"
        aria-hidden
        animate={
          reduce
            ? { opacity: 0.7 }
            : { opacity: [0.45, 0.85, 0.45], scale: [1, 1.08, 1] }
        }
        transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
      />

      <motion.div
        className="phone-float"
        style={{ animation: "none" }}
        animate={reduce ? undefined : { y: [0, -14, 0] }}
        transition={{ duration: 5.5, repeat: Infinity, ease: "easeInOut" }}
      >
        <motion.div
          className="phone-3d"
          style={{ transformStyle: "preserve-3d" }}
          initial={false}
          whileHover={
            reduce
              ? undefined
              : {
                  rotateY: -6,
                  rotateX: 2,
                  rotateZ: 0,
                  transition: { type: "spring", stiffness: 180, damping: 18 },
                }
          }
        >
          <div className="phone-side" aria-hidden />

          <div className="phone-body !aspect-auto !p-[0.45rem]">
            <div className="phone-notch" aria-hidden />

            <div className="phone-screen !block overflow-hidden rounded-[1.65rem]">
              <img
                src={MOCKUP_SRC}
                alt="Pinalink dashboard on mobile"
                className="block w-full h-auto select-none pointer-events-none"
                draggable={false}
              />
            </div>
          </div>
        </motion.div>
      </motion.div>
    </div>
  );
};

export default PhoneMockup;
