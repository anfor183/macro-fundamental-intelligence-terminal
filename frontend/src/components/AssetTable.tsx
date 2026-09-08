import React from 'react';
import { TrendingUp, TrendingDown, ChevronRight, ShieldCheck } from 'lucide-react';
import { AssetItem, BiasCategory } from '../types/macro';

interface AssetTableProps {
  assets: AssetItem[];
  onSelectAsset: (symbol: string) => void;
  title?: string;
}

export function getBiasBadgeClass(bias: BiasCategory): string {
  switch (bias) {
    case 'STRONG BULLISH':
      return 'bias-badge bias-strong-bullish';
    case 'BULLISH':
      return 'bias-badge bias-bullish';
    case 'MILD BULLISH':
      return 'bias-badge bias-mild-bullish';
    case 'NEUTRAL':
      return 'bias-badge bias-neutral';
    case 'MILD BEARISH':
      return 'bias-badge bias-mild-bearish';
    case 'BEARISH':
      return 'bias-badge bias-bearish';
    case 'STRONG BEARISH':
      return 'bias-badge bias-strong-bearish';
    default:
      return 'bias-badge bias-neutral';
  }
}

export const AssetTable: React.FC<AssetTableProps> = ({
  assets,
  onSelectAsset,
  title = 'Global Macro Fundamental Assets Universe',
}) => {
  return (
    <div style={{
      background: 'var(--bg-card)',
      border: '1px solid var(--border-subtle)',
      borderRadius: 8,
      overflow: 'hidden',
    }}>
      <div style={{
        padding: '14px 18px',
        borderBottom: '1px solid var(--border-subtle)',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <h3 style={{ fontSize: '0.92rem', fontWeight: 700, color: 'var(--text-primary)' }}>
            {title}
          </h3>
          <span style={{
            fontSize: '0.7rem',
            background: 'rgba(56, 189, 248, 0.1)',
            color: 'var(--accent-cyan)',
            padding: '2px 8px',
            borderRadius: 12,
            fontWeight: 700,
          }}>
            {assets.length} ASSETS
          </span>
        </div>
        <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
          Click any row to inspect complete factor waterfall, drivers & invalidation criteria
        </div>
      </div>

      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.8rem' }}>
          <thead>
            <tr style={{
              background: 'var(--surface-2)',
              borderBottom: '1px solid var(--border-subtle)',
              color: 'var(--text-muted)',
              fontSize: '0.7rem',
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
            }}>
              <th style={{ padding: '10px 16px' }}>Asset</th>
              <th style={{ padding: '10px 12px' }}>Price</th>
              <th style={{ padding: '10px 12px' }}>Daily Move</th>
              <th style={{ padding: '10px 16px' }}>Macro Score</th>
              <th style={{ padding: '10px 12px' }}>Tactical Bias</th>
              <th style={{ padding: '10px 12px' }}>Weekly Bias</th>
              <th style={{ padding: '10px 12px' }}>Confidence</th>
              <th style={{ padding: '10px 16px' }}>Primary Macro Catalyst</th>
              <th style={{ padding: '10px 12px', textAlign: 'center' }}>Inspect</th>
            </tr>
          </thead>
          <tbody>
            {assets.map((asset) => {
              const isPositiveChange = asset.daily_change_pct >= 0;
              const isPositiveScore = asset.score >= 0;

              return (
                <tr
                  key={asset.symbol}
                  onClick={() => onSelectAsset(asset.symbol)}
                  style={{
                    borderBottom: '1px solid var(--border-subtle)',
                    cursor: 'pointer',
                    transition: 'background 0.12s ease',
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--bg-card-hover)')}
                  onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                >
                  {/* Symbol & Name */}
                  <td style={{ padding: '12px 16px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span className="mono" style={{ fontWeight: 800, color: 'var(--text-primary)', fontSize: '0.88rem' }}>
                        {asset.symbol}
                      </span>
                      <span style={{
                        fontSize: '0.65rem',
                        textTransform: 'uppercase',
                        padding: '1px 5px',
                        borderRadius: 3,
                        background: 'rgba(148, 163, 184, 0.15)',
                        color: 'var(--text-secondary)',
                        fontWeight: 600,
                      }}>
                        {asset.asset_class}
                      </span>
                    </div>
                    <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                      {asset.name}
                    </div>
                  </td>

                  {/* Price */}
                  <td className="mono" style={{ padding: '12px 12px', fontWeight: 600, color: 'var(--text-primary)' }}>
                    {asset.current_price.toLocaleString(undefined, { minimumFractionDigits: asset.asset_class === 'forex' ? 4 : 2 })}
                  </td>

                  {/* Move */}
                  <td className="mono" style={{ padding: '12px 12px' }}>
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 4,
                      color: isPositiveChange ? '#34d399' : '#f87171',
                      fontWeight: 600,
                    }}>
                      {isPositiveChange ? <TrendingUp size={13} /> : <TrendingDown size={13} />}
                      <span>{isPositiveChange ? `+${asset.daily_change_pct.toFixed(2)}%` : `${asset.daily_change_pct.toFixed(2)}%`}</span>
                    </div>
                  </td>

                  {/* Macro Score with Meter */}
                  <td style={{ padding: '12px 16px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <span className="mono" style={{
                        fontWeight: 800,
                        fontSize: '0.86rem',
                        color: isPositiveScore ? '#10b981' : (asset.score < -14 ? '#ef4444' : '#94a3b8'),
                        minWidth: 42,
                      }}>
                        {asset.score > 0 ? `+${asset.score.toFixed(1)}` : asset.score.toFixed(1)}
                      </span>
                      {/* Mini Bar Meter (-100 to +100) */}
                      <div style={{
                        width: 80,
                        height: 6,
                        background: 'var(--surface-3)',
                        borderRadius: 3,
                        position: 'relative',
                        overflow: 'hidden',
                      }}>
                        {/* Center marker */}
                        <div style={{ position: 'absolute', left: '50%', width: 1, height: '100%', background: '#475569' }} />
                        {isPositiveScore ? (
                          <div style={{
                            position: 'absolute',
                            left: '50%',
                            width: `${Math.min(50, (asset.score / 100) * 50)}%`,
                            height: '100%',
                            background: '#10b981',
                            borderRadius: '0 2px 2px 0',
                          }} />
                        ) : (
                          <div style={{
                            position: 'absolute',
                            right: '50%',
                            width: `${Math.min(50, (Math.abs(asset.score) / 100) * 50)}%`,
                            height: '100%',
                            background: '#ef4444',
                            borderRadius: '2px 0 0 2px',
                          }} />
                        )}
                      </div>
                    </div>
                  </td>

                  {/* Tactical Bias */}
                  <td style={{ padding: '12px 12px' }}>
                    <span className={getBiasBadgeClass(asset.tactical_bias)}>
                      {asset.tactical_bias}
                    </span>
                  </td>

                  {/* Weekly Structural Bias */}
                  <td style={{ padding: '12px 12px' }}>
                    <span style={{
                      fontSize: '0.7rem',
                      fontWeight: 600,
                      color: 'var(--text-secondary)',
                      textTransform: 'uppercase',
                    }}>
                      {asset.weekly_bias}
                    </span>
                  </td>

                  {/* Confidence */}
                  <td className="mono" style={{ padding: '12px 12px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <span style={{
                        fontWeight: 700,
                        color: asset.confidence >= 75 ? '#38bdf8' : (asset.confidence >= 60 ? '#f59e0b' : '#ef4444'),
                      }}>
                        {asset.confidence.toFixed(0)}%
                      </span>
                    </div>
                  </td>

                  {/* Primary Catalyst */}
                  <td style={{ padding: '12px 16px', maxWidth: 280 }}>
                    <div style={{
                      fontSize: '0.74rem',
                      color: 'var(--text-secondary)',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                    }} title={asset.primary_driver}>
                      {asset.primary_driver}
                    </div>
                  </td>

                  {/* Action */}
                  <td style={{ padding: '12px 12px', textAlign: 'center' }}>
                    <ChevronRight size={16} color="var(--text-dim)" />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};
