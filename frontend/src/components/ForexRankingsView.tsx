import React, { useEffect, useState } from 'react';
import { TrendingUp, TrendingDown, ArrowUpDown, RefreshCw, ChevronRight } from 'lucide-react';
import { ForexRankingItem } from '../types/macro';
import { api } from '../services/api';
import { getBiasBadgeClass } from './AssetTable';

export const ForexRankingsView: React.FC<{ onSelectAsset?: (symbol: string) => void }> = ({ onSelectAsset }) => {
  const [pairs, setPairs] = useState<ForexRankingItem[]>([]);
  const [loading, setLoading] = useState(true);

  const loadData = () => {
    setLoading(true);
    api.getForexRankings()
      .then(setPairs)
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadData();
  }, []);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h2 style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--text-primary)' }}>
            Forex Pairs Fundamental Conviction Rankings
          </h2>
          <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
            Ranked by fundamental conviction (|Tactical Macro Score| × Confidence %) • Quantitative relative value
          </div>
        </div>
        <button
          onClick={loadData}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            background: 'var(--bg-card)',
            border: '1px solid var(--border-subtle)',
            color: 'var(--text-secondary)',
            padding: '6px 12px',
            borderRadius: 6,
            fontSize: '0.75rem',
            cursor: 'pointer',
          }}
        >
          <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
          Refresh
        </button>
      </div>

      <div style={{
        background: 'var(--bg-card)',
        border: '1px solid var(--border-subtle)',
        borderRadius: 8,
        overflow: 'hidden',
      }}>
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
              <th style={{ padding: '10px 16px' }}>Rank</th>
              <th style={{ padding: '10px 16px' }}>Forex Pair</th>
              <th style={{ padding: '10px 14px' }}>Fundamental Conviction</th>
              <th style={{ padding: '10px 14px' }}>Macro Score</th>
              <th style={{ padding: '10px 14px' }}>Tactical Bias</th>
              <th style={{ padding: '10px 14px' }}>Confidence</th>
              <th style={{ padding: '10px 16px' }}>Primary Macro Transmission</th>
              <th style={{ padding: '10px 12px', textAlign: 'center' }}>Inspect</th>
            </tr>
          </thead>
          <tbody>
            {pairs.map((p) => {
              const isPositive = p.tactical_score >= 0;
              return (
                <tr
                  key={p.symbol}
                  onClick={() => onSelectAsset && onSelectAsset(p.symbol)}
                  style={{
                    borderBottom: '1px solid var(--border-subtle)',
                    cursor: 'pointer',
                    transition: 'background 0.12s ease',
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--bg-card-hover)')}
                  onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                >
                  <td className="mono" style={{ padding: '12px 16px', fontWeight: 700, color: p.rank <= 3 ? '#fbbf24' : 'var(--text-muted)' }}>
                    #{p.rank}
                  </td>

                  <td style={{ padding: '12px 16px' }}>
                    <span className="mono" style={{ fontSize: '0.92rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                      {p.symbol}
                    </span>
                    <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                      {p.name}
                    </div>
                  </td>

                  {/* Conviction Score */}
                  <td className="mono" style={{ padding: '12px 14px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{ fontWeight: 800, fontSize: '0.9rem', color: 'var(--accent-cyan)' }}>
                        {p.conviction_score.toFixed(1)}
                      </span>
                      <div style={{ width: 50, height: 4, background: 'var(--surface-3)', borderRadius: 2, overflow: 'hidden' }}>
                        <div style={{ width: `${Math.min(100, (p.conviction_score / 80) * 100)}%`, height: '100%', background: 'var(--accent-cyan)' }} />
                      </div>
                    </div>
                  </td>

                  <td className="mono" style={{ padding: '12px 14px', fontWeight: 700, color: isPositive ? 'var(--color-bullish)' : 'var(--color-bearish)' }}>
                    {p.tactical_score > 0 ? `+${p.tactical_score.toFixed(1)}` : p.tactical_score.toFixed(1)}
                  </td>

                  <td style={{ padding: '12px 14px' }}>
                    <span className={getBiasBadgeClass(p.bias)}>
                      {p.bias}
                    </span>
                  </td>

                  <td className="mono" style={{ padding: '12px 14px', color: 'var(--text-primary)', fontWeight: 600 }}>
                    {p.confidence.toFixed(0)}%
                  </td>

                  <td style={{ padding: '12px 16px', fontSize: '0.74rem', color: 'var(--text-secondary)' }}>
                    {p.primary_driver}
                  </td>

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
