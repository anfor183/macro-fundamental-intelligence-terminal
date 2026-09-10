import React, { useEffect, useState } from 'react';
import {
  Compass, ShieldAlert, CheckCircle2, XCircle, AlertTriangle,
  TrendingUp, TrendingDown, Minus, Info, Layers, Users, Activity, Crosshair, Brain
} from 'lucide-react';
import { api } from '../services/api';
import { TraderConfluenceCard as ITraderConfluenceCard } from '../types/macro';

interface Props {
  symbol: string;
}

function biasColor(bias: string): string {
  if (bias.includes('STRONG BULLISH')) return 'var(--color-bullish-strong)';
  if (bias.includes('BULLISH')) return 'var(--color-bullish)';
  if (bias.includes('STRONG BEARISH')) return 'var(--color-bearish-strong)';
  if (bias.includes('BEARISH')) return 'var(--color-bearish)';
  return 'var(--color-neutral)';
}

function crowdingColor(index: number): string {
  if (index <= 18 || index >= 82) return 'var(--color-bearish)'; // Squeeze risk zone
  if (index <= 35 || index >= 65) return 'var(--accent-cyan)'; // Strong trend zone
  return 'var(--color-bullish)'; // Balanced healthy zone
}

export const TraderConfluenceCard: React.FC<Props> = ({ symbol }) => {
  const [card, setCard] = useState<ITraderConfluenceCard | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    setError(null);
    api.getTraderConfluenceCard(symbol)
      .then(data => {
        setCard(data);
        setLoading(false);
      })
      .catch(err => {
        setError(err.message);
        setLoading(false);
      });
  }, [symbol]);

  if (loading) {
    return (
      <div style={{
        background: 'var(--bg-card)',
        border: '1px solid var(--border-subtle)',
        borderRadius: 12,
        padding: '24px',
        textAlign: 'center',
        color: 'var(--text-muted)',
        fontSize: '0.85rem',
      }}>
        Analyzing Macro Differentials & CFTC Positioning for {symbol}…
      </div>
    );
  }

  if (error || !card) {
    return (
      <div style={{
        background: 'rgba(244,63,94,0.06)',
        border: '1px solid rgba(244,63,94,0.2)',
        borderRadius: 12,
        padding: '16px',
        color: '#f43f5e',
        fontSize: '0.8rem',
      }}>
        <AlertTriangle size={16} style={{ display: 'inline', marginRight: 6 }} />
        {error || 'Failed to load confluence intelligence'}
      </div>
    );
  }

  const bColor = biasColor(card.high_conviction_bias);

  return (
    <div style={{
      background: 'var(--bg-card)',
      border: '1px solid var(--border-subtle)',
      borderRadius: 12,
      padding: '22px 24px',
      display: 'flex',
      flexDirection: 'column',
      gap: 18,
      boxShadow: '0 4px 20px rgba(0,0,0,0.15)',
    }}>
      {/* ── Top Header Row ── */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 12 }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
            <Compass size={18} color="#38bdf8" />
            <h3 style={{ fontSize: '1.05rem', fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>
              Trader's Macro Confluence & Positioning Engine
            </h3>
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
            {card.asset_name} · Spot: <span className="mono" style={{ color: 'var(--text-primary)', fontWeight: 700 }}>{card.current_price}</span> · Daily ATR(14): <span className="mono" style={{ color: '#38bdf8' }}>{card.daily_atr}</span>
          </div>
        </div>

        {/* High-Conviction Bias Pill */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{
            background: `rgba(${bColor === '#10b981' || bColor === '#34d399' ? '16,185,129' : bColor === '#94a3b8' ? '148,163,184' : '244,63,94'},0.12)`,
            border: `1px solid ${bColor}`,
            borderRadius: 8,
            padding: '8px 14px',
            textAlign: 'right',
          }}>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Final Macro Bias
            </div>
            <div style={{ fontSize: '1.1rem', fontWeight: 900, color: bColor, letterSpacing: '0.03em' }}>
              {card.high_conviction_bias}
            </div>
            <div className="mono" style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
              Score: {card.high_conviction_score > 0 ? '+' : ''}{card.high_conviction_score.toFixed(1)} · Conf: {card.confidence_pct.toFixed(0)}%
            </div>
          </div>
        </div>
      </div>

      {/* ── Actionable Technical Directive Callout ── */}
      <div style={{
        background: card.high_conviction_score >= 15
          ? 'linear-gradient(135deg, rgba(16,185,129,0.08), rgba(6,182,212,0.04))'
          : card.high_conviction_score <= -15
          ? 'linear-gradient(135deg, rgba(244,63,94,0.08), rgba(236,72,153,0.04))'
          : 'rgba(100,116,139,0.08)',
        border: `1px solid ${bColor}44`,
        borderRadius: 10,
        padding: '14px 18px',
        display: 'flex',
        flexDirection: 'column',
        gap: 8,
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Crosshair size={16} color={bColor} />
            <span style={{ fontSize: '0.85rem', fontWeight: 800, color: bColor, letterSpacing: '0.04em' }}>
              {card.primary_direction}
            </span>
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
            Macro Invalidation: <strong className="mono" style={{ color: '#f43f5e' }}>{card.invalidation_price_level}</strong>
          </div>
        </div>

        <div style={{ fontSize: '0.79rem', color: 'var(--text-primary)', lineHeight: 1.5, fontWeight: 500 }}>
          {card.execution_directive}
        </div>
      </div>

      {/* ── Short Squeeze / Liquidation Warning (if active) ── */}
      {card.squeeze_warning && (
        <div style={{
          background: 'rgba(244,63,94,0.12)',
          border: '1px solid rgba(244,63,94,0.35)',
          borderRadius: 8,
          padding: '10px 14px',
          display: 'flex',
          alignItems: 'center',
          gap: 10,
        }}>
          <ShieldAlert size={18} color="#f43f5e" />
          <span style={{ fontSize: '0.75rem', color: '#f43f5e', fontWeight: 600 }}>
            {card.squeeze_warning}
          </span>
        </div>
      )}

      {/* ── CFTC COT Positioning & Crowding Gauge ── */}
      <div style={{
        background: 'var(--bg-main)',
        border: '1px solid var(--border-subtle)',
        borderRadius: 10,
        padding: '14px 18px',
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Users size={16} color="#38bdf8" />
            <span style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-primary)' }}>
              CFTC Institutional Speculative Crowding Index
            </span>
          </div>
          <span className="mono" style={{ fontSize: '0.85rem', fontWeight: 800, color: crowdingColor(card.cot_crowding_index) }}>
            {card.cot_crowding_index} / 100
          </span>
        </div>

        {/* Horizontal Spectrum Bar */}
        <div style={{ position: 'relative', height: 10, borderRadius: 5, background: 'linear-gradient(90deg, #f43f5e 0%, #38bdf8 30%, #10b981 50%, #38bdf8 70%, #f43f5e 100%)', marginBottom: 8 }}>
          {/* Needle / Marker */}
          <div style={{
            position: 'absolute',
            left: `${Math.max(2, Math.min(98, card.cot_crowding_index))}%`,
            top: -4,
            transform: 'translateX(-50%)',
            width: 18,
            height: 18,
            borderRadius: '50%',
            background: '#fff',
            border: `3px solid ${crowdingColor(card.cot_crowding_index)}`,
            boxShadow: '0 0 8px rgba(0,0,0,0.5)',
          }} />
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
          <span>Extreme Short Crowding (0)</span>
          <span>Balanced / Neutral (50)</span>
          <span>Extreme Long Crowding (100)</span>
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 10, fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
          <span>3Y COT Z-Score: <strong className="mono" style={{ color: 'var(--text-primary)' }}>{card.cot_zscore_3y > 0 ? '+' : ''}{card.cot_zscore_3y}</strong></span>
          <span>Positioning Stance: <strong style={{ color: crowdingColor(card.cot_crowding_index) }}>{card.cot_sentiment_label.replace(/_/g, ' ')}</strong></span>
        </div>
      </div>

      {/* ── Machine Learning XGBoost Confluence Section ── */}
      {card.ml_prediction && (
        <div style={{
          background: 'linear-gradient(135deg, rgba(99,102,241,0.06), rgba(168,85,247,0.06))',
          border: '1px solid rgba(168,85,247,0.25)',
          borderRadius: 10,
          padding: '14px 18px',
          display: 'flex',
          flexDirection: 'column',
          gap: 10,
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <Brain size={16} color="#c084fc" />
              <span style={{ fontSize: '0.82rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                XGBoost ML Directional Ensemble
              </span>
              <span style={{
                fontSize: '0.75rem',
                padding: '1px 6px',
                borderRadius: 4,
                background: 'rgba(168,85,247,0.2)',
                color: '#c084fc',
                fontWeight: 700,
              }}>
                {card.ml_prediction.model_version}
              </span>
            </div>
            <div style={{ display: 'flex', gap: 12, alignItems: 'center', fontSize: '0.75rem' }}>
              <span>ML Bias: <strong style={{ color: biasColor(card.ml_prediction.predicted_bias) }}>{card.ml_prediction.predicted_bias}</strong></span>
              <span>ML Conviction: <strong style={{ color: '#38bdf8' }}>{card.ml_prediction.ml_conviction_score.toFixed(0)}%</strong></span>
            </div>
          </div>

          {/* Probability Distribution Chips */}
          <div style={{ display: 'flex', gap: 10, fontSize: '0.75rem' }}>
            <span style={{ color: 'var(--text-muted)' }}>Probabilities:</span>
            <span style={{ color: '#34d399', fontWeight: 700 }}>
              Bull: {(card.ml_prediction.probability_distribution.BULLISH * 100).toFixed(0)}%
            </span>
            <span style={{ color: 'var(--text-muted)' }}>
              Neutral: {(card.ml_prediction.probability_distribution.NEUTRAL * 100).toFixed(0)}%
            </span>
            <span style={{ color: '#f87171', fontWeight: 700 }}>
              Bear: {(card.ml_prediction.probability_distribution.BEARISH * 100).toFixed(0)}%
            </span>
          </div>

          {/* Top Contributing Features */}
          {card.ml_prediction.feature_importances && card.ml_prediction.feature_importances.length > 0 && (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 2 }}>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', alignSelf: 'center' }}>Top Drivers:</span>
              {card.ml_prediction.feature_importances.slice(0, 3).map((f, i) => (
                <span
                  key={i}
                  style={{
                    fontSize: '0.75rem',
                    background: 'var(--surface-1)',
                    border: '1px solid var(--border-subtle)',
                    borderRadius: 4,
                    padding: '2px 7px',
                    color: f.directional_impact === 'BULLISH' ? '#34d399' : '#f87171',
                  }}
                >
                  {f.label} ({(f.importance_weight * 100).toFixed(0)}% wt)
                </span>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── 4-Pillars Confluence Meter ── */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        <div style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: 6 }}>
          <Layers size={15} color="#38bdf8" />
          4-Pillar Confluence Breakdown
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 10 }}>
          {card.pillars.map(p => {
            const pColor = p.status === 'BULLISH' ? '#10b981' : p.status === 'BEARISH' ? '#f43f5e' : '#94a3b8';
            return (
              <div key={p.name} style={{
                background: 'var(--bg-main)',
                border: '1px solid var(--border-subtle)',
                borderRadius: 8,
                padding: '10px 14px',
                display: 'flex',
                flexDirection: 'column',
                gap: 6,
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{p.label}</span>
                  <span style={{
                    fontSize: '0.75rem',
                    fontWeight: 800,
                    padding: '2px 6px',
                    borderRadius: 4,
                    background: `${pColor}18`,
                    color: pColor,
                  }}>
                    {p.status}
                  </span>
                </div>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
                  <span className="mono" style={{ fontSize: '1.1rem', fontWeight: 800, color: pColor }}>
                    {p.score > 0 ? '+' : ''}{p.score.toFixed(1)}
                  </span>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>({(p.weight * 100).toFixed(0)}% wt)</span>
                </div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-dim, #64748b)', lineHeight: 1.3 }}>
                  {p.details}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ── Trader's Macro Checklist ── */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
          Technical Execution Confluence Checklist
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 8 }}>
          {card.checklist.map((item, idx) => (
            <div key={idx} style={{
              display: 'flex',
              alignItems: 'flex-start',
              gap: 8,
              background: 'var(--bg-main)',
              padding: '8px 12px',
              borderRadius: 6,
              border: '1px solid var(--border-subtle)',
            }}>
              {item.passed ? (
                <CheckCircle2 size={15} color="#10b981" style={{ flexShrink: 0, marginTop: 2 }} />
              ) : (
                <XCircle size={15} color="#f43f5e" style={{ flexShrink: 0, marginTop: 2 }} />
              )}
              <div>
                <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                  {item.title}
                </div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                  {item.note}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
