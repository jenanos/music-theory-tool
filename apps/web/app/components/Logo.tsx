import { useId } from "react";

type LogoProps = {
  className?: string;
  size?: number;
  title?: string;
};

export function Logo({ className, size = 24, title = "Blekke" }: LogoProps) {
  const gradientId = useId();
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 256 256"
      width={size}
      height={size}
      fill="none"
      role="img"
      aria-label={title}
      className={className}
    >
      <defs>
        <linearGradient
          id={gradientId}
          x1="128"
          y1="16"
          x2="128"
          y2="244"
          gradientUnits="userSpaceOnUse"
        >
          <stop offset="0" stopColor="#ef4444" />
          <stop offset="0.22" stopColor="#f97316" />
          <stop offset="0.42" stopColor="#facc15" />
          <stop offset="0.62" stopColor="#22c55e" />
          <stop offset="0.85" stopColor="#3b82f6" />
          <stop offset="1" stopColor="#a855f7" />
        </linearGradient>
      </defs>
      <g
        stroke={`url(#${gradientId})`}
        strokeWidth="12"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M 152 28 C 172 30 184 48 176 64 C 170 76 158 80 148 72" />
        <path d="M 152 28 L 152 206 C 152 226 134 238 116 230 C 102 224 100 212 110 206" />
        <path d="M 152 82 C 200 92 216 140 200 178 C 184 216 132 234 92 216 C 56 200 44 158 64 124 C 84 92 130 92 146 122 C 160 150 146 178 124 174 C 108 172 100 156 114 146" />
      </g>
      <circle cx="110" cy="226" r="10" fill={`url(#${gradientId})`} />
    </svg>
  );
}
