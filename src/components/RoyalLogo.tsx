type Props = {
  size?: number;
  className?: string;
  title?: string;
};

/**
 * Royal Sweets crown mark — inline SVG redraw of the brand crown
 * (lotus / fan crown sitting on a tray, with a central diamond finial).
 * Inherits color from `currentColor` so it can be tinted gold, charcoal
 * or cream depending on context.
 */
export function RoyalLogo({ size = 28, className, title = "Royal Sweets" }: Props) {
  return (
    <svg
      viewBox="0 0 120 120"
      width={size}
      height={size}
      className={className}
      fill="none"
      stroke="currentColor"
      strokeWidth="6"
      strokeLinejoin="round"
      strokeLinecap="round"
      role="img"
      aria-label={title}
    >
      {/* Outer petals (left + right) */}
      <path d="M14 88 C 22 50, 38 36, 60 30 C 82 36, 98 50, 106 88 Z" />
      {/* Inner petals forming V */}
      <path d="M36 88 C 42 60, 50 50, 60 46 C 70 50, 78 60, 84 88 Z" />
      {/* Central flame / finial */}
      <path d="M60 8 C 66 18, 70 26, 60 38 C 50 26, 54 18, 60 8 Z" />
      {/* Diamond accent in flame */}
      <path d="M60 18 L 64 24 L 60 30 L 56 24 Z" />
      {/* Tray / base */}
      <path d="M22 92 L 98 92 L 92 104 L 28 104 Z" fill="currentColor" stroke="none" />
    </svg>
  );
}
