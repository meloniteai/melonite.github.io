interface DiscordIconProps {
  className?: string;
}

export function DiscordIcon({ className = "" }: DiscordIconProps) {
  return (
    <span
      className={`discord-icon ${className}`.trim()}
      aria-hidden="true"
    />
  );
}
