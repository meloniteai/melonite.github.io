import { type RefObject, useLayoutEffect, useRef } from "react";

const NAV_ITEMS = [
  {
    id: "join",
    label: "Join",
    href: "https://app.melonite.ai/login",
    external: false,
  },
  {
    id: "melonite",
    label: "Melonite",
    href: "#about",
    external: false,
  },
  {
    id: "discord",
    label: "Discord",
    href: "https://discord.gg/88PSuaRNk",
    external: true,
  },
] as const;

const MORPH_DISTANCE = 112;

function smoothstep(start: number, end: number, value: number) {
  const progress = Math.min(
    1,
    Math.max(0, (value - start) / (end - start)),
  );
  return progress * progress * (3 - 2 * progress);
}

function useFloatingNavMorph(
  navRef: RefObject<HTMLElement | null>,
  enabled: boolean,
) {
  useLayoutEffect(() => {
    const nav = navRef.current;
    if (!nav) return;

    if (!enabled) {
      nav.dataset.navState = "compact";
      nav.style.setProperty("--nav-join-x", "0px");
      nav.style.setProperty("--nav-melonite-x", "0px");
      nav.style.setProperty("--nav-discord-x", "0px");
      nav.style.setProperty("--nav-link-color", "rgb(253 252 248)");
      nav.style.setProperty("--nav-shell-opacity", "1");
      nav.style.setProperty("--nav-shell-scale", "1");
      nav.style.setProperty("--nav-shell-x", "0px");
      return;
    }

    const join = nav.querySelector<HTMLAnchorElement>(
      '[data-nav-item="join"]',
    );
    const melonite = nav.querySelector<HTMLAnchorElement>(
      '[data-nav-item="melonite"]',
    );
    const discord = nav.querySelector<HTMLAnchorElement>(
      '[data-nav-item="discord"]',
    );
    if (!join || !melonite || !discord) return;

    const reducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    );
    let animationFrame = 0;
    let joinOffset = 0;
    let meloniteOffset = 0;
    let discordOffset = 0;
    let shellPadding = 0;

    const render = () => {
      animationFrame = 0;
      const rawProgress = Math.min(
        1,
        Math.max(0, window.scrollY / MORPH_DISTANCE),
      );
      const progress = reducedMotion.matches
        ? window.scrollY > 0
          ? 1
          : 0
        : rawProgress;
      const openProgress = 1 - progress;
      const shellOpacity = smoothstep(0.68, 0.9, progress);
      const colorProgress = smoothstep(0.2, 0.68, shellOpacity);
      const color = [60, 60, 60].map((channel, index) => {
        const target = [253, 252, 248][index];
        return Math.round(channel + (target - channel) * colorProgress);
      });
      const joinX = joinOffset * openProgress;
      const meloniteX = meloniteOffset * openProgress;
      const discordX = discordOffset * openProgress;
      const shellLeft =
        Math.min(
          join.offsetLeft + joinX,
          melonite.offsetLeft + meloniteX,
          discord.offsetLeft + discordX,
        ) - shellPadding;
      const shellRight =
        Math.max(
          join.offsetLeft + joinX + join.offsetWidth,
          melonite.offsetLeft + meloniteX + melonite.offsetWidth,
          discord.offsetLeft + discordX + discord.offsetWidth,
        ) + shellPadding;
      const shellWidth = shellRight - shellLeft;
      const shellCenterOffset =
        shellLeft + shellWidth / 2 - nav.offsetWidth / 2;

      nav.style.setProperty(
        "--nav-join-x",
        `${joinX.toFixed(2)}px`,
      );
      nav.style.setProperty(
        "--nav-melonite-x",
        `${meloniteX.toFixed(2)}px`,
      );
      nav.style.setProperty(
        "--nav-discord-x",
        `${discordX.toFixed(2)}px`,
      );
      nav.style.setProperty(
        "--nav-link-color",
        `rgb(${color.join(" ")})`,
      );
      nav.style.setProperty(
        "--nav-shell-opacity",
        shellOpacity.toFixed(4),
      );
      nav.style.setProperty(
        "--nav-shell-scale",
        (shellWidth / nav.offsetWidth).toFixed(4),
      );
      nav.style.setProperty(
        "--nav-shell-x",
        `${shellCenterOffset.toFixed(2)}px`,
      );
      nav.dataset.navState =
        progress === 0
          ? "decomposed"
          : progress === 1
            ? "compact"
            : "connecting";
    };

    const measure = () => {
      const navBounds = nav.getBoundingClientRect();
      const brandBounds = document
        .querySelector<HTMLElement>(".brand-mark")
        ?.getBoundingClientRect();
      const mobile = window.innerWidth <= 800;
      const pageInset = mobile ? 18 : 36;
      const leftGap = mobile ? 14 : 24;
      const itemGap = mobile ? 16 : 28;
      shellPadding = Number.parseFloat(
        window.getComputedStyle(nav).paddingLeft,
      );
      const joinStart =
        (brandBounds?.right ?? pageInset + (mobile ? 48 : 60)) + leftGap;
      const meloniteStart = joinStart + join.offsetWidth + itemGap;
      const discordStart =
        window.innerWidth - pageInset - discord.offsetWidth;

      joinOffset = joinStart - (navBounds.left + join.offsetLeft);
      meloniteOffset =
        meloniteStart - (navBounds.left + melonite.offsetLeft);
      discordOffset =
        discordStart - (navBounds.left + discord.offsetLeft);
      render();
    };

    const queueRender = () => {
      if (!animationFrame) {
        animationFrame = window.requestAnimationFrame(render);
      }
    };

    const handleResize = () => {
      if (animationFrame) window.cancelAnimationFrame(animationFrame);
      animationFrame = window.requestAnimationFrame(measure);
    };

    measure();
    window.addEventListener("scroll", queueRender, { passive: true });
    window.addEventListener("resize", handleResize, { passive: true });
    reducedMotion.addEventListener("change", measure);

    return () => {
      if (animationFrame) window.cancelAnimationFrame(animationFrame);
      window.removeEventListener("scroll", queueRender);
      window.removeEventListener("resize", handleResize);
      reducedMotion.removeEventListener("change", measure);
    };
  }, [enabled, navRef]);
}

interface FloatingNavProps {
  morphOnScroll?: boolean;
}

export function FloatingNav({ morphOnScroll = true }: FloatingNavProps) {
  const navRef = useRef<HTMLElement>(null);
  useFloatingNavMorph(navRef, morphOnScroll);

  return (
    <nav
      ref={navRef}
      className="floating-nav"
      aria-label="Primary navigation"
      data-nav-state={morphOnScroll ? "decomposed" : "compact"}
    >
      {NAV_ITEMS.map((item) => (
        <a
          key={item.id}
          className={`floating-nav-item floating-nav-item-${item.id}`}
          data-nav-item={item.id}
          href={item.href}
          rel={item.external ? "noopener noreferrer" : undefined}
          target={item.external ? "_blank" : undefined}
        >
          {item.label}
        </a>
      ))}
    </nav>
  );
}
