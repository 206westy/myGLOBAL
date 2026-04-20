'use client';

interface MyGlobalMarkProps {
  size?: number;
}

export function MyGlobalMark({ size = 24 }: MyGlobalMarkProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      fill="none"
      aria-hidden="true"
      className="shrink-0"
    >
      <rect width="32" height="32" rx="8" fill="#5F3ADD" />
      <rect x="7" y="7" width="8" height="8" rx="1.5" fill="white" />
      <rect x="17" y="7" width="8" height="8" rx="1.5" fill="rgba(255,255,255,0.5)" />
      <rect x="7" y="17" width="8" height="8" rx="1.5" fill="rgba(255,255,255,0.5)" />
      <rect x="17" y="17" width="8" height="8" rx="1.5" fill="white" />
    </svg>
  );
}
