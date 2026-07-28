import { InstallCommand } from "./InstallCommand";

export function InstallSection() {
  return (
    <header className="install-canvas">
      <h2 id="install-title">Download for MacOS, Windows or Linux</h2>
      <InstallCommand />
      <p className="install-details">
        FREE <span aria-hidden="true">•</span> USE YOUR EXISTING SUBSCRIPTIONS{" "}
        <span aria-hidden="true">•</span> OPEN SOURCE (MIT)
      </p>
    </header>
  );
}
