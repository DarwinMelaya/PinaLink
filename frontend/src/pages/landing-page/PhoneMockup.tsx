import { useRef, type PointerEvent } from "react";
import {
  motion,
  useMotionTemplate,
  useMotionValue,
  useReducedMotion,
  useSpring,
  useTransform,
} from "motion/react";

const MOCKUP_SRC = "/img/mockup/phone-mockup.png";

const BASE_ROTATE_X = 9;
const BASE_ROTATE_Y = -23;
const TILT_X = 10;
const TILT_Y = 16;

const TILT_SPRING = { stiffness: 150, damping: 20, mass: 0.7 } as const;

/**
 * Extruded 3D phone (back plate + side faces + buttons) holding the Pinalink
 * dashboard shot, with pointer-driven tilt and a specular highlight that
 * tracks the cursor.
 */
const PhoneMockup = () => {
  const reduce = useReducedMotion();
  const sceneRef = useRef<HTMLDivElement>(null);

  // Pointer offset from scene center, normalised to -0.5 .. 0.5 on both axes.
  const pointerX = useMotionValue(0);
  const pointerY = useMotionValue(0);
  const smoothX = useSpring(pointerX, TILT_SPRING);
  const smoothY = useSpring(pointerY, TILT_SPRING);

  const rotateY = useTransform(
    smoothX,
    [-0.5, 0.5],
    [BASE_ROTATE_Y - TILT_Y, BASE_ROTATE_Y + TILT_Y]
  );
  const rotateX = useTransform(
    smoothY,
    [-0.5, 0.5],
    [BASE_ROTATE_X + TILT_X, BASE_ROTATE_X - TILT_X]
  );

  const lightX = useTransform(smoothX, (v) => `${50 - v * 70}%`);
  const lightY = useTransform(smoothY, (v) => `${50 - v * 60}%`);
  const sheen = useMotionTemplate`radial-gradient(110% 85% at ${lightX} ${lightY}, rgba(255,255,255,0.24), rgba(255,255,255,0.06) 34%, transparent 64%)`;

  const trackPointer = (event: PointerEvent<HTMLDivElement>) => {
    if (reduce) return;
    const rect = sceneRef.current?.getBoundingClientRect();
    if (!rect || rect.width === 0 || rect.height === 0) return;
    pointerX.set((event.clientX - rect.left) / rect.width - 0.5);
    pointerY.set((event.clientY - rect.top) / rect.height - 0.5);
  };

  const resetPointer = () => {
    pointerX.set(0);
    pointerY.set(0);
  };

  return (
    <div
      ref={sceneRef}
      className="phone-scene relative mx-auto w-full max-w-[270px] py-6 sm:max-w-[300px] lg:max-w-[330px]"
      onPointerMove={trackPointer}
      onPointerLeave={resetPointer}
      onPointerCancel={resetPointer}
    >
      <motion.div
        className="phone-halo"
        aria-hidden
        animate={
          reduce
            ? { opacity: 0.7 }
            : { opacity: [0.45, 0.85, 0.45], scale: [1, 1.07, 1] }
        }
        transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
      />

      <motion.div
        className="phone-float"
        animate={reduce ? undefined : { y: [0, -14, 0] }}
        transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
      >
        <motion.div
          className="phone-3d"
          style={{ rotateX, rotateY, rotateZ: -1.5 }}
        >
          <div className="phone-shadow" aria-hidden />

          <div className="phone-body">
            <div className="phone-back" aria-hidden />
            <div className="phone-face phone-face-top" aria-hidden />
            <div className="phone-face phone-face-bottom" aria-hidden />
            <div className="phone-face phone-face-left" aria-hidden>
              <span className="phone-btn phone-btn-mute" />
              <span className="phone-btn phone-btn-vol-up" />
              <span className="phone-btn phone-btn-vol-down" />
            </div>
            <div className="phone-face phone-face-right" aria-hidden>
              <span className="phone-btn phone-btn-power" />
            </div>

            <div className="phone-screen">
              <img
                src={MOCKUP_SRC}
                alt="Pinalink dashboard on mobile"
                className="phone-shot"
                draggable={false}
              />
              <motion.div
                className="phone-sheen"
                style={{ backgroundImage: sheen }}
                aria-hidden
              />
              <div className="phone-glare" aria-hidden />
              {!reduce && (
                <motion.div
                  className="phone-sweep"
                  aria-hidden
                  animate={{ x: ["-150%", "260%"] }}
                  transition={{
                    duration: 2.2,
                    repeat: Infinity,
                    repeatDelay: 5,
                    ease: "easeInOut",
                  }}
                />
              )}
            </div>

            <div className="phone-rim" aria-hidden />
          </div>

          <div className="phone-reflection" aria-hidden>
            <img src={MOCKUP_SRC} alt="" className="phone-shot" draggable={false} />
          </div>
        </motion.div>
      </motion.div>
    </div>
  );
};

export default PhoneMockup;
