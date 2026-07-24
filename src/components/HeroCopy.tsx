import { InviteGridHalo } from "./GridHalos";

export function HeroCopy() {
  return (
    <div className="hero-copy" data-figma-node="283:11529">
      <h1 id="hero-title">
        At the exact delta between
        <br />
        frontier coding
        <br />
        and perfect execution
      </h1>
      <p>
        Melonite fixes the{" "}
        <span className="hero-emphasis hero-emphasis-bad">bad</span> behavioral
        patterns of coding agents, allowing you to{" "}
        <span className="hero-emphasis hero-emphasis-build">build</span> much
        faster without compromising quality
      </p>
      <div className="invite-cta">
        <InviteGridHalo />
        <a className="invite-button" href="https://app.melonite.ai/login">
          Request Invite
        </a>
      </div>
    </div>
  );
}
