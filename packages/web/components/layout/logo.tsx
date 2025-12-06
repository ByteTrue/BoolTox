export function Logo({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 32 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* 简约的工具箱图标 */}
      <rect
        x="4"
        y="8"
        width="24"
        height="20"
        rx="3"
        className="fill-primary-500"
      />
      <rect
        x="12"
        y="4"
        width="8"
        height="4"
        rx="1"
        className="fill-primary-600"
      />
      <circle cx="10" cy="18" r="1.5" className="fill-white" />
      <circle cx="16" cy="18" r="1.5" className="fill-white" />
      <circle cx="22" cy="18" r="1.5" className="fill-white" />
    </svg>
  );
}
