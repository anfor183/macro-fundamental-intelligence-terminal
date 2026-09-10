import React, { useState } from 'react';

export interface RadarMetric {
  dimension: string;
  current: number; // -100 to +100
  previous: number; // -100 to +100
  category?: string;
}

interface MacroRadarChartProps {
  metrics?: RadarMetric[];
  title?: string;
  height?: number;
  width?: number;
}

const DEFAULT_METRICS: RadarMetric[] = [
  { dimension: 'Monetary Policy', current: 65, previous: 45 },
  { dimension: 'Inflation', current: 30, previous: 40 },
  { dimension: 'Growth', current: 55, previous: 50 },
  { dimension: 'Labor Market', current: 70, previous: 75 },
  { dimension: 'Fiscal Health', current: -20, previous: -15 },
  { dimension: 'Trade Balance', current: 15, previous: 10 },
  { dimension: 'Risk Sentiment', current: 40, previous: 20 },
  { dimension: 'Yield Differentials', current: 60, previous: 50 },
  { dimension: 'Commodities', current: -10, previous: 5 },
  { dimension: 'Geopolitics', current: -35, previous: -30 },
];

export const MacroRadarChart: React.FC<MacroRadarChartProps> = ({
  metrics = DEFAULT_METRICS,
  title = 'Macro Factor Footprint Radar',
  height = 360,
  width = 440,
}) => {
  const [activeBaseline, setActiveBaseline] = useState<'week' | 'month'>('week');
  const [hoveredMetric, setHoveredMetric] = useState<RadarMetric | null>(null);

  // Geometric layout
  const centerX = width / 2;
  const centerY = height / 2 + 10;
  const radius = Math.min(centerX, centerY) - 55;
  const totalVertices = metrics.length;
  const angleStep = (Math.PI * 2) / totalVertices;

  // Normalization: map -100..+100 to 0.1..1.0 radius factor
  const normRadius = (val: number) => {
    // 0 score maps to 0.5 * radius. -100 maps to 0.05 * radius. +100 maps to 0.98 * radius.
    const clamped = Math.max(-100, Math.min(100, val));
    return ((clamped + 100) / 200) * radius;
  };

  const getCoordinates = (index: number, val: number) => {
    // start at top (-PI/2)
    const angle = index * angleStep - Math.PI / 2;
    const r = normRadius(val);
    const x = centerX + r * Math.cos(angle);
    const y = centerY + r * Math.sin(angle);
    return { x, y, angle };
  };

  const getAxisEnd = (index: number, r: number) => {
    const angle = index * angleStep - Math.PI / 2;
    const x = centerX + r * Math.cos(angle);
    const y = centerY + r * Math.sin(angle);
    return { x, y };
  };

  // Build polygon path strings
  const currentPoints = metrics
    .map((m, i) => {
      const { x, y } = getCoordinates(i, m.current);
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(' ');

  const previousPoints = metrics
    .map((m, i) => {
      const baselineVal = activeBaseline === 'week' ? m.previous : m.previous * 0.85;
      const { x, y } = getCoordinates(i, baselineVal);
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(' ');

  // Grid concentric rings at 25%, 50% (neutral 0), 75%, 100%
  const gridLevels = [0.25, 0.5, 0.75, 1.0];

  return (
    <div
      style={{
        background: 'var(--surface-1)',
        border: '1px solid var(--border-subtle)',
        borderRadius: 'var(--radius-md)',
        padding: '16px',
        display: 'flex',
        flexDirection: 'column',
        position: 'relative',
      }}
    >
      {/* Header with Title & Baseline Comparison Toggles */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: 10,
        }}
      >
        <div>
          <div
            style={{
              fontSize: '0.75rem',
              fontWeight: 700,
              textTransform: 'uppercase',
              letterSpacing: '0.08em',
              color: 'var(--text-muted)',
            }}
          >
            {title}
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)', marginTop: 2 }}>
            10-Factor Multi-Dimensional Equilibrium
          </div>
        </div>

        {/* Baseline Selection */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            background: 'var(--surface-2)',
            borderRadius: 'var(--radius-sm)',
            padding: '2px',
            border: '1px solid var(--border-subtle)',
          }}
        >
          <button
            onClick={() => setActiveBaseline('week')}
            style={{
              padding: '3px 8px',
              fontSize: '0.75rem',
              fontWeight: 600,
              borderRadius: 4,
              border: 'none',
              background: activeBaseline === 'week' ? 'var(--surface-3)' : 'transparent',
              color: activeBaseline === 'week' ? 'var(--text-primary)' : 'var(--text-dim)',
              cursor: 'pointer',
              transition: 'all 0.15s ease',
            }}
          >
            vs 1W Prior
          </button>
          <button
            onClick={() => setActiveBaseline('month')}
            style={{
              padding: '3px 8px',
              fontSize: '0.75rem',
              fontWeight: 600,
              borderRadius: 4,
              border: 'none',
              background: activeBaseline === 'month' ? 'var(--surface-3)' : 'transparent',
              color: activeBaseline === 'month' ? 'var(--text-primary)' : 'var(--text-dim)',
              cursor: 'pointer',
              transition: 'all 0.15s ease',
            }}
          >
            vs 1M Prior
          </button>
        </div>
      </div>

      {/* SVG Canvas */}
      <div style={{ display: 'flex', justifyContent: 'center', position: 'relative' }}>
        <svg
          viewBox={`0 0 ${width} ${height}`}
          style={{ width: '100%', maxWidth: width, height: 'auto', overflow: 'visible' }}
        >
          <defs>
            {/* Gradient fill for Current polygon */}
            <linearGradient id="radarCurrentGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#06b6d4" stopOpacity="0.45" />
              <stop offset="50%" stopColor="#10b981" stopOpacity="0.30" />
              <stop offset="100%" stopColor="#3b82f6" stopOpacity="0.15" />
            </linearGradient>
            <filter id="radarGlow" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="3" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
          </defs>

          {/* Concentric Grid Rings */}
          {gridLevels.map((lvl, idx) => {
            const r = radius * lvl;
            const isZero = lvl === 0.5; // neutral zero contour
            const points = metrics
              .map((_, i) => {
                const { x, y } = getAxisEnd(i, r);
                return `${x.toFixed(1)},${y.toFixed(1)}`;
              })
              .join(' ');

            return (
              <g key={`grid-lvl-${idx}`}>
                <polygon
                  points={points}
                  fill="none"
                  stroke={isZero ? 'rgba(56, 189, 248, 0.35)' : 'var(--border-subtle)'}
                  strokeWidth={isZero ? 1.5 : 0.8}
                  strokeDasharray={isZero ? 'none' : '3 3'}
                />
                {/* Level label on top axis */}
                <text
                  x={centerX + 4}
                  y={centerY - r + (isZero ? -3 : 9)}
                  fontSize="8"
                  fontFamily="JetBrains Mono, monospace"
                  fill={isZero ? '#38bdf8' : 'var(--text-dim)'}
                  opacity={0.7}
                >
                  {isZero ? '0 (Neutral)' : lvl === 1.0 ? '+100' : lvl === 0.25 ? '-50' : '+50'}
                </text>
              </g>
            );
          })}

          {/* Radial Spokes / Axes */}
          {metrics.map((_, i) => {
            const { x, y } = getAxisEnd(i, radius);
            return (
              <line
                key={`spoke-${i}`}
                x1={centerX}
                y1={centerY}
                x2={x}
                y2={y}
                stroke="var(--border-subtle)"
                strokeWidth={0.8}
                opacity={0.6}
              />
            );
          })}

          {/* Baseline Polygon (dashed, slate) */}
          <polygon
            points={previousPoints}
            fill="rgba(148, 163, 184, 0.06)"
            stroke="#94a3b8"
            strokeWidth={1.4}
            strokeDasharray="4 3"
            opacity={0.8}
          />

          {/* Current Polygon (glowing gradient) */}
          <polygon
            points={currentPoints}
            fill="url(#radarCurrentGrad)"
            stroke="#06b6d4"
            strokeWidth={2}
            filter="url(#radarGlow)"
          />

          {/* Interactive Vertex Dots */}
          {metrics.map((m, i) => {
            const currCoord = getCoordinates(i, m.current);
            const isHovered = hoveredMetric?.dimension === m.dimension;

            return (
              <g
                key={`vertex-${i}`}
                style={{ cursor: 'pointer' }}
                onMouseEnter={() => setHoveredMetric(m)}
                onMouseLeave={() => setHoveredMetric(null)}
              >
                <circle
                  cx={currCoord.x}
                  cy={currCoord.y}
                  r={isHovered ? 6 : 3.5}
                  fill={m.current >= 0 ? '#10b981' : '#ef4444'}
                  stroke="#030712"
                  strokeWidth={1.5}
                  style={{ transition: 'all 0.15s ease' }}
                />
              </g>
            );
          })}

          {/* Outer Dimension Labels */}
          {metrics.map((m, i) => {
            const { x, y } = getAxisEnd(i, radius + 24);
            const isHovered = hoveredMetric?.dimension === m.dimension;
            // Text anchor based on horizontal position
            let anchor: 'start' | 'middle' | 'end' = 'middle';
            if (x < centerX - 25) anchor = 'end';
            else if (x > centerX + 25) anchor = 'start';

            return (
              <text
                key={`lbl-${i}`}
                x={x}
                y={y + 3}
                textAnchor={anchor}
                fontSize={isHovered ? '9.5' : '8.5'}
                fontWeight={isHovered ? 700 : 500}
                fontFamily="Inter, sans-serif"
                fill={isHovered ? '#38bdf8' : 'var(--text-secondary)'}
                style={{
                  cursor: 'pointer',
                  transition: 'fill 0.15s ease',
                  userSelect: 'none',
                }}
                onMouseEnter={() => setHoveredMetric(m)}
                onMouseLeave={() => setHoveredMetric(null)}
              >
                {m.dimension}
              </text>
            );
          })}
        </svg>

        {/* Hover Tooltip Overlay */}
        {hoveredMetric && (
          <div
            style={{
              position: 'absolute',
              bottom: 8,
              right: 8,
              background: 'var(--surface-elevated)',
              border: '1px solid var(--border-active)',
              borderRadius: 'var(--radius-sm)',
              padding: '8px 12px',
              fontSize: '0.75rem',
              boxShadow: 'var(--shadow-md)',
              pointerEvents: 'none',
              backdropFilter: 'blur(10px)',
              minWidth: 160,
            }}
          >
            <div style={{ fontWeight: 700, color: 'var(--text-primary)', marginBottom: 4 }}>
              {hoveredMetric.dimension}
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12 }}>
              <span style={{ color: 'var(--text-dim)' }}>Current:</span>
              <span
                className="mono"
                style={{
                  fontWeight: 700,
                  color: hoveredMetric.current >= 0 ? '#10b981' : '#ef4444',
                }}
              >
                {hoveredMetric.current > 0 ? `+${hoveredMetric.current}` : hoveredMetric.current}
              </span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, marginTop: 2 }}>
              <span style={{ color: 'var(--text-dim)' }}>
                {activeBaseline === 'week' ? '1W Ago:' : '1M Ago:'}
              </span>
              <span className="mono" style={{ color: 'var(--text-muted)' }}>
                {hoveredMetric.previous > 0 ? `+${hoveredMetric.previous}` : hoveredMetric.previous}
              </span>
            </div>
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                gap: 12,
                marginTop: 4,
                paddingTop: 4,
                borderTop: '1px solid var(--border-subtle)',
              }}
            >
              <span style={{ color: 'var(--text-dim)' }}>Net Delta:</span>
              <span
                className="mono"
                style={{
                  fontWeight: 700,
                  color:
                    hoveredMetric.current - hoveredMetric.previous >= 0 ? '#34d399' : '#f87171',
                }}
              >
                {hoveredMetric.current - hoveredMetric.previous >= 0 ? '+' : ''}
                {(hoveredMetric.current - hoveredMetric.previous).toFixed(1)}
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Legend Footer */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          gap: 18,
          marginTop: 6,
          paddingTop: 8,
          borderTop: '1px solid var(--border-subtle)',
          fontSize: '0.75rem',
          color: 'var(--text-muted)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span
            style={{
              width: 10,
              height: 10,
              borderRadius: '50%',
              background: '#06b6d4',
              display: 'inline-block',
            }}
          />
          <span style={{ color: 'var(--text-primary)', fontWeight: 600 }}>Current Model</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span
            style={{
              width: 12,
              height: 2,
              borderTop: '2px dashed #94a3b8',
              display: 'inline-block',
            }}
          />
          <span>{activeBaseline === 'week' ? '1W Baseline' : '1M Baseline'}</span>
        </div>
      </div>
    </div>
  );
};
