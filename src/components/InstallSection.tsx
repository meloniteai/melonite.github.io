import { useLayoutEffect, useRef } from "react";
import { InstallCommand } from "./InstallCommand";

export function InstallSection() {
  const sectionRef = useRef<HTMLElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    const section = sectionRef.current;
    const content = contentRef.current;
    const invite = document.querySelector<HTMLElement>(".invite-button");
    const featureToc = document.querySelector<HTMLElement>(".feature-toc");

    if (!section || !content || !invite || !featureToc) return;

    let animationFrame: number | null = null;

    const updateSpacing = () => {
      animationFrame = null;
      const inviteRect = invite.getBoundingClientRect();
      const featureTocRect = featureToc.getBoundingClientRect();
      const contentRect = content.getBoundingClientRect();
      const currentShift =
        Number.parseFloat(
          getComputedStyle(section).getPropertyValue(
            "--install-content-shift",
          ),
        ) || 0;
      const targetCenter =
        (inviteRect.bottom + featureTocRect.top) / 2;
      const contentCenter = (contentRect.top + contentRect.bottom) / 2;
      const nextShift = currentShift + targetCenter - contentCenter;

      section.style.setProperty(
        "--install-content-shift",
        `${nextShift.toFixed(3)}px`,
      );
    };

    const requestUpdate = () => {
      if (animationFrame === null) {
        animationFrame = window.requestAnimationFrame(updateSpacing);
      }
    };

    const resizeObserver = new ResizeObserver(requestUpdate);
    resizeObserver.observe(invite);
    resizeObserver.observe(content);
    resizeObserver.observe(featureToc);
    window.addEventListener("resize", requestUpdate);
    void document.fonts.ready.then(requestUpdate);
    updateSpacing();

    return () => {
      resizeObserver.disconnect();
      window.removeEventListener("resize", requestUpdate);
      if (animationFrame !== null) {
        window.cancelAnimationFrame(animationFrame);
      }
      section.style.removeProperty("--install-content-shift");
    };
  }, []);

  return (
    <section
      ref={sectionRef}
      id="install"
      className="install-section"
      aria-labelledby="install-title"
    >
      <div className="install-canvas">
        <div ref={contentRef} className="install-content">
          <h2 id="install-title">Download for MacOS, Windows or Linux</h2>
          <InstallCommand />
          <p className="install-details">
            FREE <span aria-hidden="true">•</span> USE YOUR EXISTING SUBSCRIPTIONS{" "}
            <span aria-hidden="true">•</span> OPEN SOURCE (MIT)
          </p>
        </div>
      </div>
    </section>
  );
}
