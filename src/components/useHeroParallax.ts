import { type RefObject, useEffect } from "react";

const SETTLE_SPEED = 0.11;
const SETTLE_THRESHOLD = 0.001;

export function useHeroParallax(
  sectionRef: RefObject<HTMLElement | null>,
) {
  useEffect(() => {
    const section = sectionRef.current;
    if (!section) return;

    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
    const finePointer = window.matchMedia("(pointer: fine)");
    let targetX = 0;
    let targetY = 0;
    let currentX = 0;
    let currentY = 0;
    let animationFrame = 0;

    const render = () => {
      animationFrame = 0;
      currentX += (targetX - currentX) * SETTLE_SPEED;
      currentY += (targetY - currentY) * SETTLE_SPEED;

      section.style.setProperty("--hero-parallax-x", currentX.toFixed(4));
      section.style.setProperty("--hero-parallax-y", currentY.toFixed(4));

      if (
        Math.abs(targetX - currentX) > SETTLE_THRESHOLD ||
        Math.abs(targetY - currentY) > SETTLE_THRESHOLD
      ) {
        animationFrame = window.requestAnimationFrame(render);
      }
    };

    const queueRender = () => {
      if (!animationFrame) {
        animationFrame = window.requestAnimationFrame(render);
      }
    };

    const reset = () => {
      targetX = 0;
      targetY = 0;
      queueRender();
    };

    const handlePointerMove = (event: PointerEvent) => {
      if (reducedMotion.matches || !finePointer.matches) return;

      const bounds = section.getBoundingClientRect();
      targetX = Math.max(
        -1,
        Math.min(1, (event.clientX - bounds.left - bounds.width / 2) / (bounds.width / 2)),
      );
      targetY = Math.max(
        -1,
        Math.min(1, (event.clientY - bounds.top - bounds.height / 2) / (bounds.height / 2)),
      );
      queueRender();
    };

    section.addEventListener("pointermove", handlePointerMove, { passive: true });
    section.addEventListener("pointerleave", reset);
    window.addEventListener("blur", reset);
    reducedMotion.addEventListener("change", reset);
    finePointer.addEventListener("change", reset);

    return () => {
      if (animationFrame) window.cancelAnimationFrame(animationFrame);
      section.removeEventListener("pointermove", handlePointerMove);
      section.removeEventListener("pointerleave", reset);
      window.removeEventListener("blur", reset);
      reducedMotion.removeEventListener("change", reset);
      finePointer.removeEventListener("change", reset);
      section.style.removeProperty("--hero-parallax-x");
      section.style.removeProperty("--hero-parallax-y");
    };
  }, [sectionRef]);
}
