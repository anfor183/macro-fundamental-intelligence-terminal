import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  Activity,
  AlertTriangle,
  ArrowDownRight,
  ArrowUpRight,
  BarChart3,
  BookOpen,
  Calendar,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  ClipboardList,
  Clock,
  Filter,
  FlaskConical,
  History,
  RefreshCw,
  ScanSearch,
  Search,
  ShieldCheck,
  Sparkles,
  Target,
  TrendingDown,
  TrendingUp,
  TriangleAlert,
  XCircle,
  Zap,
} from 'lucide-react';
import { api } from '../services/api';
import {
  ForwardTestEntry,
  ForwardTestLogResponse,
  ForwardTestStats,
  HistoricalPastSignal,
  HistoricalSignalsResponse,
  RegimeBacktestTimeline,
  RegimeSignal,
  RegimeSignalBacktest,
  RegimeSignalRegimeBreakdown,
  RegimeSignalsResponse,
  ScoreHistoryPoint,
} from '../types/macro';

// ── Color helpers ─────────────────────────────────────────────────────────────

function strengthColor(strength: string) {
  if (strength === 'MAJOR') return '#f43f5e';
  if (strength === 'MODERATE') return '#f59e0b';
  return '#64748b';
}

function strengthBg(strength: string) {
  if (strength === 'MAJOR') return 'rgba(244,63,94,0.12)';
  if (strength === 'MODERATE') return 'rgba(245,158,11,0.12)';
  return 'rgba(100,116,139,0.1)';
}

function directionColor(dir: string) {
  return dir === 'BULLISH' ? '#10b981' : '#f43f5e';
}

function hitRateColor(pct: number) {
  if (pct >= 65) return '#10b981';
  if (pct >= 52) return '#f59e0b';
  return '#f43f5e';
}

function outcomeColor(outcome: string) {
  if (outcome === 'WIN') return '#10b981';
  if (outcome === 'LOSS') return '#f43f5e';
  if (outcome === 'DRAW') return '#64748b';
  return '#38bdf8';
}

function returnColor(val: number) {
  if (val > 0.2) return '#10b981';
  if (val < -0.2) return '#f43f5e';
  return '#64748b';
}

function formatAssetPrice(symbol?: string, price?: number | null) {
  if (price === undefined || price === null || price === 0) return '—';
  if (symbol === 'USDJPY' || symbol === 'SPX' || symbol === 'CL' || symbol === 'XAUUSD') {
    return price.toFixed(2);
  }
  return price.toFixed(4);
}

// ── Mini score sparkline ──────────────────────────────────────────────────────

function ScoreSparkline({ history }: { history: ScoreHistoryPoint[] }) {
  if (!history || history.length < 2) return null;
  const W = 280, H = 70;
  const scores = history.map((h) => h.score);
  const min = Math.min(...scores, -5);
  const max = Math.max(...scores, 5);
  const range = max - min || 1;
  const pts = scores.map((s, i) => {
    const x = (i / (scores.length - 1)) * W;
    const y = H - ((s - min) / range) * H;
    return `${x.toFixed(1)},${y.toFixed(1)}`;
  });
  const zeroY = H - ((0 - min) / range) * H;

  return (
    <svg width={W} height={H} style={{ overflow: 'visible' }}>
      {/* Zero line */}
      <line x1={0} y1={zeroY} x2={W} y2={zeroY} stroke="rgba(255,255,255,0.1)" strokeWidth={1} strokeDasharray="3,3" />
      {/* Fill gradient */}
      <defs>
        <linearGradient id="sg" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#38bdf8" stopOpacity={0.35} />
          <stop offset="100%" stopColor="#38bdf8" stopOpacity={0.02} />
        </linearGradient>
      </defs>
      <polyline
        points={pts.join(' ')}
        fill="none"
        stroke="#38bdf8"
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* Dots for COT z-score extremes */}
      {history.map((h, i) => {
        if (Math.abs(h.cot_zscore) < 1.5) return null;
        const x = (i / (scores.length - 1)) * W;
        const y = H - ((h.score - min) / range) * H;
        return (
          <circle
            key={i}
            cx={x}
            cy={y}
            r={3.5}
            fill={h.cot_zscore > 0 ? '#10b981' : '#f43f5e'}
            stroke="var(--surface-1)"
            strokeWidth={1.5}
          />
        );
      })}
    </svg>
  );
}

// ── Pillar Gauge Ring ─────────────────────────────────────────────────────────

function PillarRing({
  label,
  value,
  color,
  size = 64,
}: {
  label: string;
  value: number; // 0–100
  color: string;
  size?: number;
}) {
  const r = size / 2 - 6;
  const circ = 2 * Math.PI * r;
  const dash = (value / 100) * circ;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
      <svg width={size} height={size}>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="rgba(255,255,255,0.07)" strokeWidth={6} />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={color}
          strokeWidth={6}
          strokeDasharray={`${dash} ${circ - dash}`}
          strokeLinecap="round"
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
          style={{ transition: 'stroke-dasharray 0.6s ease' }}
        />
        <text
          x={size / 2}
          y={size / 2 + 5}
          textAnchor="middle"
          fill={color}
          fontSize={11}
          fontWeight={700}
          fontFamily="monospace"
        >
          {value.toFixed(0)}%
        </text>
      </svg>
      <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textAlign: 'center', maxWidth: size }}>
        {label}
      </span>
    </div>
  );
}

// ── Backtest regime bar ───────────────────────────────────────────────────────

function RegimeBar({ regime }: { regime: RegimeSignalRegimeBreakdown }) {
  const color = hitRateColor(regime.hit_rate_pct);
  return (
    <div style={{ marginBottom: 8 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 3 }}>
        <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {regime.regime_name}
        </span>
        <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>N={regime.total}</span>
          <span style={{ fontSize: '0.75rem', fontWeight: 700, color, fontFamily: 'monospace' }}>{regime.hit_rate_pct.toFixed(1)}%</span>
        </div>
      </div>
      <div style={{ height: 4, background: 'rgba(255,255,255,0.06)', borderRadius: 2 }}>
        <div style={{ height: '100%', width: `${regime.hit_rate_pct}%`, background: color, borderRadius: 2, transition: 'width 0.5s ease' }} />
      </div>
    </div>
  );
}

// ── Timeline Scatter ──────────────────────────────────────────────────────────

function TimelineChart({ timeline }: { timeline: RegimeBacktestTimeline[] }) {
  if (!timeline || timeline.length < 2) return null;
  const W = 360, H = 80;
  const rets = timeline.map((t) => t.forward_return_pct);
  const minR = Math.min(...rets, -2);
  const maxR = Math.max(...rets, 2);
  const range = maxR - minR || 1;
  const zeroY = H - ((0 - minR) / range) * H;
  return (
    <svg width="100%" height={H} viewBox={`0 0 ${W} ${H}`} style={{ overflow: 'visible' }}>
      <line x1={0} y1={zeroY} x2={W} y2={zeroY} stroke="rgba(255,255,255,0.1)" strokeWidth={1} strokeDasharray="3,3" />
      {timeline.map((t, i) => {
        const x = (i / (timeline.length - 1)) * W;
        const y = H - ((t.forward_return_pct - minR) / range) * H;
        const fill = t.is_correct ? '#10b981' : '#f43f5e';
        return <circle key={i} cx={x} cy={y} r={4} fill={fill} fillOpacity={0.85} />;
      })}
    </svg>
  );
}

// ── Asset Past Signals Audit Table (Inside Deep Dive) ──────────────────────────

function AssetPastSignalsTable({
  timeline,
  symbol,
  onOpenJournal,
}: {
  timeline: RegimeBacktestTimeline[];
  symbol?: string;
  onOpenJournal?: () => void;
}) {
  const [filter, setFilter] = useState<'ALL' | 'WIN' | 'LOSS'>('ALL');
  const [expanded, setExpanded] = useState(false);

  const winsCount = timeline.filter((t) => t.is_correct).length;
  const lossesCount = timeline.filter((t) => !t.is_correct).length;

  const filtered = timeline.filter((t) => {
    if (filter === 'WIN') return t.is_correct;
    if (filter === 'LOSS') return !t.is_correct;
    return true;
  });

  const displayed = expanded ? filtered : filtered.slice(0, 8);

  return (
    <div
      style={{
        marginTop: 10,
        background: 'rgba(0,0,0,0.22)',
        borderRadius: 8,
        padding: '10px 12px',
        border: '1px solid rgba(255,255,255,0.06)',
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8, flexWrap: 'wrap', gap: 6 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <History size={13} color="#38bdf8" />
          <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-secondary)' }}>
            HISTORICAL SIGNALS LOG ({timeline.length} Total)
          </span>
        </div>
        <div style={{ display: 'flex', gap: 3, background: 'rgba(255,255,255,0.04)', borderRadius: 5, padding: 2 }}>
          {(['ALL', 'WIN', 'LOSS'] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              style={{
                fontSize: '0.75rem',
                padding: '2px 6px',
                borderRadius: 4,
                border: 'none',
                background: filter === f
                  ? f === 'WIN' ? 'rgba(16,185,129,0.18)' : f === 'LOSS' ? 'rgba(244,63,94,0.18)' : 'rgba(255,255,255,0.12)'
                  : 'transparent',
                color: filter === f
                  ? f === 'WIN' ? '#10b981' : f === 'LOSS' ? '#f43f5e' : '#fff'
                  : 'var(--text-muted)',
                cursor: 'pointer',
                fontWeight: 700,
              }}
            >
              {f === 'ALL' ? `All (${timeline.length})` : f === 'WIN' ? `Wins (${winsCount})` : `Losses (${lossesCount})`}
            </button>
          ))}
        </div>
      </div>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '80px 65px 70px 70px 65px 55px',
          gap: 4,
          fontSize: '0.75rem',
          color: 'var(--text-muted)',
          fontWeight: 700,
          paddingBottom: 4,
          borderBottom: '1px solid rgba(255,255,255,0.06)',
          marginBottom: 4,
        }}
      >
        <span>DATE</span>
        <span>DIR</span>
        <span>ENTRY</span>
        <span>EXIT</span>
        <span>RETURN</span>
        <span style={{ textAlign: 'right' }}>RESULT</span>
      </div>

      <div style={{ maxHeight: 200, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 3 }}>
        {displayed.map((t, idx) => (
          <div
            key={idx}
            style={{
              display: 'grid',
              gridTemplateColumns: '80px 65px 70px 70px 65px 55px',
              gap: 4,
              fontSize: '0.75rem',
              padding: '4px 0',
              borderBottom: '1px solid rgba(255,255,255,0.03)',
              alignItems: 'center',
            }}
          >
            <span style={{ fontFamily: 'monospace', color: 'var(--text-secondary)' }}>{t.date}</span>
            <span style={{ color: t.direction === 'BULLISH' ? '#10b981' : '#f43f5e', fontWeight: 700 }}>
              {t.direction === 'BULLISH' ? '▲ BUY' : '▼ SELL'}
            </span>
            <span style={{ fontFamily: 'monospace', color: 'var(--text-muted)' }}>
              {formatAssetPrice(symbol, t.entry_price)}
            </span>
            <span style={{ fontFamily: 'monospace', color: 'var(--text-muted)' }}>
              {formatAssetPrice(symbol, t.exit_price)}
            </span>
            <span style={{ fontFamily: 'monospace', color: t.is_correct ? '#10b981' : '#f43f5e', fontWeight: 700 }}>
              {t.forward_return_pct > 0 ? `+${t.forward_return_pct.toFixed(2)}%` : `${t.forward_return_pct.toFixed(2)}%`}
            </span>
            <span style={{ textAlign: 'right' }}>
              <span
                style={{
                  fontSize: '0.75rem',
                  fontWeight: 800,
                  padding: '1px 5px',
                  borderRadius: 3,
                  background: t.is_correct ? 'rgba(16,185,129,0.18)' : 'rgba(244,63,94,0.18)',
                  color: t.is_correct ? '#10b981' : '#f43f5e',
                  border: `1px solid ${t.is_correct ? '#10b98144' : '#f43f5e44'}`,
                }}
              >
                {t.is_correct ? 'WIN' : 'LOSS'}
              </span>
            </span>
          </div>
        ))}
      </div>

      {filtered.length > 8 && (
        <button
          onClick={() => setExpanded(!expanded)}
          style={{
            marginTop: 6,
            width: '100%',
            padding: '4px 0',
            fontSize: '0.75rem',
            background: 'rgba(255,255,255,0.03)',
            border: '1px solid rgba(255,255,255,0.06)',
            borderRadius: 4,
            color: '#38bdf8',
            cursor: 'pointer',
            textAlign: 'center',
            fontWeight: 700,
          }}
        >
          {expanded ? '▲ Collapse Log' : `▼ View All ${filtered.length} Historical Signals`}
        </button>
      )}

      {onOpenJournal && (
        <button
          onClick={onOpenJournal}
          style={{
            marginTop: 6,
            width: '100%',
            padding: '5px 0',
            fontSize: '0.75rem',
            background: 'rgba(56,189,248,0.08)',
            border: '1px solid rgba(56,189,248,0.22)',
            borderRadius: 4,
            color: '#38bdf8',
            cursor: 'pointer',
            textAlign: 'center',
            fontWeight: 700,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 5,
          }}
        >
          <BookOpen size={12} />
          Open in Dedicated Won / Lost Signals Journal ↗
        </button>
      )}
    </div>
  );
}

// ── Forward Test P&L Row ──────────────────────────────────────────────────────

function ForwardTestRow({ entry }: { entry: ForwardTestEntry }) {
  const ret = entry.realized_return_pct;
  const color = outcomeColor(entry.outcome);
  const retColor = returnColor(ret);

  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: '70px 80px 80px 70px 70px 70px',
        gap: 4,
        padding: '7px 10px',
        borderRadius: 6,
        background: entry.outcome === 'WIN'
          ? 'rgba(16,185,129,0.05)'
          : entry.outcome === 'LOSS'
          ? 'rgba(244,63,94,0.05)'
          : 'rgba(255,255,255,0.03)',
        marginBottom: 4,
        fontSize: '0.75rem',
        alignItems: 'center',
      }}
    >
      <span style={{ color: 'var(--text-primary)', fontWeight: 700 }}>{entry.symbol}</span>
      <span style={{ color: entry.signal_type === 'REVERSAL' ? '#f59e0b' : '#38bdf8', fontSize: '0.75rem' }}>
        {entry.signal_type}
      </span>
      <span style={{ color: directionColor(entry.direction), fontWeight: 700 }}>
        {entry.direction === 'BULLISH' ? '▲' : '▼'} {entry.direction}
      </span>
      <span style={{ color: retColor, fontFamily: 'monospace', fontWeight: 700 }}>
        {ret > 0 ? '+' : ''}{ret.toFixed(2)}%
      </span>
      <span
        style={{
          color,
          background: `${color}18`,
          padding: '2px 6px',
          borderRadius: 4,
          fontWeight: 700,
          fontSize: '0.75rem',
          textAlign: 'center',
        }}
      >
        {entry.outcome}
      </span>
      <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>
        {new Date(entry.issue_date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })}
      </span>
    </div>
  );
}

// ── Forward Test Panel ────────────────────────────────────────────────────────

function ForwardTestPanel({ log }: { log: ForwardTestLogResponse | null }) {
  if (!log) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: 200, gap: 10 }}>
        <Clock size={28} color="var(--text-muted)" />
        <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem', textAlign: 'center' }}>
          No forward test data yet.<br />Signals are auto-logged when detected.
        </span>
      </div>
    );
  }

  const { stats, entries } = log;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      {/* Stats Banner */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
        {[
          {
            label: 'Rolling Accuracy',
            value: `${stats.rolling_accuracy_pct.toFixed(1)}%`,
            color: hitRateColor(stats.rolling_accuracy_pct),
            icon: <Target size={14} />,
          },
          {
            label: 'Forward Sharpe',
            value: stats.forward_sharpe.toFixed(2),
            color: stats.forward_sharpe > 0 ? '#10b981' : '#f43f5e',
            icon: <BarChart3 size={14} />,
          },
          {
            label: 'Signals Logged',
            value: `${stats.total_logged}`,
            color: '#38bdf8',
            icon: <ClipboardList size={14} />,
          },
        ].map((stat) => (
          <div
            key={stat.label}
            style={{
              background: 'rgba(255,255,255,0.03)',
              border: '1px solid rgba(255,255,255,0.07)',
              borderRadius: 8,
              padding: '10px 12px',
              display: 'flex',
              flexDirection: 'column',
              gap: 4,
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 5, color: 'var(--text-muted)' }}>
              {stat.icon}
              <span style={{ fontSize: '0.75rem' }}>{stat.label}</span>
            </div>
            <span style={{ fontSize: '1.1rem', fontWeight: 800, color: stat.color, fontFamily: 'monospace' }}>
              {stat.value}
            </span>
          </div>
        ))}
      </div>

      {/* W/L breakdown */}
      <div style={{ display: 'flex', gap: 8 }}>
        {[
          { label: 'Wins', count: stats.wins, color: '#10b981', icon: <CheckCircle2 size={12} /> },
          { label: 'Losses', count: stats.losses, color: '#f43f5e', icon: <XCircle size={12} /> },
          { label: 'Pending', count: stats.total_pending, color: '#38bdf8', icon: <Clock size={12} /> },
        ].map((s) => (
          <div
            key={s.label}
            style={{
              flex: 1,
              background: `${s.color}0d`,
              border: `1px solid ${s.color}25`,
              borderRadius: 6,
              padding: '6px 10px',
              display: 'flex',
              alignItems: 'center',
              gap: 6,
            }}
          >
            <span style={{ color: s.color }}>{s.icon}</span>
            <div>
              <div style={{ fontSize: '0.95rem', fontWeight: 800, color: s.color, fontFamily: 'monospace' }}>{s.count}</div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{s.label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Signal entries */}
      {entries.length === 0 ? (
        <div style={{ color: 'var(--text-muted)', fontSize: '0.78rem', textAlign: 'center', padding: '20px 0' }}>
          No signals have been issued yet. Detected signals are automatically logged here.
        </div>
      ) : (
        <div>
          {/* Header */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '70px 80px 80px 70px 70px 70px',
              gap: 4,
              padding: '4px 10px',
              marginBottom: 4,
            }}
          >
            {['Asset', 'Type', 'Direction', 'P&L', 'Outcome', 'Issued'].map((h) => (
              <span key={h} style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                {h}
              </span>
            ))}
          </div>
          <div style={{ maxHeight: 350, overflowY: 'auto' }}>
            {entries.map((e) => (
              <ForwardTestRow key={e.signal_id} entry={e} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ── Signal Deep Dive Panel ────────────────────────────────────────────────────

function SignalDeepDive({
  signal,
  scoreHistory,
  backtest,
  backtestLoading,
  onRequestBacktest,
  onOpenJournal,
}: {
  signal: RegimeSignal;
  scoreHistory: ScoreHistoryPoint[];
  backtest: RegimeSignalBacktest | null;
  backtestLoading: boolean;
  onRequestBacktest: (type: string) => void;
  onOpenJournal?: (symbol: string) => void;
}) {
  const typeColor = signal.signal_type === 'REVERSAL' ? '#f59e0b' : '#38bdf8';
  const dirColor = directionColor(signal.direction);
  const strColor = strengthColor(signal.strength);

  // Pillar contributions (approx based on data)
  const macroPct = Math.min(100, Math.abs(signal.macro_score_now));
  const cotPct = Math.min(100, Math.abs(signal.cot_zscore) * 30);
  const crowdingPct = signal.crowding_index > 50
    ? 100 - signal.crowding_index
    : signal.crowding_index;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
            <span style={{ fontSize: '1.35rem', fontWeight: 900, color: 'var(--text-primary)' }}>
              {signal.symbol}
            </span>
            <span
              style={{
                background: `${typeColor}20`,
                color: typeColor,
                padding: '2px 8px',
                borderRadius: 4,
                fontSize: '0.75rem',
                fontWeight: 700,
                letterSpacing: '0.06em',
              }}
            >
              {signal.signal_type}
            </span>
            <span
              style={{
                background: `${strColor}20`,
                color: strColor,
                padding: '2px 8px',
                borderRadius: 4,
                fontSize: '0.75rem',
                fontWeight: 700,
              }}
            >
              {signal.strength}
            </span>
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{signal.asset_name}</div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: '1.2rem', fontWeight: 800, color: dirColor, fontFamily: 'monospace' }}>
            {signal.direction === 'BULLISH' ? '▲' : '▼'} {signal.direction}
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
            {signal.pillars_aligned}/3 pillars · {signal.confluence_pct.toFixed(0)}% confluence
          </div>
        </div>
      </div>

      {/* Score Sparkline */}
      <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 8, padding: '12px 14px' }}>
        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: 8, display: 'flex', justifyContent: 'space-between' }}>
          <span>26-WEEK MACRO SCORE HISTORY</span>
          <div style={{ display: 'flex', gap: 8 }}>
            <span>Score Shift: <strong style={{ color: signal.score_delta > 0 ? '#10b981' : '#f43f5e' }}>{signal.score_delta > 0 ? '+' : ''}{signal.score_delta}</strong></span>
            <span>COT z: <strong style={{ color: Math.abs(signal.cot_zscore) > 1.5 ? '#f59e0b' : '#38bdf8' }}>{signal.cot_zscore > 0 ? '+' : ''}{signal.cot_zscore.toFixed(2)}</strong></span>
          </div>
        </div>
        <ScoreSparkline history={scoreHistory} />
        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: 6 }}>
          Colored dots = COT z-score extreme (|z| &gt; 1.5). Green = bullish extreme, Red = bearish extreme.
        </div>
      </div>

      {/* 3 Confluence Gauges */}
      <div>
        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: 10 }}>CONFLUENCE PILLARS</div>
        <div style={{ display: 'flex', justifyContent: 'space-around' }}>
          <PillarRing label="Macro Score" value={macroPct} color={dirColor} size={72} />
          <PillarRing label="COT Positioning" value={cotPct} color="#f59e0b" size={72} />
          <PillarRing label="Crowding Safety" value={crowdingPct} color="#38bdf8" size={72} />
        </div>
      </div>

      {/* Entry / Invalidation context */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        <div style={{ background: `${dirColor}0a`, border: `1px solid ${dirColor}25`, borderRadius: 8, padding: '10px 12px' }}>
          <div style={{ fontSize: '0.75rem', color: dirColor, fontWeight: 700, marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Entry Context
          </div>
          <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', margin: 0, lineHeight: 1.5 }}>
            {signal.entry_context}
          </p>
        </div>
        <div style={{ background: 'rgba(244,63,94,0.06)', border: '1px solid rgba(244,63,94,0.18)', borderRadius: 8, padding: '10px 12px' }}>
          <div style={{ fontSize: '0.75rem', color: '#f43f5e', fontWeight: 700, marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            ⚠ Invalidation
          </div>
          <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', margin: 0, lineHeight: 1.5 }}>
            {signal.invalidation_context}
          </p>
        </div>
      </div>

      {/* Backtest Section */}
      <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 10, padding: '14px 14px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <FlaskConical size={14} color="#38bdf8" />
            <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#38bdf8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              15-Year Backtest · {signal.signal_type}
            </span>
          </div>
          <div style={{ display: 'flex', gap: 6 }}>
            {(['REVERSAL', 'CONTINUATION'] as const).map((t) => (
              <button
                key={t}
                onClick={() => onRequestBacktest(t)}
                style={{
                  padding: '3px 8px',
                  borderRadius: 4,
                  border: `1px solid ${t === signal.signal_type ? '#38bdf8' : 'rgba(255,255,255,0.1)'}`,
                  background: t === signal.signal_type ? 'rgba(56,189,248,0.12)' : 'transparent',
                  color: t === signal.signal_type ? '#38bdf8' : 'var(--text-muted)',
                  fontSize: '0.75rem',
                  cursor: 'pointer',
                  fontWeight: 700,
                }}
              >
                {t}
              </button>
            ))}
          </div>
        </div>

        {backtestLoading ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'var(--text-muted)', fontSize: '0.75rem' }}>
            <RefreshCw size={14} style={{ animation: 'spin 1s linear infinite' }} />
            Running 15-year backtest...
          </div>
        ) : backtest ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {/* Key metrics row */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8 }}>
              {[
                { label: 'Hit Rate', value: `${backtest.hit_rate_pct.toFixed(1)}%`, color: hitRateColor(backtest.hit_rate_pct) },
                { label: 'Sharpe', value: backtest.sharpe_equivalent.toFixed(2), color: backtest.sharpe_equivalent > 0 ? '#10b981' : '#f43f5e' },
                { label: 'W/L Ratio', value: backtest.win_loss_ratio.toFixed(2), color: '#38bdf8' },
                { label: 'N Signals', value: `${backtest.total_signals_found}`, color: 'var(--text-secondary)' },
              ].map((m) => (
                <div key={m.label} style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: '1rem', fontWeight: 800, color: m.color, fontFamily: 'monospace' }}>{m.value}</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{m.label}</div>
                </div>
              ))}
            </div>

            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
              Avg gain: <strong style={{ color: '#10b981' }}>+{backtest.avg_gain_pct.toFixed(2)}%</strong> &nbsp;
              Avg loss: <strong style={{ color: '#f43f5e' }}>-{backtest.avg_loss_pct.toFixed(2)}%</strong> &nbsp;
              Best regime: <strong style={{ color: '#f59e0b' }}>{backtest.best_regime}</strong>
            </div>

            {/* Timeline chart & past signals audit */}
            {backtest.timeline.length > 0 && (
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>SIGNAL OUTCOMES TIMELINE (Green = Win, Red = Loss)</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                    {backtest.timeline.filter((t) => t.is_correct).length}W / {backtest.timeline.filter((t) => !t.is_correct).length}L
                  </div>
                </div>
                {backtest.timeline.length > 2 && <TimelineChart timeline={backtest.timeline} />}
                <AssetPastSignalsTable
                  timeline={backtest.timeline}
                  symbol={signal.symbol}
                  onOpenJournal={onOpenJournal ? () => onOpenJournal(signal.symbol) : undefined}
                />
              </div>
            )}

            {/* Regime breakdown */}
            <div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: 8 }}>BY MACRO REGIME</div>
              {backtest.regime_breakdown.map((r) => (
                <RegimeBar key={r.regime_id} regime={r} />
              ))}
            </div>

            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontStyle: 'italic' }}>
              Walk-forward backtest: {backtest.evaluation_period}. Zero look-ahead bias.
            </div>
          </div>
        ) : (
          <div style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>
            Click REVERSAL / CONTINUATION above to run the 15-year validation.
          </div>
        )}
      </div>
    </div>
  );
}

// ── Signal Feed Row ───────────────────────────────────────────────────────────

function SignalRow({
  signal,
  selected,
  onClick,
}: {
  signal: RegimeSignal;
  selected: boolean;
  onClick: () => void;
}) {
  const strColor = strengthColor(signal.strength);
  const dirColor = directionColor(signal.direction);
  const typeColor = signal.signal_type === 'REVERSAL' ? '#f59e0b' : '#38bdf8';

  return (
    <div
      onClick={onClick}
      style={{
        padding: '10px 12px',
        borderRadius: 8,
        border: selected
          ? `1px solid ${strColor}50`
          : '1px solid rgba(255,255,255,0.06)',
        background: selected
          ? `${strColor}0d`
          : 'rgba(255,255,255,0.025)',
        cursor: 'pointer',
        marginBottom: 6,
        transition: 'all 0.15s ease',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {signal.strength === 'MAJOR' && (
        <div
          style={{
            position: 'absolute',
            left: 0,
            top: 0,
            bottom: 0,
            width: 3,
            background: `linear-gradient(180deg, ${strColor}, ${strColor}44)`,
            borderRadius: '3px 0 0 3px',
          }}
        />
      )}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
          <span style={{ fontWeight: 900, fontSize: '0.9rem', color: 'var(--text-primary)' }}>{signal.symbol}</span>
          <span style={{ fontSize: '0.75rem', color: typeColor, background: `${typeColor}18`, padding: '1px 6px', borderRadius: 3, fontWeight: 700 }}>
            {signal.signal_type}
          </span>
        </div>
        <span style={{ fontSize: '0.75rem', fontWeight: 700, color: strColor, background: strengthBg(signal.strength), padding: '2px 6px', borderRadius: 4 }}>
          {signal.strength}
        </span>
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
          {signal.direction === 'BULLISH'
            ? <ArrowUpRight size={13} color={dirColor} />
            : <ArrowDownRight size={13} color={dirColor} />}
          <span style={{ fontSize: '0.75rem', fontWeight: 700, color: dirColor }}>{signal.direction}</span>
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
            Shift: <strong style={{ color: signal.score_delta > 0 ? '#10b981' : '#f43f5e' }}>{signal.score_delta > 0 ? '+' : ''}{signal.score_delta}</strong>
          </span>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
            z:<strong style={{ color: '#f59e0b' }}>{signal.cot_zscore > 0 ? '+' : ''}{signal.cot_zscore.toFixed(2)}</strong>
          </span>
          <span style={{ fontSize: '0.75rem', fontFamily: 'monospace', color: hitRateColor(signal.backtest_hit_rate), fontWeight: 700 }}>
            {signal.backtest_hit_rate.toFixed(1)}%
          </span>
        </div>
      </div>
      <div style={{ marginTop: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', gap: 3 }}>
          {[...Array(3)].map((_, i) => (
            <div
              key={i}
              style={{
                width: 6,
                height: 6,
                borderRadius: '50%',
                background: i < signal.pillars_aligned ? '#10b981' : 'rgba(255,255,255,0.1)',
              }}
            />
          ))}
        </div>
        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
          {signal.confluence_pct.toFixed(0)}% confluence · N={signal.backtest_sample_size}
        </span>
      </div>
    </div>
  );
}

// ── Historical Signal Journal (Full Ledger View) ──────────────────────────────

function HistoricalSignalJournal({
  initialSymbol,
  onBackToScanner,
}: {
  initialSymbol?: string;
  onBackToScanner?: () => void;
}) {
  const [data, setData] = useState<HistoricalSignalsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [symbol, setSymbol] = useState(initialSymbol || 'ALL');
  const [signalType, setSignalType] = useState<'ALL' | 'REVERSAL' | 'CONTINUATION'>('ALL');
  const [outcome, setOutcome] = useState<'ALL' | 'WIN' | 'LOSS'>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 20;

  useEffect(() => {
    if (initialSymbol) {
      setSymbol(initialSymbol);
    }
  }, [initialSymbol]);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.getHistoricalSignalLog({
        symbol: symbol === 'ALL' ? undefined : symbol,
        signal_type: signalType === 'ALL' ? undefined : signalType,
        outcome: outcome === 'ALL' ? undefined : outcome,
        limit: 500,
      });
      setData(res);
      setCurrentPage(1);
    } catch (e) {
      console.error('Failed to load past signals journal:', e);
    } finally {
      setLoading(false);
    }
  }, [symbol, signalType, outcome]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Client search filter
  const allFiltered = (data?.signals || []).filter((s) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      s.date.toLowerCase().includes(q) ||
      s.symbol.toLowerCase().includes(q) ||
      s.asset_name.toLowerCase().includes(q) ||
      s.regime_name.toLowerCase().includes(q) ||
      s.signal_type.toLowerCase().includes(q)
    );
  });

  const totalPages = Math.ceil(allFiltered.length / pageSize) || 1;
  const pageSignals = allFiltered.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14, height: '100%' }}>
      {/* Journal Sub-Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10, paddingBottom: 2 }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: '1.05rem', fontWeight: 800, color: 'var(--text-primary)' }}>
              Historical Signals Journal
            </span>
            <span style={{ fontSize: '0.75rem', background: 'rgba(56,189,248,0.15)', color: '#38bdf8', padding: '2px 8px', borderRadius: 4, fontWeight: 700, border: '1px solid rgba(56,189,248,0.25)' }}>
              15-Year Walk-Forward Ledger
            </span>
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: 2 }}>
            Complete audit record of past major Reversal &amp; Continuation signals with exact dates, entry/exit prices, forward returns, and win/loss outcomes.
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <button
            onClick={loadData}
            style={{
              display: 'flex', alignItems: 'center', gap: 5,
              padding: '6px 12px', borderRadius: 6,
              background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)',
              color: 'var(--text-secondary)', fontSize: '0.75rem', fontWeight: 700, cursor: 'pointer',
            }}
          >
            <RefreshCw size={12} />
            Refresh Journal
          </button>
          {onBackToScanner && (
            <button
              onClick={onBackToScanner}
              style={{
                display: 'flex', alignItems: 'center', gap: 5,
                padding: '6px 12px', borderRadius: 6,
                background: 'rgba(56,189,248,0.15)', border: '1px solid rgba(56,189,248,0.3)',
                color: '#38bdf8', fontSize: '0.75rem', fontWeight: 700, cursor: 'pointer',
              }}
            >
              <ScanSearch size={13} />
              Back to Live Scanner
            </button>
          )}
        </div>
      </div>

      {/* KPI Summary Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 10 }}>
        <div style={{ background: 'var(--surface-1)', border: '1px solid var(--border-subtle)', borderRadius: 10, padding: '12px 14px' }}>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 700, marginBottom: 4 }}>TOTAL SIGNALS</div>
          <div style={{ fontSize: '1.25rem', fontWeight: 900, color: 'var(--text-primary)' }}>{data?.total_signals || 0}</div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>15-Year Historical Horizon</div>
        </div>

        <div style={{ background: 'var(--surface-1)', border: '1px solid rgba(16,185,129,0.3)', borderRadius: 10, padding: '12px 14px' }}>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 700, marginBottom: 4 }}>WIN RATE</div>
          <div style={{ fontSize: '1.25rem', fontWeight: 900, color: '#10b981' }}>{data?.hit_rate_pct.toFixed(1) || '0.0'}%</div>
          <div style={{ fontSize: '0.75rem', color: '#10b981aa' }}>Statistical edge confirmed</div>
        </div>

        <div style={{ background: 'var(--surface-1)', border: '1px solid var(--border-subtle)', borderRadius: 10, padding: '12px 14px' }}>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 700, marginBottom: 4 }}>WINS vs LOSSES</div>
          <div style={{ fontSize: '1.1rem', fontWeight: 900, color: 'var(--text-primary)' }}>
            <span style={{ color: '#10b981' }}>{data?.total_wins || 0}W</span>
            <span style={{ color: 'var(--text-muted)', margin: '0 4px' }}>/</span>
            <span style={{ color: '#f43f5e' }}>{data?.total_losses || 0}L</span>
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Resolved outcomes</div>
        </div>

        <div style={{ background: 'var(--surface-1)', border: '1px solid var(--border-subtle)', borderRadius: 10, padding: '12px 14px' }}>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 700, marginBottom: 4 }}>WIN / LOSS RATIO</div>
          <div style={{ fontSize: '1.25rem', fontWeight: 900, color: '#38bdf8' }}>{data?.win_loss_ratio.toFixed(2) || '0.00'}x</div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Avg win vs avg loss</div>
        </div>

        <div style={{ background: 'var(--surface-1)', border: '1px solid var(--border-subtle)', borderRadius: 10, padding: '12px 14px' }}>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 700, marginBottom: 4 }}>AVG RETURN</div>
          <div style={{ fontSize: '1.1rem', fontWeight: 900, color: 'var(--text-primary)' }}>
            <span style={{ color: '#10b981' }}>+{data?.avg_win_pct.toFixed(2) || '0.00'}%</span>
            <span style={{ color: 'var(--text-muted)', margin: '0 4px' }}>|</span>
            <span style={{ color: '#f43f5e' }}>-{data?.avg_loss_pct.toFixed(2) || '0.00'}%</span>
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Per trade expectation</div>
        </div>
      </div>

      {/* Filter Row */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10, background: 'var(--surface-1)', padding: '10px 14px', borderRadius: 10, border: '1px solid var(--border-subtle)' }}>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
          {/* Outcome Filter */}
          <div style={{ display: 'flex', background: 'rgba(255,255,255,0.04)', borderRadius: 6, padding: 2 }}>
            {(['ALL', 'WIN', 'LOSS'] as const).map((o) => (
              <button
                key={o}
                onClick={() => setOutcome(o)}
                style={{
                  padding: '4px 10px',
                  borderRadius: 5,
                  border: 'none',
                  background: outcome === o
                    ? o === 'WIN' ? '#10b98122' : o === 'LOSS' ? '#f43f5e22' : 'rgba(56,189,248,0.18)'
                    : 'transparent',
                  color: outcome === o
                    ? o === 'WIN' ? '#10b981' : o === 'LOSS' ? '#f43f5e' : '#38bdf8'
                    : 'var(--text-muted)',
                  fontSize: '0.75rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                }}
              >
                {o === 'ALL' ? 'All Outcomes' : o === 'WIN' ? 'Wins Only' : 'Losses Only'}
              </button>
            ))}
          </div>

          {/* Type Filter */}
          <div style={{ display: 'flex', background: 'rgba(255,255,255,0.04)', borderRadius: 6, padding: 2 }}>
            {(['ALL', 'REVERSAL', 'CONTINUATION'] as const).map((t) => (
              <button
                key={t}
                onClick={() => setSignalType(t)}
                style={{
                  padding: '4px 10px',
                  borderRadius: 5,
                  border: 'none',
                  background: signalType === t
                    ? t === 'REVERSAL' ? '#f59e0b22' : t === 'CONTINUATION' ? '#38bdf822' : 'rgba(255,255,255,0.12)'
                    : 'transparent',
                  color: signalType === t
                    ? t === 'REVERSAL' ? '#f59e0b' : t === 'CONTINUATION' ? '#38bdf8' : '#fff'
                    : 'var(--text-muted)',
                  fontSize: '0.75rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                }}
              >
                {t === 'ALL' ? 'All Types' : t === 'REVERSAL' ? 'Reversals' : 'Continuations'}
              </button>
            ))}
          </div>

          {/* Asset Dropdown */}
          <div style={{ display: 'flex', background: 'rgba(255,255,255,0.04)', borderRadius: 6, padding: 2, flexWrap: 'wrap' }}>
            {['ALL', 'EURUSD', 'USDJPY', 'GBPUSD', 'SPX', 'XAUUSD', 'CL'].map((a) => (
              <button
                key={a}
                onClick={() => setSymbol(a)}
                style={{
                  padding: '4px 8px',
                  borderRadius: 5,
                  border: 'none',
                  background: symbol === a ? 'rgba(16,185,129,0.18)' : 'transparent',
                  color: symbol === a ? '#10b981' : 'var(--text-muted)',
                  fontSize: '0.75rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                }}
              >
                {a}
              </button>
            ))}
          </div>
        </div>

        {/* Search Query Input */}
        <div style={{ position: 'relative', minWidth: 220 }}>
          <Search size={14} color="var(--text-muted)" style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)' }} />
          <input
            type="text"
            placeholder="Search date, symbol, regime..."
            value={searchQuery}
            onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }}
            style={{
              width: '100%',
              padding: '6px 12px 6px 30px',
              borderRadius: 6,
              background: 'rgba(255,255,255,0.05)',
              border: '1px solid rgba(255,255,255,0.1)',
              color: 'var(--text-primary)',
              fontSize: '0.75rem',
              outline: 'none',
            }}
          />
        </div>
      </div>

      {/* Main Journal Table */}
      <div style={{ background: 'var(--surface-1)', border: '1px solid var(--border-subtle)', borderRadius: 12, overflow: 'hidden', flex: 1, display: 'flex', flexDirection: 'column' }}>
        <div style={{ overflowX: 'auto', flex: 1 }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.75rem' }}>
            <thead>
              <tr style={{ background: 'rgba(255,255,255,0.02)', borderBottom: '1px solid var(--border-subtle)', color: 'var(--text-muted)', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                <th style={{ padding: '10px 14px', textAlign: 'left' }}>Signal Date</th>
                <th style={{ padding: '10px 14px', textAlign: 'left' }}>Asset</th>
                <th style={{ padding: '10px 14px', textAlign: 'left' }}>Signal Type</th>
                <th style={{ padding: '10px 14px', textAlign: 'left' }}>Direction</th>
                <th style={{ padding: '10px 14px', textAlign: 'left' }}>Strength</th>
                <th style={{ padding: '10px 14px', textAlign: 'right' }}>Entry Price</th>
                <th style={{ padding: '10px 14px', textAlign: 'right' }}>Exit Price</th>
                <th style={{ padding: '10px 14px', textAlign: 'right' }}>Return</th>
                <th style={{ padding: '10px 14px', textAlign: 'center' }}>Outcome</th>
                <th style={{ padding: '10px 14px', textAlign: 'right' }}>Score Shift</th>
                <th style={{ padding: '10px 14px', textAlign: 'left' }}>Historical Regime</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={11} style={{ textAlign: 'center', padding: 40, color: 'var(--text-muted)' }}>
                    <RefreshCw size={20} style={{ animation: 'spin 1s linear infinite', marginBottom: 8 }} />
                    <div>Loading 15-year signal journal...</div>
                  </td>
                </tr>
              ) : pageSignals.length === 0 ? (
                <tr>
                  <td colSpan={11} style={{ textAlign: 'center', padding: 40, color: 'var(--text-muted)' }}>
                    No signals found matching criteria.
                  </td>
                </tr>
              ) : (
                pageSignals.map((s) => {
                  const isWin = s.outcome === 'WIN';
                  return (
                    <tr
                      key={s.signal_id}
                      style={{
                        borderBottom: '1px solid rgba(255,255,255,0.03)',
                        transition: 'background 0.15s ease',
                      }}
                      onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.025)'; }}
                      onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
                    >
                      <td style={{ padding: '9px 14px', fontFamily: 'monospace', fontWeight: 600, color: 'var(--text-secondary)' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                          <Calendar size={12} color="var(--text-muted)" />
                          {s.date}
                        </div>
                      </td>
                      <td style={{ padding: '9px 14px' }}>
                        <span style={{ fontWeight: 800, color: 'var(--text-primary)' }}>{s.symbol}</span>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{s.asset_name}</div>
                      </td>
                      <td style={{ padding: '9px 14px' }}>
                        <span
                          style={{
                            fontSize: '0.75rem',
                            fontWeight: 700,
                            padding: '2px 7px',
                            borderRadius: 4,
                            background: s.signal_type === 'REVERSAL' ? '#f59e0b18' : '#38bdf818',
                            color: s.signal_type === 'REVERSAL' ? '#f59e0b' : '#38bdf8',
                            border: `1px solid ${s.signal_type === 'REVERSAL' ? '#f59e0b33' : '#38bdf833'}`,
                          }}
                        >
                          {s.signal_type}
                        </span>
                      </td>
                      <td style={{ padding: '9px 14px' }}>
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontWeight: 700, color: s.direction === 'BULLISH' ? '#10b981' : '#f43f5e' }}>
                          {s.direction === 'BULLISH' ? <ArrowUpRight size={13} /> : <ArrowDownRight size={13} />}
                          {s.direction}
                        </span>
                      </td>
                      <td style={{ padding: '9px 14px' }}>
                        <span
                          style={{
                            fontSize: '0.75rem',
                            fontWeight: 700,
                            padding: '2px 6px',
                            borderRadius: 4,
                            background: strengthBg(s.strength),
                            color: strengthColor(s.strength),
                          }}
                        >
                          {s.strength}
                        </span>
                      </td>
                      <td style={{ padding: '9px 14px', textAlign: 'right', fontFamily: 'monospace', color: 'var(--text-muted)' }}>
                        {formatAssetPrice(s.symbol, s.entry_price)}
                      </td>
                      <td style={{ padding: '9px 14px', textAlign: 'right', fontFamily: 'monospace', color: 'var(--text-muted)' }}>
                        {formatAssetPrice(s.symbol, s.exit_price)}
                      </td>
                      <td style={{ padding: '9px 14px', textAlign: 'right', fontFamily: 'monospace', fontWeight: 800, color: isWin ? '#10b981' : '#f43f5e' }}>
                        {s.forward_return_pct > 0 ? `+${s.forward_return_pct.toFixed(2)}%` : `${s.forward_return_pct.toFixed(2)}%`}
                      </td>
                      <td style={{ padding: '9px 14px', textAlign: 'center' }}>
                        <span
                          style={{
                            display: 'inline-block',
                            fontSize: '0.75rem',
                            fontWeight: 900,
                            padding: '2px 8px',
                            borderRadius: 4,
                            background: isWin ? 'rgba(16,185,129,0.18)' : 'rgba(244,63,94,0.18)',
                            color: isWin ? '#10b981' : '#f43f5e',
                            border: `1px solid ${isWin ? 'rgba(16,185,129,0.4)' : 'rgba(244,63,94,0.4)'}`,
                          }}
                        >
                          {s.outcome}
                        </span>
                      </td>
                      <td style={{ padding: '9px 14px', textAlign: 'right', fontFamily: 'monospace', fontSize: '0.75rem' }}>
                        <span style={{ color: s.macro_score > 0 ? '#10b981' : '#f43f5e' }}>{s.macro_score > 0 ? '+' : ''}{s.macro_score}</span>
                        <span style={{ color: 'var(--text-muted)', marginLeft: 6 }}>z:{s.cot_zscore > 0 ? '+' : ''}{s.cot_zscore.toFixed(2)}</span>
                      </td>
                      <td style={{ padding: '9px 14px', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                        {s.regime_name}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Footer */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 14px', borderTop: '1px solid var(--border-subtle)', background: 'rgba(255,255,255,0.015)' }}>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
            Showing {allFiltered.length === 0 ? 0 : (currentPage - 1) * pageSize + 1}–{Math.min(currentPage * pageSize, allFiltered.length)} of {allFiltered.length} past signals
          </div>
          <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
            <button
              disabled={currentPage <= 1}
              onClick={() => setCurrentPage(currentPage - 1)}
              style={{
                display: 'flex', alignItems: 'center', gap: 4,
                padding: '4px 10px', borderRadius: 5,
                background: currentPage <= 1 ? 'rgba(255,255,255,0.02)' : 'rgba(255,255,255,0.06)',
                border: '1px solid rgba(255,255,255,0.08)',
                color: currentPage <= 1 ? 'var(--text-muted)' : 'var(--text-primary)',
                fontSize: '0.75rem', cursor: currentPage <= 1 ? 'default' : 'pointer',
              }}
            >
              <ChevronLeft size={13} />
              Prev
            </button>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', padding: '0 6px' }}>
              Page {currentPage} of {totalPages}
            </span>
            <button
              disabled={currentPage >= totalPages}
              onClick={() => setCurrentPage(currentPage + 1)}
              style={{
                display: 'flex', alignItems: 'center', gap: 4,
                padding: '4px 10px', borderRadius: 5,
                background: currentPage >= totalPages ? 'rgba(255,255,255,0.02)' : 'rgba(255,255,255,0.06)',
                border: '1px solid rgba(255,255,255,0.08)',
                color: currentPage >= totalPages ? 'var(--text-muted)' : 'var(--text-primary)',
                fontSize: '0.75rem', cursor: currentPage >= totalPages ? 'default' : 'pointer',
              }}
            >
              Next
              <ChevronRight size={13} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Main Component ────────────────────────────────────────────────────────────

const ASSET_FILTER_OPTIONS = ['ALL', 'EURUSD', 'USDJPY', 'GBPUSD', 'SPX', 'XAUUSD', 'CL'];
const TYPE_FILTERS = ['ALL', 'REVERSAL', 'CONTINUATION'];
const STRENGTH_FILTERS = ['ALL', 'MAJOR', 'MODERATE', 'MINOR'];

export const RegimeScannerView: React.FC = () => {
  const [scannerTab, setScannerTab] = useState<'scanner' | 'history'>('scanner');
  const [journalSymbol, setJournalSymbol] = useState<string>('ALL');
  const [signals, setSignals] = useState<RegimeSignal[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedSignal, setSelectedSignal] = useState<RegimeSignal | null>(null);
  const [scoreHistory, setScoreHistory] = useState<ScoreHistoryPoint[]>([]);
  const [backtest, setBacktest] = useState<RegimeSignalBacktest | null>(null);
  const [backtestLoading, setBacktestLoading] = useState(false);
  const [forwardLog, setForwardLog] = useState<ForwardTestLogResponse | null>(null);
  const [typeFilter, setTypeFilter] = useState('ALL');
  const [strengthFilter, setStrengthFilter] = useState('ALL');
  const [assetFilter, setAssetFilter] = useState('ALL');
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const loadingRef = useRef(false);

  const handleOpenJournal = useCallback((sym?: string) => {
    if (sym) setJournalSymbol(sym);
    setScannerTab('history');
  }, []);

  const loadSignals = useCallback(async () => {
    if (loadingRef.current) return;
    loadingRef.current = true;
    setLoading(true);
    try {
      const res = await api.getRegimeSignals();
      setSignals(res.signals);
      setLastUpdated(new Date());
    } catch (err) {
      console.error('Failed to load regime signals:', err);
    } finally {
      setLoading(false);
      loadingRef.current = false;
    }
  }, []);

  const loadForwardLog = useCallback(async () => {
    try {
      const res = await api.getForwardTestLog();
      setForwardLog(res);
    } catch (err) {
      console.error('Failed to load forward test log:', err);
    }
  }, []);

  const loadSignalDetail = useCallback(async (signal: RegimeSignal) => {
    setSelectedSignal(signal);
    setBacktest(null);
    try {
      const res = await api.getRegimeSignalsForAsset(signal.symbol);
      setScoreHistory(res.score_history);
    } catch {
      setScoreHistory([]);
    }
    // Auto-run backtest for the signal's type
    setBacktestLoading(true);
    try {
      const bt = await api.getRegimeSignalBacktest(signal.symbol, signal.signal_type);
      setBacktest(bt);
    } catch {
      setBacktest(null);
    } finally {
      setBacktestLoading(false);
    }
  }, []);

  const handleRequestBacktest = useCallback(async (type: string) => {
    if (!selectedSignal) return;
    setBacktestLoading(true);
    setBacktest(null);
    try {
      const bt = await api.getRegimeSignalBacktest(selectedSignal.symbol, type);
      setBacktest(bt);
    } catch {
      setBacktest(null);
    } finally {
      setBacktestLoading(false);
    }
  }, [selectedSignal]);

  useEffect(() => {
    loadSignals();
    loadForwardLog();
    const interval = setInterval(() => {
      loadSignals();
      loadForwardLog();
    }, 60000);
    return () => clearInterval(interval);
  }, [loadSignals, loadForwardLog]);

  // Apply filters
  const filteredSignals = signals.filter((s) => {
    if (typeFilter !== 'ALL' && s.signal_type !== typeFilter) return false;
    if (strengthFilter !== 'ALL' && s.strength !== strengthFilter) return false;
    if (assetFilter !== 'ALL' && s.symbol !== assetFilter) return false;
    return true;
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 0, height: '100%' }}>
      {/* Page Header */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: 18,
          flexWrap: 'wrap',
          gap: 12,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 34, height: 34, borderRadius: 8, background: 'linear-gradient(135deg, #f43f5e22, #f59e0b22)', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid rgba(244,63,94,0.25)' }}>
            <ScanSearch size={17} color="#f43f5e" />
          </div>
          <div>
            <h1 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 800, color: 'var(--text-primary)' }}>
              Regime Scanner
            </h1>
            <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--text-muted)' }}>
              Major Reversals &amp; Continuations · Backtested &amp; Forward-Tested
            </p>
          </div>
        </div>

        {/* View Tab Switcher: Live Radar vs Won/Lost Historical Journal */}
        <div style={{ display: 'flex', background: 'rgba(255,255,255,0.04)', borderRadius: 8, padding: 3, border: '1px solid rgba(255,255,255,0.07)' }}>
          <button
            onClick={() => setScannerTab('scanner')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              padding: '6px 14px',
              borderRadius: 6,
              border: 'none',
              background: scannerTab === 'scanner' ? 'rgba(56,189,248,0.2)' : 'transparent',
              color: scannerTab === 'scanner' ? '#38bdf8' : 'var(--text-muted)',
              fontWeight: 700,
              fontSize: '0.75rem',
              cursor: 'pointer',
              transition: 'all 0.15s ease',
            }}
          >
            <ScanSearch size={13} />
            Live Scanner Feed
            {signals.length > 0 && (
              <span style={{ fontSize: '0.75rem', padding: '1px 5px', borderRadius: 4, background: scannerTab === 'scanner' ? 'rgba(56,189,248,0.3)' : 'rgba(255,255,255,0.08)', color: scannerTab === 'scanner' ? '#fff' : 'var(--text-muted)', fontWeight: 800 }}>
                {signals.length}
              </span>
            )}
          </button>
          <button
            onClick={() => setScannerTab('history')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              padding: '6px 14px',
              borderRadius: 6,
              border: 'none',
              background: scannerTab === 'history' ? 'rgba(16,185,129,0.2)' : 'transparent',
              color: scannerTab === 'history' ? '#10b981' : 'var(--text-muted)',
              fontWeight: 700,
              fontSize: '0.75rem',
              cursor: 'pointer',
              transition: 'all 0.15s ease',
            }}
          >
            <BookOpen size={13} />
            Won / Lost Signals Journal
            <span style={{ fontSize: '0.75rem', padding: '1px 5px', borderRadius: 4, background: scannerTab === 'history' ? 'rgba(16,185,129,0.3)' : 'rgba(255,255,255,0.08)', color: scannerTab === 'history' ? '#fff' : 'var(--text-muted)', fontWeight: 800 }}>
              15-Yr Audit
            </span>
          </button>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {lastUpdated && (
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
              Updated {lastUpdated.toLocaleTimeString()}
            </span>
          )}
          <button
            onClick={() => { loadSignals(); loadForwardLog(); }}
            style={{
              display: 'flex', alignItems: 'center', gap: 5,
              padding: '6px 12px', borderRadius: 6,
              background: 'rgba(56,189,248,0.1)', border: '1px solid rgba(56,189,248,0.25)',
              color: '#38bdf8', fontSize: '0.75rem', fontWeight: 700, cursor: 'pointer',
            }}
          >
            <RefreshCw size={12} />
            Refresh
          </button>
        </div>
      </div>

      {scannerTab === 'history' ? (
        <div style={{ flex: 1, minHeight: 0 }}>
          <HistoricalSignalJournal
            initialSymbol={journalSymbol}
            onBackToScanner={() => setScannerTab('scanner')}
          />
        </div>
      ) : (
        <>
          {/* Filter Bar */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
        {/* Signal Type */}
        <div style={{ display: 'flex', background: 'rgba(255,255,255,0.04)', borderRadius: 6, padding: 3 }}>
          {TYPE_FILTERS.map((f) => (
            <button
              key={f}
              onClick={() => setTypeFilter(f)}
              style={{
                padding: '4px 10px', borderRadius: 5, border: 'none',
                background: typeFilter === f ? 'rgba(56,189,248,0.18)' : 'transparent',
                color: typeFilter === f ? '#38bdf8' : 'var(--text-muted)',
                fontSize: '0.75rem', fontWeight: 700, cursor: 'pointer',
              }}
            >
              {f}
            </button>
          ))}
        </div>
        {/* Strength */}
        <div style={{ display: 'flex', background: 'rgba(255,255,255,0.04)', borderRadius: 6, padding: 3 }}>
          {STRENGTH_FILTERS.map((f) => (
            <button
              key={f}
              onClick={() => setStrengthFilter(f)}
              style={{
                padding: '4px 10px', borderRadius: 5, border: 'none',
                background: strengthFilter === f ? `${strengthColor(f)}22` : 'transparent',
                color: strengthFilter === f ? strengthColor(f) : 'var(--text-muted)',
                fontSize: '0.75rem', fontWeight: 700, cursor: 'pointer',
              }}
            >
              {f}
            </button>
          ))}
        </div>
        {/* Asset */}
        <div style={{ display: 'flex', background: 'rgba(255,255,255,0.04)', borderRadius: 6, padding: 3, flexWrap: 'wrap' }}>
          {ASSET_FILTER_OPTIONS.map((f) => (
            <button
              key={f}
              onClick={() => setAssetFilter(f)}
              style={{
                padding: '4px 10px', borderRadius: 5, border: 'none',
                background: assetFilter === f ? 'rgba(16,185,129,0.15)' : 'transparent',
                color: assetFilter === f ? '#10b981' : 'var(--text-muted)',
                fontSize: '0.75rem', fontWeight: 700, cursor: 'pointer',
              }}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      {/* Main 3-column layout */}
      <div style={{ display: 'grid', gridTemplateColumns: '280px 1fr 300px', gap: 14, flex: 1, minHeight: 0 }}>
        {/* ── PANEL A: Live Signal Feed ── */}
        <div
          style={{
            background: 'var(--surface-1)',
            border: '1px solid var(--border-subtle)',
            borderRadius: 12,
            padding: '14px 12px',
            overflowY: 'auto',
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <Zap size={13} color="#f43f5e" />
              <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                Live Signals
              </span>
            </div>
            {!loading && (
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', background: 'rgba(255,255,255,0.06)', padding: '2px 7px', borderRadius: 4 }}>
                {filteredSignals.length}
              </span>
            )}
          </div>

          {loading ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {[...Array(5)].map((_, i) => (
                <div key={i} style={{ height: 72, borderRadius: 8, background: 'rgba(255,255,255,0.05)', animation: 'pulse 1.4s ease-in-out infinite' }} />
              ))}
            </div>
          ) : filteredSignals.length === 0 ? (
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 10 }}>
              <ShieldCheck size={30} color="var(--text-muted)" />
              <span style={{ color: 'var(--text-muted)', fontSize: '0.78rem', textAlign: 'center' }}>
                No signals match current filters.
              </span>
              <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem', textAlign: 'center' }}>
                Try ALL filters or wait for the next macro score update.
              </span>
            </div>
          ) : (
            filteredSignals.map((sig) => (
              <SignalRow
                key={sig.signal_id}
                signal={sig}
                selected={selectedSignal?.signal_id === sig.signal_id}
                onClick={() => loadSignalDetail(sig)}
              />
            ))
          )}

          {/* Legend */}
          <div style={{ marginTop: 'auto', paddingTop: 12, borderTop: '1px solid var(--border-subtle)' }}>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', lineHeight: 1.7 }}>
              <div>● <span style={{ color: '#f43f5e' }}>MAJOR</span> – All 3 criteria met, high conviction</div>
              <div>● <span style={{ color: '#f59e0b' }}>MODERATE</span> – 2/3 criteria met</div>
              <div>● Hit Rate = 15-year historical accuracy</div>
            </div>
          </div>
        </div>

        {/* ── PANEL B: Deep Dive ── */}
        <div
          style={{
            background: 'var(--surface-1)',
            border: '1px solid var(--border-subtle)',
            borderRadius: 12,
            padding: '18px 20px',
            overflowY: 'auto',
          }}
        >
          {selectedSignal ? (
            <SignalDeepDive
              signal={selectedSignal}
              scoreHistory={scoreHistory}
              backtest={backtest}
              backtestLoading={backtestLoading}
              onRequestBacktest={handleRequestBacktest}
              onOpenJournal={handleOpenJournal}
            />
          ) : (
            <div style={{ height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 14 }}>
              <div style={{ width: 56, height: 56, borderRadius: '50%', background: 'rgba(56,189,248,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid rgba(56,189,248,0.18)' }}>
                <BookOpen size={24} color="#38bdf8" />
              </div>
              <div style={{ textAlign: 'center' }}>
                <div style={{ color: 'var(--text-primary)', fontWeight: 700, marginBottom: 6 }}>Signal Deep Dive</div>
                <div style={{ color: 'var(--text-muted)', fontSize: '0.78rem' }}>
                  Select a signal from the left panel to see:<br />
                  Score history chart, confluence gauges,<br />
                  and 15-year backtest validation.
                </div>
              </div>
            </div>
          )}
        </div>

        {/* ── PANEL C: Forward Test Tracker ── */}
        <div
          style={{
            background: 'var(--surface-1)',
            border: '1px solid var(--border-subtle)',
            borderRadius: 12,
            padding: '14px 12px',
            overflowY: 'auto',
            display: 'flex',
            flexDirection: 'column',
            gap: 12,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <Activity size={13} color="#10b981" />
            <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
              Forward Test Tracker
            </span>
          </div>
          <ForwardTestPanel log={forwardLog} />
        </div>
      </div>
      </>
      )}

      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 0.5; }
          50% { opacity: 1; }
        }
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};
