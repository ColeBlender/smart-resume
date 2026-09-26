export function ScoreRing({ value, label }: { value: number; label?: string }) {
  const r = 26;
  const circumference = 2 * Math.PI * r;
  const color = value >= 75 ? "var(--accent)" : value >= 50 ? "var(--warn)" : "var(--bad)";

  return (
    <div className="flex flex-col items-center">
      <svg width="68" height="68" viewBox="0 0 68 68" role="img" aria-label={`${value} out of 100`}>
        <circle cx="34" cy="34" r={r} fill="none" stroke="var(--line)" strokeWidth="6" />
        <circle
          cx="34"
          cy="34"
          r={r}
          fill="none"
          stroke={color}
          strokeWidth="6"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={circumference * (1 - value / 100)}
          transform="rotate(-90 34 34)"
        />
        <text x="34" y="39" textAnchor="middle" fontSize="16" fontWeight="600" fill="var(--ink)">
          {value}
        </text>
      </svg>
      {label && <span className="mt-1 text-xs text-muted">{label}</span>}
    </div>
  );
}
