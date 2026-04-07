export default function WaffleIcon({ className = "", size = 24 }: { className?: string; size?: number }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 64 64"
      width={size}
      height={size}
      fill="none"
      stroke="currentColor"
      strokeWidth="3"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      {/* Waffle outline - rounded rectangle */}
      <rect x="6" y="6" width="52" height="52" rx="12" ry="12" />
      {/* Bubble pattern - 3x3 grid of circles (hong kong egg waffle bubbles) */}
      <circle cx="18" cy="18" r="5" />
      <circle cx="32" cy="18" r="5" />
      <circle cx="46" cy="18" r="5" />
      <circle cx="18" cy="32" r="5" />
      <circle cx="32" cy="32" r="5" />
      <circle cx="46" cy="32" r="5" />
      <circle cx="18" cy="46" r="5" />
      <circle cx="32" cy="46" r="5" />
      <circle cx="46" cy="46" r="5" />
    </svg>
  );
}
