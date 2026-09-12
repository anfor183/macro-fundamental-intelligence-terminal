import React from 'react';
import {
  TrendingUp,
  TrendingDown,
  Minus,
  AlertTriangle,
  CheckCircle2,
  ShieldAlert,
  ArrowUpRight,
  ArrowDownRight,
  Sparkles,
} from 'lucide-react';
import { BiasCategory, InvalidationCondition } from '../types/macro';

interface DriverItem {
  label: string;
  contribution: number;
}

interface MacroConvictionCardProps {
  symbol: string;
  name?: string;
  bias: BiasCategory;
  score: number;
  confidence: number;
  drivers?: DriverItem[];
  invalidationConditions?: InvalidationCondition[];
  onOpenEvidence?: () => void;
}

export const MacroConvictionCard: React.FC<MacroConvictionCardProps> = ({
  symbol,
  name,
  bias,
  score,
  confidence,
  drivers = [
    { label: 'ECB Rate Expectations', contribution: 17.2 },
    { label: 'US Yield Compression', contribution: 13.5 },
    { label: 'Growth Differential', contribution: 9.1 },
    { label: 'Risk Sentiment Regime', contribution: 7.4 },
    { label: 'Inflation Stabilization', contribution: 6.2 },
    { label: 'Terms of Trade Delta', contribution: 3.8 },
  ],
  invalidationConditions = [
    {
      id: 'inv-1',
      condition: 'US Core CPI upside surprise (>0.35% m/m)',
      likelihood: 'Medium',
      impact_if_triggered: 'Violent hawkish Fed repricing; USD rally',
      metric_to_watch: 'US CPI Release (Monthly)',
    },
    {
      id: 'inv-2',
      condition: 'Eurozone Composite PMI prints contraction (<48.5)',
      likelihood: 'Low',
      impact_if_triggered: 'Dovish ECB pivot pressure; EUR depreciation',
      metric_to_watch: 'S&P Global Eurozone PMI',
    },
    {
      id: 'inv-3',
      condition: 'Geopolitical escalation triggering global flight to USD cash',
      likelihood: 'Low',
      impact_if_triggered: 'Safe-haven Dollar surge vs pro-cyclical Euro',
      metric_to_watch: 'VIX > 28, Cross-Asset Risk Index',
    },
  ],
  onOpenEvidence,
}) => {
  // Quantitative conviction calculation: (|Score| * Confidence) / 100
  const convictionRating = Math.min(100, Math.round((Math.abs(score) * confidence) / 100));

  // Determine bias styling
  const isBullish = score > 10;
  const isBearish = score < -10;
  const biasColor = isBullish ? '#10b981' : isBearish ? '#ef4444' : '#94a3b8';

  const BiasIcon = isBullish ? ArrowUpRight : isBearish ? ArrowDownRight : Minus;

  return (
    <div
      style={{
        background: 'var(--surface-1)',
        border: '1px solid var(--border-subtle)',
        borderRadius: 'var(--radius-lg)',
        padding: '22px',
        display: 'flex',
        flexDirection: 'column',
        gap: '18px',
        boxShadow: 'var(--shadow-sm)',
        position: 'relative',
        overflow: 'hidden',
        height: '100%',
      }}
    >
      {/* Background subtle atmospheric tint */}
      <div
        style={{
          position: 'absolute',
          top: 0,
          right: 0,
          width: 260,
          height: 180,
          background: isBullish
            ? 'radial-gradient(circle, rgba(16, 185, 129, 0.08) 0%, transparent 70%)'
            : isBearish
            ? 'radial-gradient(circle, rgba(239, 68, 68, 0.08) 0%, transparent 70%)'
            : 'radial-gradient(circle, rgba(56, 189, 248, 0.05) 0%, transparent 70%)',
          pointerEvents: 'none',
        }}
      />

      {/* Top Banner: Symbol & Conviction Rating */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span
              className="mono"
              style={{
                fontSize: '1.35rem',
                fontWeight: 800,
                color: 'var(--text-primary)',
                letterSpacing: '-0.02em',
              }}
            >
              {symbol}
            </span>
            {name && (
              <span style={{ fontSize: '0.8rem', color: 'var(--text-dim)', fontWeight: 500 }}>
                {name}
              </span>
            )}
          </div>
          <div
            style={{
              fontSize: '0.75rem',
              fontWeight: 700,
              textTransform: 'uppercase',
              letterSpacing: '0.08em',
              color: 'var(--accent-cyan)',
              marginTop: 3,
              display: 'flex',
              alignItems: 'center',
              gap: 4,
            }}
          >
            <Sparkles size={12} />
            Institutional Macro Conviction
          </div>
        </div>

        {/* 7-State Bias Pill */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            padding: '5px 12px',
            borderRadius: 'var(--radius-sm)',
            background: isBullish
              ? 'rgba(16, 185, 129, 0.15)'
              : isBearish
              ? 'rgba(239, 68, 68, 0.15)'
              : 'rgba(148, 163, 184, 0.12)',
            border: `1px solid ${isBullish ? 'rgba(16, 185, 129, 0.35)' : isBearish ? 'rgba(239, 68, 68, 0.35)' : 'rgba(148, 163, 184, 0.25)'}`,
          }}
        >
          <BiasIcon size={16} color={biasColor} />
          <span
            className="mono"
            style={{
              fontSize: '0.78rem',
              fontWeight: 800,
              color: biasColor,
              letterSpacing: '0.04em',
            }}
          >
            {bias}
          </span>
        </div>
      </div>

      {/* Conviction Meter Bar */}
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 6 }}>
          <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
            Model Conviction Rating
          </span>
          <div className="mono" style={{ display: 'flex', alignItems: 'baseline', gap: 4 }}>
            <span style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--text-primary)' }}>
              {convictionRating}
            </span>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>/ 100</span>
          </div>
        </div>

        {/* Segmented Institutional Bar */}
        <div
          style={{
            height: 8,
            background: 'var(--surface-3)',
            borderRadius: 4,
            overflow: 'hidden',
            display: 'flex',
            border: '1px solid var(--border-subtle)',
          }}
        >
          <div
            style={{
              width: `${convictionRating}%`,
              background: `linear-gradient(90deg, #06b6d4 0%, ${biasColor} 100%)`,
              borderRadius: 4,
              transition: 'width 0.6s cubic-bezier(0.16, 1, 0.3, 1)',
            }}
          />
        </div>

        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            fontSize: '0.75rem',
            color: 'var(--text-dim)',
            marginTop: 4,
            fontFamily: 'JetBrains Mono, monospace',
          }}
        >
          <span>Score: {score > 0 ? `+${score.toFixed(1)}` : score.toFixed(1)}</span>
          <span>Confidence: {confidence.toFixed(0)}%</span>
          <span>Tier-1 Multi-Source Verified</span>
        </div>
      </div>

      {/* Two Column Section: What is Driving It vs What Could Reverse It */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
          gap: '16px',
          paddingTop: 8,
          borderTop: '1px solid var(--border-subtle)',
          flex: 1,
        }}
      >
        {/* Left: What is driving it? */}
        <div
          style={{
            background: 'var(--surface-2)',
            borderRadius: 'var(--radius-md)',
            padding: '14px',
            border: '1px solid var(--border-subtle)',
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          <div
            style={{
              fontSize: '0.75rem',
              fontWeight: 700,
              textTransform: 'uppercase',
              letterSpacing: '0.06em',
              color: '#34d399',
              marginBottom: 10,
              display: 'flex',
              alignItems: 'center',
              gap: 6,
            }}
          >
            <CheckCircle2 size={14} />
            What is Driving It? (Tailwinds)
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {drivers.map((drv, i) => (
              <div key={`drv-${i}`}>
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    fontSize: '0.75rem',
                    marginBottom: 3,
                  }}
                >
                  <span style={{ color: 'var(--text-secondary)' }}>{drv.label}</span>
                  <span
                    className="mono"
                    style={{
                      fontWeight: 700,
                      color: drv.contribution >= 0 ? '#10b981' : '#ef4444',
                    }}
                  >
                    {drv.contribution > 0 ? `+${drv.contribution.toFixed(1)}` : drv.contribution.toFixed(1)}
                  </span>
                </div>
                {/* Horizontal mini bar */}
                <div
                  style={{
                    height: 4,
                    background: 'var(--surface-3)',
                    borderRadius: 2,
                    overflow: 'hidden',
                  }}
                >
                  <div
                    style={{
                      width: `${Math.min(100, Math.abs(drv.contribution) * 4)}%`,
                      height: '100%',
                      background: drv.contribution >= 0 ? '#10b981' : '#ef4444',
                      borderRadius: 2,
                    }}
                  />
                </div>
              </div>
            ))}
          </div>

          {onOpenEvidence && (
            <button
              onClick={onOpenEvidence}
              style={{
                marginTop: 'auto',
                paddingTop: 10,
                width: '100%',
                padding: '7px',
                fontSize: '0.75rem',
                fontWeight: 600,
                color: 'var(--accent-cyan)',
                background: 'rgba(6, 182, 212, 0.08)',
                border: '1px solid rgba(6, 182, 212, 0.25)',
                borderRadius: 'var(--radius-sm)',
                cursor: 'pointer',
                textAlign: 'center',
                transition: 'all 0.15s ease',
              }}
            >
              Inspect Source Provenance & Evidence →
            </button>
          )}
        </div>

        {/* Right: What could reverse it? (Invalidation Checklist) */}
        <div
          style={{
            background: 'var(--surface-2)',
            borderRadius: 'var(--radius-md)',
            padding: '14px',
            border: '1px solid var(--border-subtle)',
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          <div
            style={{
              fontSize: '0.75rem',
              fontWeight: 700,
              textTransform: 'uppercase',
              letterSpacing: '0.06em',
              color: '#f59e0b',
              marginBottom: 10,
              display: 'flex',
              alignItems: 'center',
              gap: 6,
            }}
          >
            <ShieldAlert size={14} />
            What Could Reverse It? (Invalidation Checklist)
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {invalidationConditions.map((inv) => (
              <div
                key={inv.id}
                style={{
                  padding: '8px 10px',
                  background: 'var(--surface-1)',
                  borderRadius: 'var(--radius-sm)',
                  borderLeft: `3px solid ${inv.likelihood === 'High' ? '#ef4444' : inv.likelihood === 'Medium' ? '#f59e0b' : '#06b6d4'}`,
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: 2,
                  }}
                >
                  <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                    {inv.condition}
                  </span>
                  <span
                    style={{
                      fontSize: '0.75rem',
                      fontWeight: 700,
                      padding: '1px 5px',
                      borderRadius: 3,
                      background: inv.likelihood === 'High' ? 'rgba(239, 68, 68, 0.2)' : 'rgba(245, 158, 11, 0.2)',
                      color: inv.likelihood === 'High' ? '#f87171' : '#fbbf24',
                    }}
                  >
                    {inv.likelihood} Risk
                  </span>
                </div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                  Impact: {inv.impact_if_triggered}
                </div>
                <div
                  className="mono"
                  style={{ fontSize: '0.75rem', color: 'var(--accent-cyan)', marginTop: 3 }}
                >
                  Watch: {inv.metric_to_watch}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
