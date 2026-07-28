import { InstallCommand } from "./InstallCommand";

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

export function InstallSection() {
  return (
    <header className="install-canvas">
      <div
        className="install-os-icons"
        aria-label="Available operating systems"
      >
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
      <h2 id="install-title">Download for MacOS, Windows or Linux</h2>
      <InstallCommand />
      <p className="install-details">
        FREE <span aria-hidden="true">•</span> USE YOUR EXISTING SUBSCRIPTIONS{" "}
        <span aria-hidden="true">•</span> OPEN SOURCE (MIT)
      </p>
    </header>
  );
}
