const COMMUNITY_LINKS = [
  {
    label: "GitHub",
    href: "https://github.com/meloniteai",
    icon: "/figma/lp-new-light/github.svg",
  },
  {
    label: "Discord",
    href: "https://discord.gg/88PSuaRNk",
    icon: "/figma/lp-new-light/discord.svg",
  },
] as const;

export function NetPositiveSection() {
  return (
    <section
      id="about"
      className="net-positive-section"
      aria-labelledby="net-positive-title"
    >
      <div className="net-positive-content">
        <h2 id="net-positive-title">
          Turn net-negative into net-positive
        </h2>
        <p>
          Open source, MIT licensed, and designed to work with your existing
          subscriptions. Don’t want to use our app? You can build your own
          custom agent using our durable ACP and Session Lifecycle OSS work.
        </p>
        <div className="community-links">
          {COMMUNITY_LINKS.map((link) => (
            <a
              key={link.label}
              href={link.href}
              rel="noopener noreferrer"
              target="_blank"
            >
              <img src={link.icon} width="24" height="24" alt="" />
              <span>{link.label}</span>
            </a>
          ))}
        </div>
      </div>
    </section>
  );
}
