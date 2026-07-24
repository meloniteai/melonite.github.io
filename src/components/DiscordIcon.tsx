interface DiscordIconProps {
  className?: string;
}

export function DiscordIcon({ className = "" }: DiscordIconProps) {
  return (
    <img
      className={`discord-icon ${className}`.trim()}
      src="/figma/updated/discord.png"
      alt=""
      aria-hidden="true"
    />
  );
}
