interface GitHubIconProps {
  className?: string;
}

export function GitHubIcon({ className = "" }: GitHubIconProps) {
  return (
    <span
      className={`github-icon ${className}`.trim()}
      aria-hidden="true"
    />
  );
}
