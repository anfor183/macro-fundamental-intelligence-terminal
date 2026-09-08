import React, { useEffect, useState } from 'react';
import { History, ArrowRight, TrendingUp, TrendingDown, RefreshCw } from 'lucide-react';
import { WhatChangedItem } from '../types/macro';
import { api } from '../services/api';
import { getBiasBadgeClass } from './AssetTable';

export const WhatChangedView: React.FC<{ onSelectAsset?: (symbol: string) => void }> = ({ onSelectAsset }) => {
  const [changes, setChanges] = useState<WhatChangedItem[]>([]);
  const [loading, setLoading] = useState(true);

  const loadData = () => {
    setLoading(true);
    api.getWhatChanged()
      .then((data) => {
        setChanges(data);
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setLoading(false);
      });
  };

  useEffect(() => {
    loadData();
  }, []);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h2 style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--text-primary)' }}>
            What Changed Today? — Macro Bias Transitions & Delta Log
          </h2>
          <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
            Chronological audit trail of fundamental score shifts, catalytic drivers, and bias threshold crossings
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

      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {changes.map((item) => {
          const dt = new Date(item.timestamp);
          const isScoreUp = item.delta_score >= 0;

          return (
            <div
              key={item.id}
              onClick={() => onSelectAsset && onSelectAsset(item.asset_symbol)}
              style={{
                background: 'var(--bg-card)',
                border: '1px solid var(--border-subtle)',
                borderRadius: 8,
                padding: '16px 20px',
                cursor: 'pointer',
                transition: 'border-color 0.15s ease',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.borderColor = 'var(--border-active)')}
              onMouseLeave={(e) => (e.currentTarget.style.borderColor = 'var(--border-subtle)')}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                {/* Left: Symbol, Transition, Timestamps */}
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <span className="mono" style={{ fontSize: '1.05rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                      {item.asset_symbol}
                    </span>
                    <span className={getBiasBadgeClass(item.previous_bias)} style={{ opacity: 0.7 }}>
                      {item.previous_bias}
                    </span>
                    <ArrowRight size={14} color="var(--text-muted)" />
                    <span className={getBiasBadgeClass(item.new_bias)}>
                      {item.new_bias}
                    </span>
                  </div>

                  <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: 4 }}>
                    {dt.toLocaleDateString()} at {dt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })} UTC
                  </div>
                </div>

                {/* Right: Score Delta & Confidence */}
                <div style={{ textAlign: 'right' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, justifyContent: 'flex-end' }}>
                    <span className="mono" style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                      {item.previous_score > 0 ? `+${item.previous_score.toFixed(1)}` : item.previous_score.toFixed(1)}
                    </span>
                    <ArrowRight size={12} color="var(--text-dim)" />
                    <span className="mono" style={{
                      fontSize: '1.05rem',
                      fontWeight: 800,
                      color: item.new_score >= 0 ? '#10b981' : '#ef4444',
                    }}>
                      {item.new_score > 0 ? `+${item.new_score.toFixed(1)}` : item.new_score.toFixed(1)}
                    </span>
                    <span style={{
                      fontSize: '0.72rem',
                      fontWeight: 700,
                      color: isScoreUp ? '#34d399' : '#f87171',
                      background: isScoreUp ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                      padding: '2px 6px',
                      borderRadius: 4,
                    }}>
                      {isScoreUp ? `+${item.delta_score.toFixed(1)}` : item.delta_score.toFixed(1)} pts
                    </span>
                  </div>
                  <div style={{ fontSize: '0.68rem', color: 'var(--text-dim)', marginTop: 2 }}>
                    Confidence: {item.confidence.toFixed(0)}%
                  </div>
                </div>
              </div>

              {/* Drivers summary */}
              <div style={{
                marginTop: 12,
                paddingTop: 10,
                borderTop: '1px solid var(--border-subtle)',
                fontSize: '0.8rem',
                color: '#cbd5e1',
              }}>
                <span style={{ fontWeight: 700, color: 'var(--accent-cyan)' }}>Primary Catalyst: </span>
                {item.primary_driver}
                {item.secondary_driver && (
                  <span style={{ color: 'var(--text-muted)', marginLeft: 8 }}>
                    • Secondary: {item.secondary_driver}
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
