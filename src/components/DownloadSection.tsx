const OPERATING_SYSTEMS = [
  {
    label: "Windows",
    icon: "/figma/lp-new-light/windows.svg",
  },
  {
    label: "macOS",
    icon: "/figma/lp-new-light/apple.svg",
  },
  {
    label: "Ubuntu",
    icon: "/figma/lp-new-light/ubuntu.svg",
  },
] as const;

export function DownloadSection() {
  return (
    <section className="download-section" aria-labelledby="get-started-title">
      <div className="download-content">
        <h2 id="get-started-title">Get started</h2>
        <p>
          Install on macOS, Windows, or Linux. Open source (MIT)
          <br />
          and free to use with your existing subscriptions.
        </p>
        <div className="os-icons" aria-label="Available operating systems">
          {OPERATING_SYSTEMS.map((system) => (
            <img
              key={system.label}
              src={system.icon}
              width="24"
              height="24"
              alt={system.label}
            />
          ))}
        </div>
      </div>
      <a className="download-invite-button" href="https://app.melonite.ai/login">
        Request Invite
      </a>
    </section>
  );
}
