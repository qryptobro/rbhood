"use client";
import { useId } from "react";

// Area-спарклайн с градиентной заливкой (как в референс-дизайне)
export default function Sparkline({
  data,
  color = "#02B365",
  height = 90,
}: {
  data: number[];
  color?: string;
  height?: number;
}) {
  const id = useId().replace(/:/g, "");
  if (!data || data.length < 2) {
    return <div style={{ height }} />;
  }

  const W = 100;
  const H = 100;
  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;
  const step = W / (data.length - 1);

  const pts = data.map((v, i) => {
    const x = i * step;
    const y = H - ((v - min) / range) * (H * 0.8) - H * 0.1; // отступ сверху/снизу
    return [x, y];
  });

  const line = pts.map(([x, y], i) => `${i === 0 ? "M" : "L"}${x.toFixed(2)},${y.toFixed(2)}`).join(" ");
  const area = `${line} L${W},${H} L0,${H} Z`;

  return (
    <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" style={{ width: "100%", height, display: "block" }}>
      <defs>
        <linearGradient id={`grad-${id}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.45" />
          <stop offset="100%" stopColor={color} stopOpacity="0.02" />
        </linearGradient>
      </defs>
      <path d={area} fill={`url(#grad-${id})`} />
      <path d={line} fill="none" stroke={color} strokeWidth="1.5" vectorEffect="non-scaling-stroke" />
    </svg>
  );
}
