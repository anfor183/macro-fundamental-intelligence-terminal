import React, { useState } from 'react';

export interface ScoreHistoryPoint {
  timestamp: string;
  score: number;
  weekly_score?: number;
  tactical_bias?: string;
  confidence?: number;
  catalyst?: string;
}

interface HistoricalBiasChartProps {
  history?: ScoreHistoryPoint[];
  symbol?: string;
  height?: number;
  width?: number;
}

export const HistoricalBiasChart: React.FC<HistoricalBiasChartProps> = ({
  history = [],
  symbol = 'EURUSD',
  height = 280,
  width = 720,
}) => {
  const [hoveredPoint, setHoveredPoint] = useState<ScoreHistoryPoint | null>(null);
  const [hoverX, setHoverX] = useState<number | null>(null);

  // Generate fallback points if empty
  const points: ScoreHistoryPoint[] = history.length > 0 ? history : [
    { timestamp: '30d ago', score: 28, tactical_bias: 'MILD BULLISH', confidence: 78, catalyst: 'ECB hold' },
    { timestamp: '25d ago', score: 35, tactical_bias: 'BULLISH', confidence: 80, catalyst: 'Eurozone PMI beat' },
    { timestamp: '20d ago', score: 42, tactical_bias: 'BULLISH', confidence: 82, catalyst: 'US Core CPI disinflation' },
    { timestamp: '15d ago', score: 38, tactical_bias: 'BULLISH', confidence: 81, catalyst: 'Fed commentary' },
    { timestamp: '10d ago', score: 51, tactical_bias: 'BULLISH', confidence: 83, catalyst: 'ECB hawkish remarks' },
    { timestamp: '5d ago', score: 58, tactical_bias: 'BULLISH', confidence: 85, catalyst: 'US Yield compression' },
    { timestamp: 'Today', score: 61, tactical_bias: 'BULLISH', confidence: 84, catalyst: 'Eurozone wage acceleration' },
  ];

  const padding = { top: 25, right: 35, bottom: 35, left: 45 };
  const chartW = width - padding.left - padding.right;
  const chartH = height - padding.top - padding.bottom;

  // Score mapping: -100 is bottom (chartH), 0 is middle (chartH/2), +100 is top (0)
  const getY = (score: number) => {
    const clamped = Math.max(-100, Math.min(100, score));
    return padding.top + chartH - ((clamped + 100) / 200) * chartH;
  };

  const getX = (index: number) => {
    if (points.length <= 1) return padding.left + chartW / 2;
    return padding.left + (index / (points.length - 1)) * chartW;
  };

  // Build SVG path
  const linePath = points.reduce((acc, pt, idx) => {
    const x = getX(idx);
    const y = getY(pt.score);
    return idx === 0 ? `M ${x.toFixed(1)} ${y.toFixed(1)}` : `${acc} L ${x.toFixed(1)} ${y.toFixed(1)}`;
  }, '');

  // Area under path down to zero line
  const zeroY = getY(0);
  const firstX = getX(0);
  const lastX = getX(points.length - 1);
  const areaPath = `${linePath} L ${lastX} ${zeroY} L ${firstX} ${zeroY} Z`;

  // Shaded threshold zones
  const zones = [
    { label: 'STR BULL (+70)', yTop: getY(100), yBot: getY(70), fill: 'rgba(16, 185, 129, 0.08)' },
    { label: 'BULL (+30)', yTop: getY(70), yBot: getY(30), fill: 'rgba(16, 185, 129, 0.04)' },
    { label: 'NEUTRAL (±10)', yTop: getY(10), yBot: getY(-10), fill: 'rgba(148, 163, 184, 0.03)' },
    { label: 'BEAR (-30)', yTop: getY(-30), yBot: getY(-70), fill: 'rgba(239, 68, 68, 0.04)' },
    { label: 'STR BEAR (-70)', yTop: getY(-70), yBot: getY(-100), fill: 'rgba(239, 68, 68, 0.08)' },
  ];

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
      {/* Title & Legend Header */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: 8,
        }}
      >
        <div>
          <div
            style={{
              fontSize: '0.72rem',
              fontWeight: 700,
              textTransform: 'uppercase',
              letterSpacing: '0.08em',
              color: 'var(--text-muted)',
            }}
          >
            Historical Fundamental Bias & Macro Trajectory
          </div>
          <div style={{ fontSize: '0.68rem', color: 'var(--text-dim)', marginTop: 2 }}>
            {symbol} Quantitative Score Progression with Catalyst Overlays
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 14, fontSize: '0.7rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
            <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#10b981' }} />
            <span style={{ color: 'var(--text-secondary)' }}>Bullish Band</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
            <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#ef4444' }} />
            <span style={{ color: 'var(--text-secondary)' }}>Bearish Band</span>
          </div>
        </div>
      </div>

      {/* SVG Canvas */}
      <div style={{ position: 'relative' }}>
        <svg
          viewBox={`0 0 ${width} ${height}`}
          style={{ width: '100%', height: 'auto', overflow: 'visible' }}
          onMouseLeave={() => {
            setHoveredPoint(null);
            setHoverX(null);
          }}
        >
          <defs>
            <linearGradient id="scoreAreaGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#06b6d4" stopOpacity="0.25" />
              <stop offset="100%" stopColor="#06b6d4" stopOpacity="0.0" />
            </linearGradient>
          </defs>

          {/* Background Shaded Zones */}
          {zones.map((z, idx) => (
            <rect
              key={`zone-${idx}`}
              x={padding.left}
              y={z.yTop}
              width={chartW}
              height={Math.max(0, z.yBot - z.yTop)}
              fill={z.fill}
            />
          ))}

          {/* Horizontal Grid Ticks & Labels */}
          {[-100, -70, -30, 0, 30, 70, 100].map((val) => {
            const y = getY(val);
            const isZero = val === 0;
            return (
              <g key={`grid-val-${val}`}>
                <line
                  x1={padding.left}
                  y1={y}
                  x2={padding.left + chartW}
                  y2={y}
                  stroke={isZero ? 'rgba(56, 189, 248, 0.5)' : 'var(--border-subtle)'}
                  strokeWidth={isZero ? 1.4 : 0.6}
                  strokeDasharray={isZero ? 'none' : '3 3'}
                />
                <text
                  x={padding.left - 8}
                  y={y + 3}
                  textAnchor="end"
                  fontSize="8.5"
                  fontFamily="JetBrains Mono, monospace"
                  fill={isZero ? '#38bdf8' : 'var(--text-dim)'}
                  fontWeight={isZero ? 700 : 400}
                >
                  {val > 0 ? `+${val}` : val}
                </text>
              </g>
            );
          })}

          {/* Area Fill */}
          <path d={areaPath} fill="url(#scoreAreaGrad)" />

          {/* Time Series Score Line */}
          <path
            d={linePath}
            fill="none"
            stroke="#06b6d4"
            strokeWidth={2.4}
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {/* Point markers & Catalyst pins */}
          {points.map((pt, idx) => {
            const x = getX(idx);
            const y = getY(pt.score);
            const isHovered = hoveredPoint === pt;

            return (
              <g key={`pt-${idx}`}>
                {/* Catalyst marker line */}
                {pt.catalyst && (
                  <line
                    x1={x}
                    y1={y}
                    x2={x}
                    y2={padding.top + chartH}
                    stroke="rgba(245, 158, 11, 0.35)"
                    strokeWidth={1}
                    strokeDasharray="2 2"
                  />
                )}

                {/* Score Point Node */}
                <circle
                  cx={x}
                  cy={y}
                  r={isHovered ? 6 : 4}
                  fill={pt.score >= 0 ? '#10b981' : '#ef4444'}
                  stroke="#030712"
                  strokeWidth={2}
                  style={{ cursor: 'pointer', transition: 'all 0.15s ease' }}
                  onMouseEnter={() => {
                    setHoveredPoint(pt);
                    setHoverX(x);
                  }}
                />

                {/* Date Label on X Axis */}
                <text
                  x={x}
                  y={padding.top + chartH + 18}
                  textAnchor="middle"
                  fontSize="8.5"
                  fontFamily="JetBrains Mono, monospace"
                  fill="var(--text-dim)"
                >
                  {pt.timestamp}
                </text>
              </g>
            );
          })}

          {/* Vertical Crosshair Line on hover */}
          {hoverX !== null && (
            <line
              x1={hoverX}
              y1={padding.top}
              x2={hoverX}
              y2={padding.top + chartH}
              stroke="rgba(56, 189, 248, 0.6)"
              strokeWidth={1}
              strokeDasharray="3 2"
              pointerEvents="none"
            />
          )}
        </svg>

        {/* Floating Tooltip Box */}
        {hoveredPoint && (
          <div
            style={{
              position: 'absolute',
              top: 10,
              right: 15,
              background: 'var(--surface-elevated)',
              border: '1px solid var(--border-active)',
              borderRadius: 'var(--radius-sm)',
              padding: '10px 14px',
              fontSize: '0.72rem',
              boxShadow: 'var(--shadow-md)',
              pointerEvents: 'none',
              backdropFilter: 'blur(10px)',
              minWidth: 200,
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
              <span style={{ color: 'var(--text-dim)', fontSize: '0.68rem' }}>{hoveredPoint.timestamp}</span>
              <span
                style={{
                  fontSize: '0.65rem',
                  fontWeight: 700,
                  padding: '1px 6px',
                  borderRadius: 3,
                  background: hoveredPoint.score >= 0 ? 'rgba(16, 185, 129, 0.2)' : 'rgba(239, 68, 68, 0.2)',
                  color: hoveredPoint.score >= 0 ? '#34d399' : '#f87171',
                }}
              >
                {hoveredPoint.tactical_bias || 'MODEL BIAS'}
              </span>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginTop: 4 }}>
              <span style={{ color: 'var(--text-secondary)' }}>Macro Score:</span>
              <span
                className="mono"
                style={{
                  fontSize: '1rem',
                  fontWeight: 800,
                  color: hoveredPoint.score >= 0 ? '#10b981' : '#ef4444',
                }}
              >
                {hoveredPoint.score > 0 ? `+${hoveredPoint.score.toFixed(1)}` : hoveredPoint.score.toFixed(1)}
              </span>
            </div>

            {hoveredPoint.confidence && (
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 2 }}>
                <span style={{ color: 'var(--text-dim)' }}>Confidence:</span>
                <span className="mono" style={{ color: '#38bdf8', fontWeight: 600 }}>
                  {hoveredPoint.confidence}%
                </span>
              </div>
            )}

            {hoveredPoint.catalyst && (
              <div
                style={{
                  marginTop: 6,
                  paddingTop: 6,
                  borderTop: '1px solid var(--border-subtle)',
                  color: '#fbbf24',
                  fontSize: '0.68rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 4,
                }}
              >
                <span>⚡ Catalyst:</span>
                <span style={{ color: 'var(--text-primary)', fontWeight: 500 }}>
                  {hoveredPoint.catalyst}
                </span>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
