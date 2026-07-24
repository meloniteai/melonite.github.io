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
        Melonite fixes the B4D behavioral patterns of coding agents, and allows
        you to build much faster without compromising quality
      </p>
      <div className="invite-cta">
        <InviteGridHalo />
        <a className="invite-button" href="#download">
          Request invite
        </a>
      </div>
    </div>
  );
}
