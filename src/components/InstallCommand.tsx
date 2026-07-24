import { useEffect, useRef, useState } from "react";

export const INSTALL_COMMAND =
  "curl -fsSL https://github.com/meloniteai/melonite-desktop/releases/latest/download/install.sh | sh";

export function InstallCommand() {
  const [copied, setCopied] = useState(false);
  const resetTimer = useRef<number | undefined>(undefined);

  useEffect(() => () => window.clearTimeout(resetTimer.current), []);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(INSTALL_COMMAND);
      setCopied(true);
      window.clearTimeout(resetTimer.current);
      resetTimer.current = window.setTimeout(() => setCopied(false), 1600);
    } catch {
      setCopied(false);
    }
  };

  return (
    <div id="download" className="install-command-frame">
      <code tabIndex={0}>{INSTALL_COMMAND}</code>
      <button type="button" onClick={copy} aria-label={copied ? "Install command copied" : "Copy install command"}>
        {copied ? "Copied" : "Copy"}
      </button>
      <span className="sr-only" aria-live="polite">
        {copied ? "Install command copied to clipboard." : ""}
      </span>
    </div>
  );
}
