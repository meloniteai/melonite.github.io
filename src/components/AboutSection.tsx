import { InstallCommand } from "./InstallCommand";

export function AboutSection() {
  return (
    <section id="about" className="about-section" aria-labelledby="about-title">
      <div className="about-canvas">
        <div className="about-copy">
          <h2 id="about-title">
            It&apos;s time you brought a third
            <br className="desktop-break" /> member into the discussion
          </h2>
          <p>
            Melonite curates the verification criteria of your tasks, and iteratively makes sure the coding
            <br className="desktop-break" />
            agent follows them to perfection. Let Melonite talk with your coding agent for you.
          </p>
        </div>
        <InstallCommand />
      </div>
    </section>
  );
}
