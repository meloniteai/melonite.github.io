import { DiscordIcon } from "./DiscordIcon";

const NAV_ITEMS = [
  { label: "Join", href: "https://app.melonite.ai/login", icon: false },
  { label: "About", href: "#about", icon: false },
  { label: "Discord", href: "https://discord.gg/88PSuaRNk", icon: true },
] as const;

export function FloatingNav() {
  return (
    <nav className="floating-nav" aria-label="Primary navigation">
      {NAV_ITEMS.map((item) => (
        <a
          className={item.icon ? "discord-link" : undefined}
          key={item.label}
          href={item.href}
          rel={item.icon ? "noopener noreferrer" : undefined}
          target={item.icon ? "_blank" : undefined}
        >
          {item.icon ? <DiscordIcon className="discord-icon-nav" /> : null}
          {item.label}
        </a>
      ))}
    </nav>
  );
}
