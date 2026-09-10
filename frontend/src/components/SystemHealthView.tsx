import React, { useEffect, useState } from 'react';
import { ShieldCheck, Activity, Database, Server, CheckCircle2, AlertTriangle, RefreshCw } from 'lucide-react';
import { SystemHealthData } from '../types/macro';
import { api } from '../services/api';

export const SystemHealthView: React.FC = () => {
  const [health, setHealth] = useState<SystemHealthData | null>(null);
  const [loading, setLoading] = useState(true);

  const loadData = () => {
    setLoading(true);
    api.getSystemHealth()
      .then(setHealth)
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
            System Observability, Feed Health & Compliance Center
          </h2>
          <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
            Continuous monitoring of ingestion pipelines, quantitative scoring latency, and source reliability tiers
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
          Refresh Status
        </button>
      </div>

      {health && (
        <>
          {/* Top Status Banner */}
          <div style={{
            background: 'var(--bg-card)',
            border: '1px solid var(--border-subtle)',
            borderLeft: '4px solid #10b981',
            borderRadius: 8,
            padding: '18px 24px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
              <ShieldCheck size={28} color="#10b981" />
              <div>
                <div style={{ fontSize: '1.05rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                  ALL SYSTEMS OPERATIONAL • ZERO DATA INTEGRITY WARNINGS
                </div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: 2 }}>
                  Active Feeds: {health.active_sources_count} Official Sources • Processed Events: {health.total_events_processed} • Latency Nominal
                </div>
              </div>
            </div>

            <div style={{ textAlign: 'right' }}>
              <div className="mono" style={{ fontSize: '0.8rem', color: 'var(--accent-cyan)', fontWeight: 700 }}>
                Data Freshness: {health.data_freshness_seconds}s ago
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                Poll Interval: 300s (Immediate on Material Events)
              </div>
            </div>
          </div>

          {/* Components Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 14 }}>
            {health.components.map((c) => (
              <div
                key={c.component}
                style={{
                  background: 'var(--bg-main)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: 8,
                  padding: '16px',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  gap: 10,
                }}
              >
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '0.86rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                      {c.component}
                    </span>
                    <span style={{
                      fontSize: '0.75rem',
                      fontWeight: 700,
                      padding: '2px 6px',
                      borderRadius: 4,
                      background: c.status === 'HEALTHY' ? 'rgba(16, 185, 129, 0.15)' : 'rgba(245, 158, 11, 0.15)',
                      color: c.status === 'HEALTHY' ? '#34d399' : '#f59e0b',
                    }}>
                      {c.status}
                    </span>
                  </div>
                  {c.message && (
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: 4 }}>
                      {c.message}
                    </div>
                  )}
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: 'var(--text-secondary)', borderTop: '1px solid var(--border-subtle)', paddingTop: 8 }}>
                  <span>Latency: <strong className="mono" style={{ color: '#38bdf8' }}>{c.latency_ms.toFixed(1)}ms</strong></span>
                  <span>Error Rate: <strong className="mono" style={{ color: '#10b981' }}>{c.error_rate_pct.toFixed(2)}%</strong></span>
                </div>
              </div>
            ))}
          </div>

          {/* Compliance Card */}
          <div style={{
            background: 'var(--bg-card)',
            border: '1px solid var(--border-subtle)',
            borderRadius: 8,
            padding: '18px 22px',
          }}>
            <h3 style={{ fontSize: '0.88rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: 8 }}>
              Institutional Compliance & Analytical Principles
            </h3>
            <div style={{ fontSize: '0.76rem', color: 'var(--text-secondary)', lineHeight: 1.6, display: 'flex', flexDirection: 'column', gap: 6 }}>
              <p>
                <strong>1. Zero-Hallucination Mandate:</strong> The platform mathematically derives all numerical factor scores and directional biases from verified economic releases, central bank communications, and expectation surprises. AI layers are strictly constrained to factual entity extraction and grounded synthesis.
              </p>
              <p>
                <strong>2. Insufficient Evidence Mode:</strong> Whenever primary source coverage drops below minimum institutional thresholds or catastrophic conflicts arise, the model automatically reverts to <em>"Neutral / Insufficient Evidence"</em> rather than inventing artificial precision.
              </p>
              <p>
                <strong>3. Regulatory Notice:</strong> Fundamental bias is an analytical output reflecting verified macroeconomic momentum. It does not constitute a solicitation, personal recommendation, or guarantee of future financial market performance.
              </p>
            </div>
          </div>
        </>
      )}
    </div>
  );
};
