"use client";

interface LogoProps {
  size?: number;
}

export const Logo = ({ size = 28 }: LogoProps) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 512 512"
    height={size}
    width={size}
  >
    <rect fill="#1B1B1B" rx="128" height="512" width="512" />

    <g
      fill="none"
      strokeLinejoin="round"
      strokeLinecap="round"
      strokeWidth="24"
      stroke="#F0EFEB"
    >
      <path d="M160 140 L352 140 L352 372 L160 372 L160 140 M352 140 Q380 110 380 140" />

      <path stroke="#F0EFEB" d="M120 240 L320 320" />
      <path stroke="#90E0EF" d="M320 320 L380 360" />

      <path
        strokeWidth="28"
        stroke="#90E0EF"
        d="M380 360 Q410 370 400 390 Q390 410 420 405"
      />
    </g>

    <circle opacity="0.8" fill="#90E0EF" r="12" cy="360" cx="380" />
  </svg>
);
