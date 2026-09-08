import React, { useEffect, useState, useCallback } from 'react';
import {
  ShieldCheck, AlertTriangle, XCircle, RefreshCw, Wifi, WifiOff,
  Clock, CheckCircle2, Database, AlertCircle, Zap, Activity
} from 'lucide-react';
import { api } from '../services/api';
import { IntegrityStatus, ProviderHeartbeat, IntegrityIncident, GapDetection, ReconciliationResult } from '../types/macro';

// ─────────────────────────────────────────────────────────────
// Integrity Arc Gauge (SVG)
// ─────────────────────────────────────────────────────────────
function IntegrityGauge({ score, circuitBreakerActive }: { score: number; circuitBreakerActive: boolean }) {
  const R = 70, cx = 110, cy = 95;
  const startAngle = Math.PI;
  const endAngle = 2 * Math.PI;

  const scoreColor = score >= 70 ? '#10b981' : score >= 40 ? '#f59e0b' : '#f43f5e';

  const polar = (angle: number, r: number) => ({
    x: cx + r * Math.cos(angle),
    y: cy + r * Math.sin(angle),
  });

  const scoreAngle = startAngle + (score / 100) * Math.PI;
  const trackStart = polar(startAngle, R);
  const trackEnd = polar(endAngle, R);
  const scoreEnd = polar(scoreAngle, R);

  const arcPath = (from: number, to: number, r: number) => {
    const s = polar(from, r);
    const e = polar(to, r);
    const large = to - from > Math.PI ? 1 : 0;
    return `M${s.x},${s.y} A${r},${r} 0 ${large},1 ${e.x},${e.y}`;
  };

  return (
    <svg viewBox="0 0 220 115" style={{ width: 220, height: 115 }}>
      {/* Background arc */}
      <path d={arcPath(Math.PI, 2 * Math.PI, R)} fill="none" stroke="var(--border-subtle, #1e293b)" strokeWidth={14} strokeLinecap="round" />
      {/* Zone arcs */}
      <path d={arcPath(Math.PI, Math.PI + 0.4 * Math.PI, R)} fill="none" stroke="rgba(244,63,94,0.3)" strokeWidth={14} />
      <path d={arcPath(Math.PI + 0.4 * Math.PI, Math.PI + 0.7 * Math.PI, R)} fill="none" stroke="rgba(245,158,11,0.3)" strokeWidth={14} />
      <path d={arcPath(Math.PI + 0.7 * Math.PI, 2 * Math.PI, R)} fill="none" stroke="rgba(16,185,129,0.3)" strokeWidth={14} />
      {/* Score arc */}
      <path d={arcPath(Math.PI, scoreAngle, R)} fill="none" stroke={scoreColor} strokeWidth={14} strokeLinecap="round" />
      {/* Score text */}
      <text x={cx} y={cy - 8} textAnchor="middle" fontSize="28" fontWeight="800" fill={scoreColor} fontFamily="monospace">
        {Math.round(score)}
      </text>
      <text x={cx} y={cy + 10} textAnchor="middle" fontSize="9" fill="var(--text-muted, #64748b)" fontFamily="Inter, sans-serif">
        INTEGRITY SCORE
      </text>
      {/* Zone labels */}
      <text x={cx - R + 4} y={cy + 18} fontSize="7" fill="rgba(244,63,94,0.8)" fontFamily="Inter, sans-serif">CRITICAL</text>
      <text x={cx + R - 30} y={cy + 18} fontSize="7" fill="rgba(16,185,129,0.8)" fontFamily="Inter, sans-serif">HEALTHY</text>
    </svg>
  );
}

// ─────────────────────────────────────────────────────────────
// Status badge helpers
// ─────────────────────────────────────────────────────────────
function ProviderStatusBadge({ status }: { status: string }) {
  const cfg: Record<string, { color: string; bg: string; icon: React.ReactNode }> = {
    LIVE:    { color: '#10b981', bg: 'rgba(16,185,129,0.12)', icon: <Wifi size={10} /> },
    DELAYED: { color: '#f59e0b', bg: 'rgba(245,158,11,0.12)', icon: <Clock size={10} /> },
    STALE:   { color: '#f97316', bg: 'rgba(249,115,22,0.12)', icon: <AlertCircle size={10} /> },
    OFFLINE: { color: '#f43f5e', bg: 'rgba(244,63,94,0.12)', icon: <WifiOff size={10} /> },
  };
  const c = cfg[status] || cfg.STALE;
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 4,
      background: c.bg, color: c.color,
      fontSize: '0.65rem', fontWeight: 700, padding: '2px 7px', borderRadius: 4,
    }}>
      {c.icon} {status}
    </span>
  );
}

function SeverityBadge({ severity }: { severity: string }) {
  const cfg: Record<string, { color: string; bg: string }> = {
    CRITICAL: { color: '#f43f5e', bg: 'rgba(244,63,94,0.12)' },
    HIGH:     { color: '#f97316', bg: 'rgba(249,115,22,0.12)' },
    MEDIUM:   { color: '#f59e0b', bg: 'rgba(245,158,11,0.12)' },
    LOW:      { color: '#94a3b8', bg: 'rgba(148,163,184,0.1)' },
  };
  const c = cfg[severity] || cfg.LOW;
  return (
    <span style={{
      background: c.bg, color: c.color,
      fontSize: '0.65rem', fontWeight: 700, padding: '2px 6px', borderRadius: 4,
    }}>
      {severity}
    </span>
  );
}

function EventTypeBadge({ type }: { type: string }) {
  const labels: Record<string, string> = {
    STALE_DATA: 'STALE',
    SCHEMA_DRIFT: 'SCHEMA',
    GAP_DETECTED: 'GAP',
    SOURCE_DIVERGENCE: 'DIVERGENCE',
    CIRCUIT_BREAKER_OPEN: 'CB OPEN',
    CIRCUIT_BREAKER_CLOSED: 'CB CLOSED',
    PROVIDER_OFFLINE: 'OFFLINE',
  };
  return (
    <span style={{ background: 'rgba(56,189,248,0.1)', color: '#38bdf8', fontSize: '0.62rem', fontWeight: 700, padding: '2px 6px', borderRadius: 4, letterSpacing: '0.04em' }}>
      {labels[type] || type}
    </span>
  );
}

// ─────────────────────────────────────────────────────────────
// Sub-score bar
// ─────────────────────────────────────────────────────────────
function SubScoreBar({ label, score, weight, color }: { label: string; score: number; weight: string; color: string }) {
  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
        <span style={{ fontSize: '0.72rem', color: 'var(--text-secondary)' }}>{label}</span>
        <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>{weight} weight</span>
          <span className="mono" style={{ fontSize: '0.78rem', fontWeight: 800, color }}>{score.toFixed(1)}/100</span>
        </span>
      </div>
      <div style={{ height: 5, background: 'var(--bg-main)', borderRadius: 3, overflow: 'hidden' }}>
        <div style={{ height: '100%', width: `${score}%`, background: color, borderRadius: 3, transition: 'width 0.6s ease' }} />
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Main Component
// ─────────────────────────────────────────────────────────────
export const DataIntegrityDashboard: React.FC = () => {
  const [data, setData] = useState<IntegrityStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'heartbeat' | 'schema' | 'gaps' | 'reconcile' | 'incidents'>('heartbeat');

  const load = useCallback(() => {
    setLoading(true);
    setError(null);
    api.getIntegrityStatus()
      .then((d) => { setData(d); setLoading(false); })
      .catch((e) => { setError(e.message); setLoading(false); });
  }, []);

  useEffect(() => { load(); const t = setInterval(load, 30000); return () => clearInterval(t); }, [load]);

  const card = {
    background: 'var(--bg-card)',
    border: '1px solid var(--border-subtle)',
    borderRadius: 10,
    padding: '18px 22px',
  } as React.CSSProperties;

  const tabBtn = (id: typeof activeTab) => ({
    background: activeTab === id ? 'var(--bg-card)' : 'transparent',
    border: activeTab === id ? '1px solid var(--border-subtle)' : '1px solid transparent',
    color: activeTab === id ? 'var(--text-primary)' : 'var(--text-muted)',
    padding: '5px 12px',
    borderRadius: 6,
    fontSize: '0.75rem',
    fontWeight: 600,
    cursor: 'pointer',
  } as React.CSSProperties);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 22 }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
            <ShieldCheck size={20} color="#10b981" />
            <h2 style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>
              Continuous Data Integrity Engine
            </h2>
          </div>
          <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
            Provider heartbeats · Schema validation · Gap detection · Source reconciliation · Circuit breaker
          </div>
        </div>
        <button
          onClick={load}
          disabled={loading}
          style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'var(--bg-card)', border: '1px solid var(--border-subtle)', color: 'var(--text-secondary)', padding: '6px 12px', borderRadius: 6, fontSize: '0.75rem', cursor: 'pointer', opacity: loading ? 0.6 : 1 }}
        >
          <RefreshCw size={13} style={{ animation: loading ? 'spin 1s linear infinite' : 'none' }} />
          Refresh
        </button>
      </div>

      {error && (
        <div style={{ background: 'rgba(244,63,94,0.08)', border: '1px solid rgba(244,63,94,0.3)', borderRadius: 8, padding: '12px 16px', color: '#f43f5e', fontSize: '0.8rem' }}>
          <AlertTriangle size={14} style={{ marginRight: 6 }} /> {error}
        </div>
      )}

      {data && (
        <>
          {/* ── Circuit Breaker Banner ── */}
          {data.circuit_breaker_active && (
            <div style={{
              background: 'rgba(244,63,94,0.08)',
              border: '1px solid rgba(244,63,94,0.4)',
              borderLeft: '4px solid #f43f5e',
              borderRadius: 8,
              padding: '14px 20px',
              display: 'flex',
              alignItems: 'flex-start',
              gap: 14,
            }}>
              <Zap size={20} color="#f43f5e" style={{ flexShrink: 0, marginTop: 2 }} />
              <div>
                <div style={{ fontSize: '0.9rem', fontWeight: 800, color: '#f43f5e', marginBottom: 4 }}>
                  ⚡ CIRCUIT BREAKER ACTIVE — Model Confidence Downgraded
                </div>
                <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                  {data.circuit_breaker_reason}
                </div>
              </div>
            </div>
          )}

          {/* ── Gauge + Sub-scores ── */}
          <div style={{ display: 'grid', gridTemplateColumns: 'auto 1fr', gap: 24, alignItems: 'center', ...card }}>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
              <IntegrityGauge score={data.integrity_score} circuitBreakerActive={data.circuit_breaker_active} />
              <div style={{
                display: 'inline-flex', alignItems: 'center', gap: 6,
                background: data.circuit_breaker_active ? 'rgba(244,63,94,0.12)' : 'rgba(16,185,129,0.12)',
                color: data.circuit_breaker_active ? '#f43f5e' : '#10b981',
                fontSize: '0.7rem', fontWeight: 700, padding: '4px 10px', borderRadius: 6,
              }}>
                {data.circuit_breaker_active ? <Zap size={11} /> : <CheckCircle2 size={11} />}
                Circuit Breaker {data.circuit_breaker_active ? 'OPEN' : 'CLOSED'}
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: 4 }}>
                Score Decomposition
              </div>
              <SubScoreBar label="Data Freshness" score={data.freshness_score} weight="40%" color="#38bdf8" />
              <SubScoreBar label="Schema Health" score={data.schema_health_score} weight="30%" color="#a78bfa" />
              <SubScoreBar label="Gap Rate" score={data.gap_rate_score} weight="30%" color="#10b981" />

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10, marginTop: 4 }}>
                {[
                  { label: 'Total Providers', val: data.provider_heartbeats.length },
                  { label: 'LIVE Feeds', val: data.provider_heartbeats.filter(h => h.status === 'LIVE').length, color: '#10b981' },
                  { label: 'Open Incidents', val: data.incidents.filter(i => !i.resolved).length, color: data.incidents.filter(i => !i.resolved).length > 0 ? '#f59e0b' : '#10b981' },
                ].map(stat => (
                  <div key={stat.label} style={{ background: 'var(--bg-main)', border: '1px solid var(--border-subtle)', borderRadius: 8, padding: '10px 14px', textAlign: 'center' }}>
                    <div className="mono" style={{ fontSize: '1.4rem', fontWeight: 800, color: stat.color || 'var(--text-primary)' }}>{stat.val}</div>
                    <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', marginTop: 2 }}>{stat.label}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* ── Tabs ── */}
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {([
              ['heartbeat', 'Provider Heartbeats', data.provider_heartbeats.length],
              ['schema', 'Schema Health', data.schema_reports.filter(r => !r.is_healthy).length + ' issues'],
              ['gaps', 'Gap Detections', data.gap_detections.length],
              ['reconcile', 'Source Reconciliation', data.reconciliation_results.length],
              ['incidents', 'Incident Log', data.incidents.length],
            ] as [typeof activeTab, string, string | number][]).map(([id, label, count]) => (
              <button key={id} onClick={() => setActiveTab(id)} style={tabBtn(id)}>
                {label}
                <span style={{ marginLeft: 6, background: 'rgba(100,116,139,0.15)', color: 'var(--text-muted)', fontSize: '0.6rem', fontWeight: 700, padding: '1px 5px', borderRadius: 3 }}>
                  {count}
                </span>
              </button>
            ))}
          </div>

          {/* ── Provider Heartbeat Matrix ── */}
          {activeTab === 'heartbeat' && (
            <div style={card}>
              <div style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: 14 }}>
                Provider Heartbeat Matrix — {data.provider_heartbeats.length} Data Sources
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 10 }}>
                {data.provider_heartbeats.map(hb => (
                  <div key={hb.provider_id} style={{
                    background: 'var(--bg-main)',
                    border: `1px solid ${hb.status === 'OFFLINE' ? 'rgba(244,63,94,0.3)' : hb.status === 'STALE' ? 'rgba(249,115,22,0.2)' : 'var(--border-subtle)'}`,
                    borderRadius: 8,
                    padding: '12px 14px',
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                      <div>
                        <div style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-primary)', lineHeight: 1.3 }}>{hb.provider_name}</div>
                        <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', marginTop: 2 }}>
                          {hb.data_category} · {hb.country}
                        </div>
                      </div>
                      <ProviderStatusBadge status={hb.status} />
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.7rem', borderTop: '1px solid var(--border-subtle)', paddingTop: 8 }}>
                      <span style={{ color: 'var(--text-secondary)' }}>
                        Last seen: <span className="mono" style={{ color: hb.freshness_delta_minutes < 60 ? '#10b981' : hb.freshness_delta_minutes < 120 ? '#f59e0b' : '#f43f5e' }}>
                          {hb.freshness_delta_minutes < 60 ? `${Math.round(hb.freshness_delta_minutes)}m` : `${(hb.freshness_delta_minutes / 60).toFixed(1)}h`} ago
                        </span>
                      </span>
                      {hb.schema_drift_events_24h > 0 && (
                        <span style={{ color: '#f59e0b', fontSize: '0.65rem' }}>
                          {hb.schema_drift_events_24h} drift events
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ── Schema Health ── */}
          {activeTab === 'schema' && (
            <div style={card}>
              <div style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: 14 }}>
                Schema Validation Reports
              </div>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.76rem' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--border-subtle)', color: 'var(--text-muted)' }}>
                    <th style={{ padding: '7px 12px', textAlign: 'left', fontWeight: 600 }}>Provider</th>
                    <th style={{ padding: '7px 12px', textAlign: 'right', fontWeight: 600 }}>Expected</th>
                    <th style={{ padding: '7px 12px', textAlign: 'right', fontWeight: 600 }}>Received</th>
                    <th style={{ padding: '7px 12px', textAlign: 'left', fontWeight: 600 }}>Missing Fields</th>
                    <th style={{ padding: '7px 12px', textAlign: 'right', fontWeight: 600 }}>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {data.schema_reports.map(r => (
                    <tr key={r.provider_id} style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                      <td style={{ padding: '9px 12px', color: 'var(--text-primary)', fontWeight: 600 }}>
                        {r.provider_id}
                      </td>
                      <td className="mono" style={{ padding: '9px 12px', textAlign: 'right', color: 'var(--text-secondary)' }}>
                        {r.expected_fields.length}
                      </td>
                      <td className="mono" style={{ padding: '9px 12px', textAlign: 'right', color: 'var(--text-secondary)' }}>
                        {r.received_fields.length}
                      </td>
                      <td style={{ padding: '9px 12px', color: r.missing_fields.length > 0 ? '#f43f5e' : 'var(--text-muted)' }}>
                        {r.missing_fields.length > 0 ? r.missing_fields.join(', ') : '—'}
                      </td>
                      <td style={{ padding: '9px 12px', textAlign: 'right' }}>
                        {r.is_healthy ? (
                          <span style={{ color: '#10b981', fontSize: '0.7rem', fontWeight: 700 }}>✓ HEALTHY</span>
                        ) : (
                          <span style={{ color: '#f43f5e', fontSize: '0.7rem', fontWeight: 700 }}>⚠ DRIFT</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* ── Gap Detection ── */}
          {activeTab === 'gaps' && (
            <div style={card}>
              <div style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: 14 }}>
                Gap Detection Log — Expected-but-Missing Releases
              </div>
              {data.gap_detections.length === 0 ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, color: '#10b981', fontSize: '0.82rem', padding: '16px 0' }}>
                  <CheckCircle2 size={16} /> No gaps detected in expected release windows.
                </div>
              ) : (
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.76rem' }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid var(--border-subtle)', color: 'var(--text-muted)' }}>
                      <th style={{ padding: '7px 12px', textAlign: 'left', fontWeight: 600 }}>Release</th>
                      <th style={{ padding: '7px 12px', textAlign: 'left', fontWeight: 600 }}>Country</th>
                      <th style={{ padding: '7px 12px', textAlign: 'right', fontWeight: 600 }}>Hours Overdue</th>
                      <th style={{ padding: '7px 12px', textAlign: 'right', fontWeight: 600 }}>Severity</th>
                      <th style={{ padding: '7px 12px', textAlign: 'left', fontWeight: 600 }}>Auto-Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.gap_detections.map(g => (
                      <tr key={g.release_id} style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                        <td style={{ padding: '9px 12px', color: 'var(--text-primary)', fontWeight: 600 }}>{g.expected_release}</td>
                        <td style={{ padding: '9px 12px', color: 'var(--text-secondary)' }}>{g.country}</td>
                        <td className="mono" style={{ padding: '9px 12px', textAlign: 'right', color: g.hours_overdue >= 48 ? '#f43f5e' : g.hours_overdue >= 24 ? '#f97316' : '#f59e0b', fontWeight: 700 }}>
                          {g.hours_overdue.toFixed(1)}h
                        </td>
                        <td style={{ padding: '9px 12px', textAlign: 'right' }}>
                          <SeverityBadge severity={g.severity} />
                        </td>
                        <td style={{ padding: '9px 12px', color: 'var(--text-muted)', fontSize: '0.7rem' }}>{g.auto_action}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          )}

          {/* ── Source Reconciliation ── */}
          {activeTab === 'reconcile' && (
            <div style={card}>
              <div style={{ marginBottom: 14 }}>
                <div style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                  Source Reconciliation — Cross-Provider Divergence
                </div>
                <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: 2 }}>
                  Flags when the same indicator differs by &gt;10% across official sources.
                </div>
              </div>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.76rem' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--border-subtle)', color: 'var(--text-muted)' }}>
                    <th style={{ padding: '7px 12px', textAlign: 'left', fontWeight: 600 }}>Indicator</th>
                    <th style={{ padding: '7px 12px', textAlign: 'left', fontWeight: 600 }}>Provider A</th>
                    <th style={{ padding: '7px 12px', textAlign: 'right', fontWeight: 600 }}>Value A</th>
                    <th style={{ padding: '7px 12px', textAlign: 'left', fontWeight: 600 }}>Provider B</th>
                    <th style={{ padding: '7px 12px', textAlign: 'right', fontWeight: 600 }}>Value B</th>
                    <th style={{ padding: '7px 12px', textAlign: 'right', fontWeight: 600 }}>Divergence</th>
                    <th style={{ padding: '7px 12px', textAlign: 'center', fontWeight: 600 }}>Flag</th>
                  </tr>
                </thead>
                <tbody>
                  {data.reconciliation_results.map(r => (
                    <tr key={r.indicator_name} style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                      <td style={{ padding: '9px 12px', color: 'var(--text-primary)', fontWeight: 600 }}>{r.indicator_name}</td>
                      <td style={{ padding: '9px 12px', color: 'var(--text-muted)', fontSize: '0.7rem' }}>{r.provider_a}</td>
                      <td className="mono" style={{ padding: '9px 12px', textAlign: 'right', color: 'var(--text-secondary)' }}>{r.value_a}</td>
                      <td style={{ padding: '9px 12px', color: 'var(--text-muted)', fontSize: '0.7rem' }}>{r.provider_b}</td>
                      <td className="mono" style={{ padding: '9px 12px', textAlign: 'right', color: 'var(--text-secondary)' }}>{r.value_b}</td>
                      <td className="mono" style={{ padding: '9px 12px', textAlign: 'right', color: r.is_flagged ? '#f43f5e' : '#10b981', fontWeight: 700 }}>
                        {r.divergence_pct.toFixed(2)}%
                      </td>
                      <td style={{ padding: '9px 12px', textAlign: 'center' }}>
                        {r.is_flagged
                          ? <span style={{ color: '#f43f5e', fontWeight: 700 }}>⚠ FLAG</span>
                          : <span style={{ color: '#10b981', fontWeight: 700 }}>✓</span>}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* ── Incident Log ── */}
          {activeTab === 'incidents' && (
            <div style={card}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
                <div style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                  Incident Center — {data.incidents.length} Active Incidents
                </div>
                <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                  Sorted by recency
                </div>
              </div>
              {data.incidents.length === 0 ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, color: '#10b981', fontSize: '0.82rem', padding: '16px 0' }}>
                  <CheckCircle2 size={16} /> No active integrity incidents.
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {data.incidents.map(inc => (
                    <div key={inc.incident_id} style={{
                      background: 'var(--bg-main)',
                      border: `1px solid ${inc.severity === 'CRITICAL' ? 'rgba(244,63,94,0.25)' : inc.severity === 'HIGH' ? 'rgba(249,115,22,0.2)' : 'var(--border-subtle)'}`,
                      borderRadius: 8,
                      padding: '12px 16px',
                    }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                          <span className="mono" style={{ fontSize: '0.65rem', color: 'var(--text-dim, #475569)' }}>{inc.incident_id}</span>
                          <EventTypeBadge type={inc.event_type} />
                          <SeverityBadge severity={inc.severity} />
                        </div>
                        <span className="mono" style={{ fontSize: '0.65rem', color: 'var(--text-muted)', whiteSpace: 'nowrap', marginLeft: 12 }}>
                          {new Date(inc.occurred_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                      <div style={{ fontSize: '0.76rem', color: 'var(--text-secondary)', lineHeight: 1.5, marginBottom: 6 }}>
                        {inc.description}
                      </div>
                      <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 6 }}>
                        <Activity size={11} style={{ color: '#38bdf8' }} />
                        Auto-action: <span style={{ color: '#38bdf8' }}>{inc.auto_action_taken}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
};
