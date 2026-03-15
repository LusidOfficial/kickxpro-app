/* ──────────────────────────────────────────────
   RADAR CHART (Light Theme + Animated)
   Pure SVG chart with entrance animation and
   light mode contrast styling.
   ────────────────────────────────────────────── */
"use client";
import { useEffect, useState } from "react";

interface RadarChartProps {
  data: { label: string; value: number }[];
  size?: number;
  fillColor?: string;
  strokeColor?: string;
}

export default function RadarChart({
  data,
  size = 280,
  fillColor = "rgba(16, 185, 129, 0.15)", // Tailwind Emerald 500 alpha
  strokeColor = "#10B981",
}: RadarChartProps) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const center = size / 2;
  const maxRadius = size * 0.38;
  const levels = 5;
  const angleStep = (2 * Math.PI) / data.length;

  function polarToCartesian(angle: number, radius: number) {
    const a = angle - Math.PI / 2;
    return {
      x: center + radius * Math.cos(a),
      y: center + radius * Math.sin(a),
    };
  }

  function levelPolygon(level: number): string {
    const r = (level / levels) * maxRadius;
    return data.map((_, i) => {
      const p = polarToCartesian(i * angleStep, r);
      return `${p.x},${p.y}`;
    }).join(" ");
  }

  // Animate from center (0 radius) to actual values
  const dataPolygon = data.map((d, i) => {
    const r = mounted ? (d.value / levels) * maxRadius : 0;
    const p = polarToCartesian(i * angleStep, r);
    return `${p.x},${p.y}`;
  }).join(" ");

  return (
    <div className="flex items-center justify-center relative">
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        {/* Background levels */}
        {Array.from({ length: levels }, (_, i) => (
          <polygon
            key={`level-${i}`}
            points={levelPolygon(i + 1)}
            fill="none"
            stroke="var(--color-border-hover)"
            strokeWidth="1"
            strokeDasharray={i === levels - 1 ? "0" : "4 4"}
          />
        ))}

        {/* Axis lines */}
        {data.map((_, i) => {
          const p = polarToCartesian(i * angleStep, maxRadius);
          return (
            <line
              key={`axis-${i}`}
              x1={center}
              y1={center}
              x2={p.x}
              y2={p.y}
              stroke="var(--color-border)"
              strokeWidth="1"
            />
          );
        })}

        {/* Data polygon */}
        <polygon
          points={dataPolygon}
          fill={fillColor}
          stroke={strokeColor}
          strokeWidth="2.5"
          className="transition-all duration-1000 ease-out"
          style={{ filter: `drop-shadow(0 4px 12px ${fillColor})` }}
        />

        {/* Data points */}
        {data.map((d, i) => {
          const r = mounted ? (d.value / levels) * maxRadius : 0;
          const p = polarToCartesian(i * angleStep, r);
          return (
            <circle
              key={`point-${i}`}
              cx={p.x}
              cy={p.y}
              r="4.5"
              fill="#FFFFFF"
              stroke={strokeColor}
              strokeWidth="2.5"
              className="transition-all duration-1000 ease-out hover:r-[6px] cursor-pointer"
            >
               <title>{`${d.label}: ${d.value}`}</title>
            </circle>
          );
        })}

        {/* Labels */}
        {data.map((d, i) => {
          const labelRadius = maxRadius + 26;
          const p = polarToCartesian(i * angleStep, labelRadius);
          return (
            <text
              key={`label-${i}`}
              x={p.x}
              y={p.y}
              textAnchor="middle"
              dominantBaseline="middle"
              fill="var(--color-text-muted)"
              fontSize="10"
              fontWeight="600"
              fontFamily="var(--font-heading)"
              letterSpacing="0.05em"
              className="opacity-0 animate-fade-up"
              style={{ animationDelay: `${0.3 + i * 0.1}s` }}
            >
              {d.label}
            </text>
          );
        })}

        {/* Center score ring background hack */}
        <circle cx={center} cy={center} r="28" fill="#FFFFFF" fillOpacity="0.8" filter="blur(4px)" />
        
        {/* Center score */}
        {(() => {
          const avg = data.reduce((s, d) => s + d.value, 0) / data.length;
          return (
            <>
              <text
                x={center}
                y={center - 4}
                textAnchor="middle"
                dominantBaseline="middle"
                fill="var(--color-text)"
                fontSize="24"
                fontWeight="800"
                fontFamily="var(--font-heading)"
              >
                {avg.toFixed(1)}
              </text>
              <text
                x={center}
                y={center + 14}
                textAnchor="middle"
                dominantBaseline="middle"
                fill="var(--color-text-muted)"
                fontSize="10"
                fontWeight="600"
                fontFamily="var(--font-heading)"
              >
                / 5.0
              </text>
            </>
          );
        })()}
      </svg>
    </div>
  );
}
