import React, { useState } from 'react';
import {
  Flame,
  ArrowUpRight,
  ArrowDownRight,
  Filter,
  ShieldCheck,
  Clock,
  Sparkles,
  ExternalLink,
} from 'lucide-react';
import { WhatChangedItem } from '../types/macro';

export interface CatalystItem {
  id: string;
  timestamp: string;
  timeAgo: string;
  event: string;
  targetCurrency: string;
  scoreDelta: number;
  direction: 'BULLISH' | 'BEARISH' | 'NEUTRAL';
  affectedAssets: string[];
  sourceName: string;
  sourceTier: 1 | 2 | 3;
  summary: string;
}

interface CatalystStreamProps {
  catalysts?: CatalystItem[];
  whatChanged?: WhatChangedItem[];
  onSelectAsset?: (symbol: string) => void;
  onOpenEvidence?: (catalyst: CatalystItem) => void;
  compact?: boolean;
}

const DEFAULT_CATALYSTS: CatalystItem[] = [
  {
    id: 'cat-1',
    timestamp: '14:32 UTC',
    timeAgo: '12m ago',
    event: 'US Core CPI Prints Below Forecast (0.18% vs 0.30% exp)',
    targetCurrency: 'USD',
    scoreDelta: -12.4,
    direction: 'BEARISH',
    affectedAssets: ['EURUSD', 'USDJPY', 'XAUUSD', 'SPX'],
    sourceName: 'US Bureau of Labor Statistics (Tier 1 Primary)',
    sourceTier: 1,
    summary: 'Disinflationary surprise spurs aggressive market repricing towards 50bps of Fed rate cuts in H2.',
  },
  {
    id: 'cat-2',
    timestamp: '13:15 UTC',
    timeAgo: '1h ago',
    event: 'ECB Schnabel Comments Affirm Sticky Services Inflation',
    targetCurrency: 'EUR',
    scoreDelta: 8.2,
    direction: 'BULLISH',
    affectedAssets: ['EURUSD', 'EURGBP', 'EURJPY'],
    sourceName: 'European Central Bank Official Wire (Tier 1)',
    sourceTier: 1,
    summary: 'Officials signal reluctance to enact back-to-back interest rate reductions amid wage acceleration.',
  },
  {
    id: 'cat-3',
    timestamp: '11:45 UTC',
    timeAgo: '2h ago',
    event: 'OPEC+ Delegates Affirm Voluntary Output Curtailment Extension',
    targetCurrency: 'CAD',
    scoreDelta: 5.1,
    direction: 'BULLISH',
    affectedAssets: ['USDCAD', 'USOIL', 'BRENT'],
    sourceName: 'OPEC Secretariat / Reuters Wire (Tier 2)',
    sourceTier: 2,
    summary: 'Supply discipline tightens physical crude availability, bolstering terms of trade for net oil exporters.',
  },
  {
    id: 'cat-4',
    timestamp: '09:10 UTC',
    timeAgo: '4h ago',
    event: 'Global Geopolitical Safe-Haven Flight Compresses JPY Crosses',
    targetCurrency: 'JPY',
    scoreDelta: 7.3,
    direction: 'BULLISH',
    affectedAssets: ['USDJPY', 'GBPJPY', 'AUDJPY'],
    sourceName: 'Bloomberg Financial Intelligence (Tier 2)',
    sourceTier: 2,
    summary: 'Unwinding of speculative carry trades and demand for liquid haven sovereign collateral.',
  },
  {
    id: 'cat-5',
    timestamp: '06:30 UTC',
    timeAgo: '7h ago',
    event: 'PBOC Sets Daily Yuan Reference Rate Strongly Above Estimates',
    targetCurrency: 'AUD',
    scoreDelta: 3.4,
    direction: 'BULLISH',
    affectedAssets: ['AUDUSD', 'NZDUSD'],
    sourceName: 'People Bank of China (Tier 1)',
    sourceTier: 1,
    summary: 'Defense of renminbi floor provides stabilizing tailwind for antipodean commodity proxies.',
  },
];

export const CatalystStream: React.FC<CatalystStreamProps> = ({
  catalysts = DEFAULT_CATALYSTS,
  whatChanged,
  onSelectAsset,
  onOpenEvidence,
  compact = false,
}) => {
  const [filterMagnitude, setFilterMagnitude] = useState<'all' | 'high' | 'tier1'>('all');

  // Convert whatChanged if supplied
  const items: CatalystItem[] = catalysts.filter((item) => {
    if (filterMagnitude === 'high') return Math.abs(item.scoreDelta) >= 7;
    if (filterMagnitude === 'tier1') return item.sourceTier === 1;
    return true;
  });

  return (
    <div
      style={{
        background: 'var(--surface-1)',
        border: '1px solid var(--border-subtle)',
        borderRadius: 'var(--radius-md)',
        padding: compact ? '14px' : '18px',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      {/* Stream Header */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: 12,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Flame size={18} color="#f59e0b" />
          <div>
            <div
              style={{
                fontSize: '0.75rem',
                fontWeight: 800,
                textTransform: 'uppercase',
                letterSpacing: '0.06em',
                color: 'var(--text-primary)',
              }}
            >
              Catalyst Stream
            </div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>
              Live Quantitative Impact Heartbeat
            </div>
          </div>
        </div>

        {/* Filter Controls */}
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
            onClick={() => setFilterMagnitude('all')}
            style={{
              padding: '2px 7px',
              fontSize: '0.75rem',
              fontWeight: 600,
              borderRadius: 3,
              border: 'none',
              background: filterMagnitude === 'all' ? 'var(--surface-3)' : 'transparent',
              color: filterMagnitude === 'all' ? 'var(--text-primary)' : 'var(--text-dim)',
              cursor: 'pointer',
            }}
          >
            All
          </button>
          <button
            onClick={() => setFilterMagnitude('high')}
            title="Large score shifts (7 or more points)"
            style={{
              padding: '3px 9px',
              fontSize: '0.75rem',
              fontWeight: 600,
              borderRadius: 3,
              border: 'none',
              background: filterMagnitude === 'high' ? 'var(--surface-3)' : 'transparent',
              color: filterMagnitude === 'high' ? 'var(--text-primary)' : 'var(--text-dim)',
              cursor: 'pointer',
            }}
          >
            Shift ≥ 7
          </button>
          <button
            onClick={() => setFilterMagnitude('tier1')}
            title="Tier 1 Official Economic Releases only"
            style={{
              padding: '3px 9px',
              fontSize: '0.75rem',
              fontWeight: 600,
              borderRadius: 3,
              border: 'none',
              background: filterMagnitude === 'tier1' ? 'var(--surface-3)' : 'transparent',
              color: filterMagnitude === 'tier1' ? 'var(--text-primary)' : 'var(--text-dim)',
              cursor: 'pointer',
            }}
          >
            Tier 1
          </button>
        </div>
      </div>

      {/* Stream Items List */}
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: 10,
          maxHeight: compact ? 340 : 480,
          overflowY: 'auto',
        }}
      >
        {items.map((item) => {
          const isBull = item.scoreDelta > 0;
          const deltaColor = isBull ? '#34d399' : '#f87171';
          const DeltaIcon = isBull ? ArrowUpRight : ArrowDownRight;

          return (
            <div
              key={item.id}
              style={{
                background: 'var(--surface-2)',
                border: '1px solid var(--border-subtle)',
                borderRadius: 'var(--radius-sm)',
                padding: '10px 12px',
                display: 'flex',
                flexDirection: 'column',
                gap: 6,
                transition: 'border-color 0.15s ease, background 0.15s ease',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = 'var(--border-active)';
                e.currentTarget.style.background = 'var(--surface-3)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = 'var(--border-subtle)';
                e.currentTarget.style.background = 'var(--surface-2)';
              }}
            >
              {/* Top Row: Timestamp, Source Tier, Delta Pill */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span
                    style={{
                      width: 6,
                      height: 6,
                      borderRadius: '50%',
                      background: isBull ? '#10b981' : '#ef4444',
                      display: 'inline-block',
                    }}
                  />
                  <span className="mono" style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>
                    {item.timestamp} ({item.timeAgo})
                  </span>
                  <span
                    style={{
                      fontSize: '0.75rem',
                      fontWeight: 700,
                      padding: '1px 5px',
                      borderRadius: 3,
                      background: item.sourceTier === 1 ? 'rgba(56, 189, 248, 0.15)' : 'rgba(148, 163, 184, 0.12)',
                      color: item.sourceTier === 1 ? 'var(--accent-cyan)' : 'var(--text-secondary)',
                    }}
                  >
                    Tier {item.sourceTier}
                  </span>
                </div>

                {/* Score Delta Pill */}
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 3,
                    padding: '2px 7px',
                    borderRadius: 3,
                    background: isBull ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)',
                    border: `1px solid ${isBull ? 'rgba(16, 185, 129, 0.3)' : 'rgba(239, 68, 68, 0.3)'}`,
                  }}
                >
                  <DeltaIcon size={12} color={deltaColor} />
                  <span
                    className="mono"
                    style={{
                      fontSize: '0.75rem',
                      fontWeight: 800,
                      color: deltaColor,
                    }}
                  >
                    {item.targetCurrency} {isBull ? `+${item.scoreDelta.toFixed(1)}` : item.scoreDelta.toFixed(1)}
                  </span>
                </div>
              </div>

              {/* Event Title */}
              <div style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-primary)', lineHeight: 1.35 }}>
                {item.event}
              </div>

              {/* Summary */}
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', lineHeight: 1.3 }}>
                {item.summary}
              </div>

              {/* Affected Asset Pills & Evidence Action */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 2 }}>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                  {item.affectedAssets.map((ast) => (
                    <button
                      key={`ast-${ast}`}
                      onClick={() => onSelectAsset && onSelectAsset(ast)}
                      style={{
                        padding: '1px 5px',
                        fontSize: '0.75rem',
                        fontFamily: 'JetBrains Mono, monospace',
                        fontWeight: 700,
                        borderRadius: 3,
                        border: '1px solid var(--border-subtle)',
                        background: 'var(--surface-1)',
                        color: 'var(--text-secondary)',
                        cursor: onSelectAsset ? 'pointer' : 'default',
                      }}
                    >
                      {ast}
                    </button>
                  ))}
                </div>

                {onOpenEvidence && (
                  <button
                    onClick={() => onOpenEvidence(item)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 3,
                      background: 'none',
                      border: 'none',
                      fontSize: '0.75rem',
                      color: 'var(--accent-cyan)',
                      cursor: 'pointer',
                      fontWeight: 600,
                    }}
                  >
                    Evidence <ExternalLink size={11} />
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
