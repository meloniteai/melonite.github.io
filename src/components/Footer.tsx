import { DiscordIcon } from "./DiscordIcon";

const FOOTER_LINKS = [
  { label: "About", href: "#about", icon: false },
  { label: "Discord", href: "https://discord.gg/88PSuaRNk", icon: true },
  { label: "X", href: "https://x.com/meloniteai", icon: false },
] as const;

export function Footer() {
  return (
    <footer className="site-footer">
      {FOOTER_LINKS.map((link) => (
        <a
          className={link.icon ? "discord-link" : undefined}
          key={link.label}
          href={link.href}
          rel={link.icon ? "noopener noreferrer" : undefined}
          target={link.icon ? "_blank" : undefined}
        >
          {link.icon ? <DiscordIcon className="discord-icon-footer" /> : null}
          {link.label}
        </a>
      ))}
      <span>© 2026 Melonite</span>
    </footer>
  );
}
