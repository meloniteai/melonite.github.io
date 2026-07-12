"use client";

import { useEffect, useRef, useState } from "react";

const FRAME_COUNT = 30;
const frameSource = (index: number) =>
  `/frames/hero-${String(index).padStart(3, "0")}.webp`;

export default function Home() {
  const stageRef = useRef<HTMLElement>(null);
  const animationFrameRef = useRef<number | null>(null);
  const [frame, setFrame] = useState(FRAME_COUNT - 1);

  useEffect(() => {
    for (let index = 0; index < FRAME_COUNT; index += 1) {
      const image = new Image();
      image.src = frameSource(index);
    }

    const updateFrame = () => {
      animationFrameRef.current = null;
      const stage = stageRef.current;
      if (!stage) return;

      const rect = stage.getBoundingClientRect();
      const scrollableDistance = stage.offsetHeight - window.innerHeight;
      const progress = Math.min(
        1,
        Math.max(0, -rect.top / Math.max(scrollableDistance, 1)),
      );
      const nextFrame =
        FRAME_COUNT - 1 - Math.round(progress * (FRAME_COUNT - 1));
      setFrame((current) => (current === nextFrame ? current : nextFrame));
    };

    const onScroll = () => {
      if (animationFrameRef.current === null) {
        animationFrameRef.current = window.requestAnimationFrame(updateFrame);
      }
    };

    updateFrame();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);

    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      if (animationFrameRef.current !== null) {
        window.cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, []);

  return (
    <main>
      <section ref={stageRef} className="scroll-stage" aria-label="Tulip transformation">
        <div className="sticky-scene">
          <img
            className="hero-flower"
            src={frameSource(frame)}
            width="1086"
            height="1448"
            alt="A yellow tulip resolving from a mosaic glitch into a clear flower as the page scrolls"
            draggable="false"
          />
          <p className="sr-only" aria-live="polite">
            Animation frame {FRAME_COUNT - frame} of {FRAME_COUNT}
          </p>
        </div>
      </section>
    </main>
  );
}
