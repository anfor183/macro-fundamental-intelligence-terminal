import React from 'react';
import { BiasCategory } from '../types/macro';
import { getBiasBadgeClass } from './AssetTable';

interface MacroScoreGaugeProps {
  score: number; // -100 to +100
  bias: BiasCategory;
  confidence: number;
  size?: number;
}

export const MacroScoreGauge: React.FC<MacroScoreGaugeProps> = ({
  score,
  bias,
  confidence,
  size = 220,
}) => {
  // Semi-circular gauge parameters
  const strokeWidth = 14;
  const radius = (size - strokeWidth * 2) / 2;
  const cx = size / 2;
  const cy = size * 0.58;

  // Score normalized from -100..+100 to 0..1 (angle from PI to 0)
  const clampedScore = Math.max(-100, Math.min(100, score));
  const normalized = (clampedScore + 100) / 200; // 0 to 1
  const angle = Math.PI - normalized * Math.PI; // PI (left) to 0 (right)

  // Arc path generator
  const needleLength = radius - 16;
  const needleX = cx + needleLength * Math.cos(angle);
  const needleY = cy - needleLength * Math.sin(angle);

  // Determine indicator color
  const color =
    score >= 70
      ? '#059669'
      : score >= 40
      ? '#10b981'
      : score >= 15
      ? '#34d399'
      : score <= -70
      ? '#e11d48'
      : score <= -40
      ? '#f43f5e'
      : score <= -15
      ? '#fb7185'
      : '#94a3b8';

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      position: 'relative',
      width: size,
    }}>
      <svg width={size} height={size * 0.68} viewBox={`0 0 ${size} ${size * 0.68}`}>
        <defs>
          {/* Background Gradient Arc */}
          <linearGradient id="gaugeGradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#e11d48" />
            <stop offset="25%" stopColor="#f43f5e" />
            <stop offset="45%" stopColor="#94a3b8" />
            <stop offset="55%" stopColor="#94a3b8" />
            <stop offset="75%" stopColor="#10b981" />
            <stop offset="100%" stopColor="#059669" />
          </linearGradient>

          <filter id="gaugeGlow" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="3" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
        </defs>

        {/* Background Track */}
        <path
          d={`M ${cx - radius} ${cy} A ${radius} ${radius} 0 0 1 ${cx + radius} ${cy}`}
          fill="none"
          stroke="var(--surface-3)"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
        />

        {/* Colored Gradient Active Arc */}
        <path
          d={`M ${cx - radius} ${cy} A ${radius} ${radius} 0 0 1 ${cx + radius} ${cy}`}
          fill="none"
          stroke="url(#gaugeGradient)"
          strokeWidth={strokeWidth - 4}
          strokeLinecap="round"
          opacity={0.85}
        />

        {/* Center Zero Tick */}
        <line
          x1={cx}
          y1={cy - radius - 5}
          x2={cx}
          y2={cy - radius + 5}
          stroke="var(--text-muted)"
          strokeWidth={2}
        />

        {/* -40 and +40 Threshold Ticks */}
        <line
          x1={cx - radius * 0.707}
          y1={cy - radius * 0.707}
          x2={cx - (radius - 8) * 0.707}
          y2={cy - (radius - 8) * 0.707}
          stroke="var(--border-strong)"
          strokeWidth={1.5}
        />
        <line
          x1={cx + radius * 0.707}
          y1={cy - radius * 0.707}
          x2={cx + (radius - 8) * 0.707}
          y2={cy - (radius - 8) * 0.707}
          stroke="var(--border-strong)"
          strokeWidth={1.5}
        />

        {/* Needle Pointer */}
        <line
          x1={cx}
          y1={cy}
          x2={needleX}
          y2={needleY}
          stroke={color}
          strokeWidth={3}
          strokeLinecap="round"
          filter="url(#gaugeGlow)"
          style={{ transition: 'all 0.4s cubic-bezier(0.16, 1, 0.3, 1)' }}
        />

        {/* Pivot Hub */}
        <circle cx={cx} cy={cy} r={6} fill={color} />
        <circle cx={cx} cy={cy} r={2.5} fill="var(--bg-base)" />
      </svg>

      {/* Numerical Readout */}
      <div style={{
        marginTop: -18,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 4,
      }}>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 4 }}>
          <span
            className="mono"
            style={{
              fontSize: '1.85rem',
              fontWeight: 900,
              color: color,
              lineHeight: 1,
            }}
          >
            {score > 0 ? `+${score.toFixed(1)}` : score.toFixed(1)}
          </span>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
            / 100
          </span>
        </div>

        <span className={getBiasBadgeClass(bias)}>
          {bias}
        </span>

        <span style={{
          fontSize: '0.75rem',
          color: 'var(--text-muted)',
          marginTop: 2,
          fontFamily: 'var(--font-mono)',
        }}>
          CONFIDENCE: <strong style={{ color: 'var(--accent-cyan)' }}>{confidence.toFixed(0)}%</strong>
        </span>
      </div>
    </div>
  );
};
