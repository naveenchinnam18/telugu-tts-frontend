// Small app logo (same waveform design as the app icon)
export default function Logo({ size = 36 }) {
  const bars = [14, 27, 40, 27, 14]; // heights in a 64x64 box
  return (
    <svg className="logo" width={size} height={size} viewBox="0 0 64 64" role="img" aria-label="Telugu Voice Studio">
      <defs>
        <linearGradient id="logoGrad" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#8b5cf6" />
          <stop offset="1" stopColor="#22d3ee" />
        </linearGradient>
      </defs>
      <rect width="64" height="64" rx="15" fill="url(#logoGrad)" />
      {bars.map((h, i) => (
        <rect key={i} x={10.5 + i * 9.5} y={(64 - h) / 2} width="5" height={h} rx="2.5" fill="#fff" />
      ))}
    </svg>
  );
}
