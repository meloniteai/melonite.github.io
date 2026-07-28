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
          Move fast with Coding Agents, but write code that is actually
          maintainable. Don’t want to use our app? build your own Agent using
          our Durable ACP and Session Lifecycle SDKs.
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
