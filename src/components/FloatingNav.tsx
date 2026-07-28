const NAV_ITEMS = [
  { label: "Join", href: "https://app.melonite.ai/login", external: false },
  { label: "About", href: "#about", external: false },
  { label: "Discord", href: "https://discord.gg/88PSuaRNk", external: true },
] as const;

export function FloatingNav() {
  return (
    <nav className="floating-nav" aria-label="Primary navigation">
      {NAV_ITEMS.map((item) => (
        <a
          key={item.label}
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
