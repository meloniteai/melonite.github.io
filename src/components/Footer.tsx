const FOOTER_LINKS = [
  { label: "About", href: "#about", external: false },
  {
    label: "Discord",
    href: "https://discord.gg/88PSuaRNk",
    external: true,
  },
  { label: "X", href: "https://x.com/meloniteai", external: true },
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
