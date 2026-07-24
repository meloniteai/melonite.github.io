import { DiscordIcon } from "./DiscordIcon";

const NAV_ITEMS = [
  { label: "Join", href: "#download", icon: false },
  { label: "About", href: "#about", icon: false },
  { label: "Discord", href: "#discord", icon: true },
] as const;

export function FloatingNav() {
  return (
    <nav className="floating-nav" aria-label="Primary navigation">
      {NAV_ITEMS.map((item) => (
        <a
          className={item.icon ? "discord-link" : undefined}
          key={item.label}
          href={item.href}
        >
          {item.icon ? <DiscordIcon className="discord-icon-nav" /> : null}
          {item.label}
        </a>
      ))}
    </nav>
  );
}
