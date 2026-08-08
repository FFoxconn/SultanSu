export function LogoMark({ size = 30 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path
        d="M16 3C16 3 6 15.2 6 21.2C6 26.8 10.5 30 16 30C21.5 30 26 26.8 26 21.2C26 15.2 16 3 16 3Z"
        fill="url(#logoDropGradient)"
      />
      <path
        d="M11 22C11 24.2 13 26 16 26"
        stroke="rgba(255,255,255,0.75)"
        strokeWidth="2"
        strokeLinecap="round"
        fill="none"
      />
      <defs>
        <linearGradient id="logoDropGradient" x1="6" y1="3" x2="26" y2="30" gradientUnits="userSpaceOnUse">
          <stop stopColor="#4fc3f7" />
          <stop offset="1" stopColor="#1d6fd6" />
        </linearGradient>
      </defs>
    </svg>
  );
}
