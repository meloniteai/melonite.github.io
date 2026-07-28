import { DiscordIcon } from "./DiscordIcon";
import { GitHubIcon } from "./GitHubIcon";

const FOOTER_LINKS = [
  { label: "About", href: "#about", external: false, icon: null },
  {
    label: "Discord",
    href: "https://discord.gg/88PSuaRNk",
    external: true,
    icon: "/figma/lp-new-light/discord.svg",
  },
  {
    label: "GitHub",
    href: "https://github.com/meloniteai",
    external: true,
    icon: "/figma/lp-new-light/github.svg",
  },
  {
    label: "X",
    href: "https://x.com/meloniteai",
    external: true,
    icon: null,
  },
] as const;

export function Footer() {
  return (
    <footer className="site-footer">
      <div className="footer-top">
        <a className="footer-home" href="#" aria-label="Melonite home">
          <img
            src="/figma/lp-new-light/footer-logo.svg"
            width="60"
            height="51"
            alt=""
          />
          <span>Melonite</span>
        </a>
        <nav className="footer-links" aria-label="Footer">
          {FOOTER_LINKS.map((link) => (
            <a
              key={link.label}
              href={link.href}
              rel={link.external ? "noopener noreferrer" : undefined}
              target={link.external ? "_blank" : undefined}
            >
              {link.icon === "/figma/lp-new-light/discord.svg" ? (
                <DiscordIcon className="footer-link-icon" />
              ) : link.icon === "/figma/lp-new-light/github.svg" ? (
                <GitHubIcon className="footer-link-icon" />
              ) : null}
              {link.label}
            </a>
          ))}
          <span>© 2026 Melonite</span>
        </nav>
      </div>
      <div className="footer-divider" aria-hidden="true" />
      <p>© 2026 Melonite <span aria-hidden="true">•</span> Closed beta</p>
    </footer>
  );
}
