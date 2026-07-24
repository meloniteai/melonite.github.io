import { useState } from "react";

export function ClosedBetaBanner() {
  const [isVisible, setIsVisible] = useState(true);

  if (!isVisible) return null;

  return (
    <aside className="closed-beta-banner" aria-label="Closed beta announcement">
      <p>Closed beta, taking invite requests!</p>
      <a href="https://app.melonite.ai/login">Join</a>
      <button
        type="button"
        aria-label="Dismiss closed beta announcement"
        onClick={() => setIsVisible(false)}
      >
        <span aria-hidden="true">✕</span>
      </button>
    </aside>
  );
}
