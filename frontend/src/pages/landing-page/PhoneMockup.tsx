import { useRef, useState, type KeyboardEvent, type PointerEvent } from "react";
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

/** Degrees of yaw/pitch per pixel dragged. */
const DRAG_YAW_PER_PX = 0.45;
const DRAG_PITCH_PER_PX = 0.3;
/**
 * Clamps are on the resulting angle, not the drag delta: the base pose is
 * already yawed -23deg, so limiting the delta symmetrically would let one
 * direction reach an edge-on, unreadable screen.
 */
const MAX_YAW = 55;
const MAX_PITCH = 40;
/** Fling carried into the spring on release, in degrees per (px/ms). */
const FLING = 90;
const KEY_STEP = 8;

const TILT_SPRING = { stiffness: 150, damping: 20, mass: 0.7 } as const;
const DRAG_SPRING = { stiffness: 120, damping: 18, mass: 0.9 } as const;
/** Reduced motion still allows dragging — it just lands without the bounce. */
const DRAG_SPRING_REDUCED = {
  stiffness: 900,
  damping: 60,
  mass: 0.4,
} as const;

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function clampYaw(yaw: number): number {
  return clamp(yaw, -MAX_YAW - BASE_ROTATE_Y, MAX_YAW - BASE_ROTATE_Y);
}

function clampPitch(pitch: number): number {
  return clamp(pitch, -MAX_PITCH - BASE_ROTATE_X, MAX_PITCH - BASE_ROTATE_X);
}

/**
 * Extruded 3D phone (back plate + side faces + buttons) holding the Pinalink
 * dashboard shot. Hover tilts it toward the cursor; dragging spins it and keeps
 * the pose, with a specular highlight tracking the pointer.
 *
 * Reduced motion suppresses the ambient float/pulse/sweep and the hover tilt,
 * but keeps drag and keyboard rotation: those are direct manipulation, not
 * motion the visitor did not ask for.
 */
const PhoneMockup = () => {
  const reduce = useReducedMotion();
  const sceneRef = useRef<HTMLDivElement>(null);
  const [dragging, setDragging] = useState(false);

  // Pointer offset from scene center, normalised to -0.5 .. 0.5 on both axes.
  const pointerX = useMotionValue(0);
  const pointerY = useMotionValue(0);
  const smoothX = useSpring(pointerX, TILT_SPRING);
  const smoothY = useSpring(pointerY, TILT_SPRING);

  // Accumulated rotation from drag / keyboard, added on top of the hover tilt.
  const dragYaw = useMotionValue(0);
  const dragPitch = useMotionValue(0);
  const dragSpring = reduce ? DRAG_SPRING_REDUCED : DRAG_SPRING;
  const smoothYaw = useSpring(dragYaw, dragSpring);
  const smoothPitch = useSpring(dragPitch, dragSpring);

  // ASSUMPTION: the last pointer sample is recent enough to estimate velocity.
  // If a move event is dropped the fling is smaller, never wrong-signed.
  const lastPointer = useRef({ x: 0, y: 0, time: 0, vx: 0, vy: 0 });

  const rotateY = useTransform(
    [smoothX, smoothYaw],
    ([hover, yaw]: number[]) => BASE_ROTATE_Y + hover * TILT_Y * 2 + yaw
  );
  const rotateX = useTransform(
    [smoothY, smoothPitch],
    ([hover, pitch]: number[]) => BASE_ROTATE_X - hover * TILT_X * 2 + pitch
  );

  const lightX = useTransform(smoothX, (v) => `${50 - v * 70}%`);
  const lightY = useTransform(smoothY, (v) => `${50 - v * 60}%`);
  const sheen = useMotionTemplate`radial-gradient(110% 85% at ${lightX} ${lightY}, rgba(255,255,255,0.24), rgba(255,255,255,0.06) 34%, transparent 64%)`;

  const trackPointer = (event: PointerEvent<HTMLDivElement>) => {
    if (dragging) {
      const now = event.timeStamp;
      const prev = lastPointer.current;
      const dx = event.clientX - prev.x;
      const dy = event.clientY - prev.y;
      const dt = Math.max(now - prev.time, 1);

      dragYaw.set(clampYaw(dragYaw.get() + dx * DRAG_YAW_PER_PX));
      dragPitch.set(clampPitch(dragPitch.get() - dy * DRAG_PITCH_PER_PX));

      lastPointer.current = {
        x: event.clientX,
        y: event.clientY,
        time: now,
        vx: dx / dt,
        vy: dy / dt,
      };
      return;
    }

    // Hover tilt is unrequested motion; drag below stays available either way.
    if (reduce) return;

    const rect = sceneRef.current?.getBoundingClientRect();
    if (!rect || rect.width === 0 || rect.height === 0) return;
    pointerX.set((event.clientX - rect.left) / rect.width - 0.5);
    pointerY.set((event.clientY - rect.top) / rect.height - 0.5);
  };

  const startDrag = (event: PointerEvent<HTMLDivElement>) => {
    try {
      event.currentTarget.setPointerCapture(event.pointerId);
    } catch {
      // Capture is best-effort; the drag still tracks pointermove on the scene.
    }
    lastPointer.current = {
      x: event.clientX,
      y: event.clientY,
      time: event.timeStamp,
      vx: 0,
      vy: 0,
    };
    setDragging(true);
    // Hover tilt would fight the drag pose while spinning.
    pointerX.set(0);
    pointerY.set(0);
  };

  const endDrag = (event: PointerEvent<HTMLDivElement>) => {
    if (!dragging) return;
    try {
      if (event.currentTarget.hasPointerCapture(event.pointerId)) {
        event.currentTarget.releasePointerCapture(event.pointerId);
      }
    } catch {
      // Pointer already released by the browser.
    }
    setDragging(false);

    const { vx, vy } = lastPointer.current;
    dragYaw.set(clampYaw(dragYaw.get() + vx * FLING));
    dragPitch.set(clampPitch(dragPitch.get() - vy * FLING));
  };

  const resetPose = () => {
    pointerX.set(0);
    pointerY.set(0);
    dragYaw.set(0);
    dragPitch.set(0);
  };

  const resetHover = () => {
    if (dragging) return;
    pointerX.set(0);
    pointerY.set(0);
  };

  const handleKey = (event: KeyboardEvent<HTMLDivElement>) => {
    switch (event.key) {
      case "ArrowLeft":
        dragYaw.set(clampYaw(dragYaw.get() - KEY_STEP));
        break;
      case "ArrowRight":
        dragYaw.set(clampYaw(dragYaw.get() + KEY_STEP));
        break;
      case "ArrowUp":
        dragPitch.set(clampPitch(dragPitch.get() + KEY_STEP));
        break;
      case "ArrowDown":
        dragPitch.set(clampPitch(dragPitch.get() - KEY_STEP));
        break;
      case "Escape":
        resetPose();
        break;
      default:
        return;
    }
    event.preventDefault();
  };

  return (
    <div
      ref={sceneRef}
      className={`phone-scene phone-grab relative mx-auto w-full max-w-[270px] py-6 sm:max-w-[300px] lg:max-w-[330px] ${
        dragging ? "is-spinning" : ""
      }`}
      role="img"
      aria-label="Pinalink dashboard on mobile. Drag or use arrow keys to rotate, Escape to reset."
      tabIndex={0}
      onPointerMove={trackPointer}
      onPointerDown={startDrag}
      onPointerUp={endDrag}
      onPointerLeave={resetHover}
      onPointerCancel={endDrag}
      onDoubleClick={resetPose}
      onKeyDown={handleKey}
    >
      <motion.div
        className="phone-aura"
        aria-hidden
        animate={
          reduce
            ? { opacity: 0.75 }
            : dragging
              ? { opacity: 1, scale: 1.1 }
              : { opacity: [0.55, 0.95, 0.55], scale: [1, 1.08, 1] }
        }
        transition={
          dragging
            ? { duration: 0.25 }
            : { duration: 4.2, repeat: Infinity, ease: "easeInOut" }
        }
      />

      <motion.div
        className="phone-halo"
        aria-hidden
        animate={
          reduce
            ? { opacity: 0.75 }
            : { opacity: [0.5, 1, 0.5], scale: [1, 1.12, 1] }
        }
        transition={{ duration: 4.5, repeat: Infinity, ease: "easeInOut" }}
      />

      <motion.div
        className="phone-glow-ring"
        aria-hidden
        animate={
          reduce
            ? { opacity: 0.6 }
            : { opacity: [0.4, 0.85, 0.4], rotate: [0, 180, 360] }
        }
        transition={{ duration: 14, repeat: Infinity, ease: "linear" }}
      />

      <motion.div
        className="phone-float"
        animate={reduce || dragging ? undefined : { y: [0, -14, 0] }}
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
              {!reduce && !dragging && (
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
              <div className="phone-edge-glow" aria-hidden />
            </div>

            <div className="phone-rim" aria-hidden />
          </div>

          <div className="phone-reflection" aria-hidden>
            <img src={MOCKUP_SRC} alt="" className="phone-shot" draggable={false} />
          </div>
        </motion.div>
      </motion.div>

      <p className="phone-hint" aria-hidden>
        Drag to spin · double-click to reset
      </p>
    </div>
  );
};

export default PhoneMockup;
