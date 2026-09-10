import React, { useEffect, useState, useCallback } from 'react';
import {
  FlaskConical, RefreshCw, TrendingUp, TrendingDown, AlertTriangle,
  CheckCircle2, Info, ChevronRight, Target, BarChart2, Activity,
  Minus, ArrowUpRight, ArrowDownRight, ShieldCheck, Award, Calendar, Layers
} from 'lucide-react';
import { api } from '../services/api';
import {
  ValidationResult,
  WalkForwardWindow,
  CalibrationBin,
  Historical15YReport,
  Historical15YSummaryItem,
  Regime15YPerformance,
  Milestone15YCaseStudy,
  Equity15YPoint,
} from '../types/macro';

const ASSET_15Y_OPTIONS = [
  { symbol: 'EURUSD', name: 'EUR / USD' },
  { symbol: 'USDJPY', name: 'USD / JPY' },
  { symbol: 'GBPUSD', name: 'GBP / USD' },
  { symbol: 'SPX', name: 'S&P 500' },
  { symbol: 'XAUUSD', name: 'Gold (XAU/USD)' },
  { symbol: 'CL', name: 'WTI Crude Oil' },
];

const HORIZON_15Y_OPTIONS = [
  { weeks: 1, label: '1-Week (5-Day Horizon)' },
  { weeks: 4, label: '4-Weeks (20-Day / 1-Month)' },
  { weeks: 12, label: '12-Weeks (60-Day / 1-Quarter)' },
];

const ASSET_OPTIONS_52W = ['EURUSD', 'USDJPY', 'GBPUSD', 'AUDUSD', 'USDCAD', 'XAUUSD', 'CL', 'SPX', 'NIKKEI'];
const HORIZON_OPTIONS_52W = [3, 5, 10, 20];

function accuracyColor(pct: number): string {
  if (pct >= 65) return '#10b981';
  if (pct >= 52) return '#f59e0b';
  return '#f43f5e';
}

function SampleBadge({ n }: { n: number }) {
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 3,
      background: 'rgba(56,189,248,0.12)', color: '#38bdf8',
      fontSize: '0.75rem', fontWeight: 700, padding: '2px 6px',
      borderRadius: 4, fontFamily: 'monospace', letterSpacing: '0.04em',
    }}>
      N={n}
    </span>
  );
}

function PValueBadge({ p }: { p: number }) {
  const sig = p < 0.05;
  return (
    <span style={{
      fontSize: '0.75rem', fontWeight: 700, padding: '2px 6px',
      borderRadius: 4,
      background: sig ? 'rgba(16,185,129,0.15)' : 'rgba(100,116,139,0.15)',
      color: sig ? '#10b981' : 'var(--text-muted)',
    }}>
      p={p < 0.001 ? '<0.001' : p.toFixed(3)}{sig ? ' ★' : ''}
    </span>
  );
}

// ── 15-Year Cumulative Equity Curve SVG ──────────────────────────────────────
function FifteenYearEquityChart({
  equityCurve,
  assetSymbol,
  strategyMode = 'enhanced',
}: {
  equityCurve: Equity15YPoint[];
  assetSymbol: string;
  strategyMode?: 'enhanced' | 'baseline';
}) {
  if (!equityCurve || equityCurve.length < 2) return null;

  const W = 880;
  const H = 250;
  const margin = { left: 55, right: 30, top: 25, bottom: 35 };
  const innerW = W - margin.left - margin.right;
  const innerH = H - margin.top - margin.bottom;

  let minVal = Infinity;
  let maxVal = -Infinity;
  for (const pt of equityCurve) {
    if (pt.strategy_equity < minVal) minVal = pt.strategy_equity;
    if (pt.strategy_equity > maxVal) maxVal = pt.strategy_equity;
    if (pt.buy_hold_equity < minVal) minVal = pt.buy_hold_equity;
    if (pt.buy_hold_equity > maxVal) maxVal = pt.buy_hold_equity;
    if (pt.enhanced_equity !== undefined) {
      if (pt.enhanced_equity < minVal) minVal = pt.enhanced_equity;
      if (pt.enhanced_equity > maxVal) maxVal = pt.enhanced_equity;
    }
  }

  const pad = (maxVal - minVal) * 0.08 || 15;
  const yMin = Math.max(0, Math.floor(minVal - pad));
  const yMax = Math.ceil(maxVal + pad);

  const getX = (idx: number) => margin.left + (idx / (equityCurve.length - 1)) * innerW;
  const getY = (val: number) => margin.top + innerH - ((val - yMin) / (yMax - yMin)) * innerH;

  const stratPoints = equityCurve.map((pt, i) => `${getX(i).toFixed(1)},${getY(pt.strategy_equity).toFixed(1)}`).join(' ');
  const enhancedPoints = equityCurve.map((pt, i) => `${getX(i).toFixed(1)},${getY(pt.enhanced_equity ?? pt.strategy_equity).toFixed(1)}`).join(' ');
  const buyHoldPoints = equityCurve.map((pt, i) => `${getX(i).toFixed(1)},${getY(pt.buy_hold_equity).toFixed(1)}`).join(' ');

  const firstX = getX(0).toFixed(1);
  const lastX = getX(equityCurve.length - 1).toFixed(1);
  const baseY = getY(yMin).toFixed(1);
  
  const activeAreaPoints = strategyMode === 'enhanced' ? enhancedPoints : stratPoints;
  const chartArea = `M${firstX},${baseY} L${activeAreaPoints} L${lastX},${baseY} Z`;

  const y100 = getY(100);
  const ySteps = [
    yMin,
    Math.round(yMin + (yMax - yMin) * 0.25),
    Math.round(yMin + (yMax - yMin) * 0.5),
    Math.round(yMin + (yMax - yMin) * 0.75),
    yMax,
  ];

  // Pick key year markers (e.g. 2011, 2014, 2017, 2020, 2023, 2026)
  const keyYears = ['2011', '2014', '2017', '2020', '2023', '2026'];
  const yearMarkers: { year: string; x: number }[] = [];
  keyYears.forEach(yr => {
    const idx = equityCurve.findIndex(pt => pt.date.startsWith(yr));
    if (idx !== -1) {
      yearMarkers.push({ year: yr, x: getX(idx) });
    }
  });

  const lastPt = equityCurve[equityCurve.length - 1];
  const enhancedRet = lastPt?.enhanced_equity !== undefined ? (lastPt.enhanced_equity - 100).toFixed(1) : null;
  const stratRet = lastPt ? (lastPt.strategy_equity - 100).toFixed(1) : '0.0';
  const bhRet = lastPt ? (lastPt.buy_hold_equity - 100).toFixed(1) : '0.0';

  return (
    <div style={{ position: 'relative', width: '100%', overflowX: 'auto' }}>
      <svg viewBox={`0 0 ${W} ${H}`} style={{ width: '100%', minWidth: 680, fontFamily: 'Inter, sans-serif' }}>
        <defs>
          <linearGradient id="enhancedAreaGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#10b981" stopOpacity="0.32" />
            <stop offset="80%" stopColor="#10b981" stopOpacity="0.04" />
            <stop offset="100%" stopColor="#10b981" stopOpacity="0.0" />
          </linearGradient>
          <linearGradient id="stratAreaGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#38bdf8" stopOpacity="0.25" />
            <stop offset="80%" stopColor="#38bdf8" stopOpacity="0.03" />
            <stop offset="100%" stopColor="#38bdf8" stopOpacity="0.0" />
          </linearGradient>
        </defs>

        {/* Grid lines & Y labels */}
        {ySteps.map(v => (
          <g key={v}>
            <line
              x1={margin.left}
              y1={getY(v)}
              x2={W - margin.right}
              y2={getY(v)}
              stroke="var(--border-subtle, #1e293b)"
              strokeWidth={0.6}
            />
            <text
              x={margin.left - 8}
              y={getY(v) + 3}
              textAnchor="end"
              fontSize="9"
              fill="var(--text-muted, #64748b)"
              fontFamily="monospace"
            >
              {v}
            </text>
          </g>
        ))}

        {/* Base 100 benchmark line */}
        {y100 >= margin.top && y100 <= margin.top + innerH && (
          <g>
            <line
              x1={margin.left}
              y1={y100}
              x2={W - margin.right}
              y2={y100}
              stroke="rgba(148, 163, 184, 0.45)"
              strokeDasharray="4 3"
              strokeWidth={1}
            />
            <text
              x={W - margin.right + 6}
              y={y100 + 3}
              fontSize="8"
              fill="rgba(148, 163, 184, 0.7)"
              fontFamily="monospace"
            >
              100 Base
            </text>
          </g>
        )}

        {/* Shaded Area */}
        <path d={chartArea} fill={strategyMode === 'enhanced' ? 'url(#enhancedAreaGrad)' : 'url(#stratAreaGrad)'} />

        {/* Buy & Hold Path (Grey Dashed) */}
        <polyline
          points={buyHoldPoints}
          fill="none"
          stroke="#64748b"
          strokeWidth={1.5}
          strokeDasharray="4 3"
          opacity={0.7}
        />

        {/* Baseline Fundamental Strategy Path (Cyan) */}
        <polyline
          points={stratPoints}
          fill="none"
          stroke="#38bdf8"
          strokeWidth={strategyMode === 'baseline' ? 2.4 : 1.4}
          strokeLinecap="round"
          strokeLinejoin="round"
          opacity={strategyMode === 'baseline' ? 1.0 : 0.6}
          strokeDasharray={strategyMode === 'baseline' ? undefined : '4 2'}
        />

        {/* Enhanced Strategy Path (Emerald) */}
        {enhancedRet !== null && (
          <polyline
            points={enhancedPoints}
            fill="none"
            stroke="#10b981"
            strokeWidth={strategyMode === 'enhanced' ? 2.6 : 1.6}
            strokeLinecap="round"
            strokeLinejoin="round"
            opacity={strategyMode === 'enhanced' ? 1.0 : 0.6}
          />
        )}

        {/* Year Axis Markers */}
        {yearMarkers.map(m => (
          <g key={m.year}>
            <line
              x1={m.x}
              y1={margin.top + innerH}
              x2={m.x}
              y2={margin.top + innerH + 5}
              stroke="var(--border-subtle, #334155)"
            />
            <text
              x={m.x}
              y={margin.top + innerH + 18}
              textAnchor="middle"
              fontSize="9"
              fill="var(--text-muted, #64748b)"
              fontFamily="monospace"
              fontWeight="600"
            >
              {m.year}
            </text>
          </g>
        ))}

        {/* Legend */}
        <g transform={`translate(${margin.left + 8}, 14)`}>
          {enhancedRet !== null && (
            <>
              <line x1="0" y1="0" x2="20" y2="0" stroke="#10b981" strokeWidth={2.8} />
              <text x="26" y="3" fontSize="10" fontWeight="700" fill="#10b981">
                Enhanced: Macro + COT + Vol Stop ({Number(enhancedRet) >= 0 ? '+' : ''}{enhancedRet}%)
              </text>
            </>
          )}

          <line x1={enhancedRet !== null ? 290 : 0} y1="0" x2={enhancedRet !== null ? 310 : 20} y2="0" stroke="#38bdf8" strokeWidth={1.8} strokeDasharray="4 2" />
          <text x={enhancedRet !== null ? 316 : 26} y="3" fontSize="10" fontWeight="600" fill="#38bdf8">
            Baseline: Pure Macro ({Number(stratRet) >= 0 ? '+' : ''}{stratRet}%)
          </text>

          <line x1={enhancedRet !== null ? 520 : 250} y1="0" x2={enhancedRet !== null ? 540 : 270} y2="0" stroke="#64748b" strokeWidth={1.5} strokeDasharray="4 3" />
          <text x={enhancedRet !== null ? 546 : 276} y="3" fontSize="10" fontWeight="500" fill="var(--text-secondary, #94a3b8)">
            Buy & Hold ({Number(bhRet) >= 0 ? '+' : ''}{bhRet}%)
          </text>
        </g>
      </svg>
    </div>
  );
}

// ── SVG Walk-Forward Timeline (52-Week View) ──────────────────────────────────
function WalkForwardTimeline({ windows }: { windows: WalkForwardWindow[] }) {
  if (!windows.length) return null;

  const W = 760, H = 110;
  const margin = { left: 12, right: 12, top: 24, bottom: 32 };
  const innerW = W - margin.left - margin.right;
  const barH = 32;
  const barY = margin.top;

  const barWidth = innerW / windows.length;

  return (
    <div style={{ overflowX: 'auto' }}>
      <svg viewBox={`0 0 ${W} ${H}`} style={{ width: '100%', fontFamily: 'Inter, sans-serif' }}>
        {windows.map((w, i) => {
          const x = margin.left + i * barWidth;
          const acc = w.val_accuracy_pct;
          const fillColor = acc >= 70 ? '#10b981' : acc >= 55 ? '#f59e0b' : '#f43f5e';
          const fillOpacity = 0.15 + (acc / 100) * 0.55;

          return (
            <g key={w.window_id}>
              {/* Training portion */}
              <rect
                x={x + 1}
                y={barY}
                width={barWidth * 0.65 - 2}
                height={barH}
                fill="rgba(56,189,248,0.06)"
                rx={3}
              />
              {/* Validation portion */}
              <rect
                x={x + barWidth * 0.65 + 1}
                y={barY}
                width={barWidth * 0.35 - 2}
                height={barH}
                fill={fillColor}
                fillOpacity={fillOpacity}
                rx={3}
              />
              {barWidth * 0.35 > 28 && (
                <text
                  x={x + barWidth * 0.825}
                  y={barY + barH / 2 + 4}
                  textAnchor="middle"
                  fontSize="8"
                  fill={fillColor}
                  fontWeight="700"
                  fontFamily="monospace"
                >
                  {acc.toFixed(0)}%
                </text>
              )}
              {i % 4 === 0 && (
                <text
                  x={x + barWidth / 2}
                  y={barY + barH + 18}
                  textAnchor="middle"
                  fontSize="8"
                  fill="var(--text-muted)"
                  fontFamily="monospace"
                >
                  W{w.window_id + 1}
                </text>
              )}
            </g>
          );
        })}
      </svg>
    </div>
  );
}

// ── SVG Calibration Curve (52-Week View) ──────────────────────────────────────
function ReliabilityDiagram({ bins }: { bins: CalibrationBin[] }) {
  if (!bins || !bins.length) return null;

  const W = 380, H = 220;
  const margin = { left: 42, right: 16, top: 16, bottom: 42 };
  const innerW = W - margin.left - margin.right;
  const innerH = H - margin.top - margin.bottom;

  const toX = (pct: number) => margin.left + (pct / 100) * innerW;
  const toY = (pct: number) => margin.top + innerH - (pct / 100) * innerH;

  const nonEmpty = bins.filter(b => b.n_observations > 0);

  return (
    <svg viewBox={`0 0 ${W} ${H}`} style={{ width: '100%', fontFamily: 'Inter, sans-serif' }}>
      {[0, 25, 50, 75, 100].map(v => (
        <g key={v}>
          <line x1={margin.left} y1={toY(v)} x2={W - margin.right} y2={toY(v)}
            stroke="var(--border-subtle, #1e293b)" strokeWidth={0.5} />
          <text x={margin.left - 6} y={toY(v) + 4} textAnchor="end"
            fontSize="8" fill="var(--text-muted, #64748b)">{v}%</text>
        </g>
      ))}

      <line
        x1={toX(0)} y1={toY(0)}
        x2={toX(100)} y2={toY(100)}
        stroke="rgba(100,116,139,0.4)" strokeWidth={1}
        strokeDasharray="4,3"
      />
      <text x={toX(85)} y={toY(90)} fontSize="7" fill="rgba(100,116,139,0.7)">Perfect</text>

      {nonEmpty.length > 1 && (
        <polyline
          points={nonEmpty.map(b => `${toX(b.model_confidence_avg)},${toY(b.actual_hit_rate)}`).join(' ')}
          fill="none"
          stroke="#38bdf8"
          strokeWidth={2}
        />
      )}

      {nonEmpty.map(b => (
        <g key={b.bin_label}>
          <circle
            cx={toX(b.model_confidence_avg)}
            cy={toY(b.actual_hit_rate)}
            r={Math.max(4, Math.min(10, Math.sqrt(b.n_observations) * 1.5))}
            fill={b.is_well_calibrated ? '#10b981' : b.actual_hit_rate < b.model_confidence_avg ? '#f43f5e' : '#f59e0b'}
            fillOpacity={0.85}
            stroke="var(--bg-base, #0a0e17)"
            strokeWidth={1}
          />
          <text
            x={toX(b.model_confidence_avg)}
            y={toY(b.actual_hit_rate) - 10}
            textAnchor="middle"
            fontSize="7"
            fill="var(--text-muted, #64748b)"
          >
            N={b.n_observations}
          </text>
        </g>
      ))}

      <text x={W / 2} y={H - 6} textAnchor="middle" fontSize="8" fill="var(--text-muted, #64748b)">
        Model Confidence (%)
      </text>

      <text
        x={10}
        y={margin.top + innerH / 2}
        textAnchor="middle"
        fontSize="8"
        fill="var(--text-muted, #64748b)"
        transform={`rotate(-90, 10, ${margin.top + innerH / 2})`}
      >
        Actual Hit Rate (%)
      </text>
    </svg>
  );
}

// ── MAIN VALIDATION DASHBOARD COMPONENT ──────────────────────────────────────
export const ValidationDashboard: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'15y' | '52w'>('15y');

  // 15-Year Backtest State
  const [symbol15Y, setSymbol15Y] = useState('EURUSD');
  const [horizonWeeks15Y, setHorizonWeeks15Y] = useState(4);
  const [strategyMode15Y, setStrategyMode15Y] = useState<'enhanced' | 'baseline'>('enhanced');
  const [data15Y, setData15Y] = useState<Historical15YReport | null>(null);
  const [summary15Y, setSummary15Y] = useState<Historical15YSummaryItem[] | null>(null);
  const [loading15Y, setLoading15Y] = useState(true);
  const [error15Y, setError15Y] = useState<string | null>(null);

  // 52-Week Rolling Validation State
  const [symbol52W, setSymbol52W] = useState('EURUSD');
  const [horizonDays52W, setHorizonDays52W] = useState(5);
  const [data52W, setData52W] = useState<ValidationResult | null>(null);
  const [loading52W, setLoading52W] = useState(false);
  const [error52W, setError52W] = useState<string | null>(null);

  // Load 15-Year Data & Summary
  const load15Y = useCallback(() => {
    setLoading15Y(true);
    setError15Y(null);
    Promise.all([
      api.get15YBacktest(symbol15Y, horizonWeeks15Y),
      api.get15YSummary(horizonWeeks15Y),
    ])
      .then(([rep, sum]) => {
        setData15Y(rep);
        setSummary15Y(sum.summary);
        setLoading15Y(false);
      })
      .catch(e => {
        setError15Y(e.message);
        setLoading15Y(false);
      });
  }, [symbol15Y, horizonWeeks15Y]);

  // Load 52-Week Rolling Data
  const load52W = useCallback(() => {
    setLoading52W(true);
    setError52W(null);
    api.getValidationHistorical(symbol52W, horizonDays52W)
      .then(d => {
        setData52W(d);
        setLoading52W(false);
      })
      .catch(e => {
        setError52W(e.message);
        setLoading52W(false);
      });
  }, [symbol52W, horizonDays52W]);

  useEffect(() => {
    load15Y();
  }, [load15Y]);

  useEffect(() => {
    if (activeTab === '52w' && !data52W) {
      load52W();
    }
  }, [activeTab, data52W, load52W]);

  const card = {
    background: 'var(--bg-card)',
    border: '1px solid var(--border-subtle)',
    borderRadius: 10,
    padding: '18px 22px',
  } as React.CSSProperties;

  const metricCard = (color: string) => ({
    ...card,
    borderLeft: `3px solid ${color}`,
    display: 'flex',
    flexDirection: 'column' as const,
    gap: 6,
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 22 }}>
      {/* ── Top Header & Tab Navigation ── */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 16 }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
            <FlaskConical size={22} color="#38bdf8" />
            <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>
              Historical Validation & Empirical Backtesting Engine
            </h2>
          </div>
          <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
            Point-in-time macro modeling · Zero look-ahead bias · Out-of-sample forward walk-forward testing (2011–2026)
          </div>
        </div>

        {/* Tab Switcher */}
        <div style={{ display: 'flex', gap: 4, background: 'var(--bg-card)', padding: 4, borderRadius: 8, border: '1px solid var(--border-subtle)' }}>
          <button
            onClick={() => setActiveTab('15y')}
            style={{
              display: 'flex', alignItems: 'center', gap: 6,
              background: activeTab === '15y' ? 'linear-gradient(135deg, #06b6d4, #3b82f6)' : 'transparent',
              color: activeTab === '15y' ? '#fff' : 'var(--text-muted)',
              border: 'none', padding: '6px 14px', borderRadius: 6,
              fontSize: '0.75rem', fontWeight: 700, cursor: 'pointer',
              transition: 'all 0.2s',
            }}
          >
            <Calendar size={13} />
            15-Year Historical (2011–2026)
          </button>
          <button
            onClick={() => setActiveTab('52w')}
            style={{
              display: 'flex', alignItems: 'center', gap: 6,
              background: activeTab === '52w' ? 'linear-gradient(135deg, #06b6d4, #3b82f6)' : 'transparent',
              color: activeTab === '52w' ? '#fff' : 'var(--text-muted)',
              border: 'none', padding: '6px 14px', borderRadius: 6,
              fontSize: '0.75rem', fontWeight: 700, cursor: 'pointer',
              transition: 'all 0.2s',
            }}
          >
            <Layers size={13} />
            52-Week Rolling Walk-Forward
          </button>
        </div>
      </div>

      {/* ── Strict Point-In-Time Guarantee Banner ── */}
      <div style={{ background: 'rgba(16,185,129,0.06)', border: '1px solid rgba(16,185,129,0.25)', borderRadius: 8, padding: '12px 18px', display: 'flex', alignItems: 'center', gap: 12 }}>
        <ShieldCheck size={20} color="#10b981" />
        <span style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
          <strong style={{ color: '#10b981' }}>Strict Point-in-Time (PIT) Guarantee:</strong> Signals at observation week{' '}
          <code style={{ fontSize: '0.75rem', background: 'rgba(0,0,0,0.3)', padding: '1px 5px', borderRadius: 3 }}>T₀</code>{' '}
          were computed strictly using central bank rates, CPI prints, and yield curve spreads published on or before{' '}
          <code style={{ fontSize: '0.75rem', background: 'rgba(0,0,0,0.3)', padding: '1px 5px', borderRadius: 3 }}>T₀</code>.
          Zero subsequent revisions, zero future price leakage, and verified out-of-sample forward evaluation.
        </span>
      </div>

      {/* ═══════════════════════════════════════════════════════════════════════
          TAB 1: 15-YEAR HISTORICAL VALIDATION (2011 - 2026)
         ═══════════════════════════════════════════════════════════════════════ */}
      {activeTab === '15y' && (
        <>
          {/* Controls Bar */}
          <div style={{ ...card, padding: '12px 18px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600 }}>Trading Asset:</span>
                <select
                  value={symbol15Y}
                  onChange={e => setSymbol15Y(e.target.value)}
                  style={{
                    background: 'var(--bg-card)',
                    border: '1px solid var(--border-subtle)',
                    color: 'var(--text-primary)',
                    padding: '6px 12px',
                    borderRadius: 6,
                    fontSize: '0.78rem',
                    fontWeight: 700,
                    cursor: 'pointer',
                  }}
                >
                  {ASSET_15Y_OPTIONS.map(a => (
                    <option key={a.symbol} value={a.symbol}>
                      {a.symbol} — {a.name}
                    </option>
                  ))}
                </select>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600 }}>Forward Horizon:</span>
                <div style={{ display: 'flex', gap: 4 }}>
                  {HORIZON_15Y_OPTIONS.map(h => (
                    <button
                      key={h.weeks}
                      onClick={() => setHorizonWeeks15Y(h.weeks)}
                      style={{
                        background: horizonWeeks15Y === h.weeks ? 'rgba(56,189,248,0.18)' : 'var(--bg-main)',
                        border: `1px solid ${horizonWeeks15Y === h.weeks ? '#38bdf8' : 'var(--border-subtle)'}`,
                        color: horizonWeeks15Y === h.weeks ? '#38bdf8' : 'var(--text-secondary)',
                        borderRadius: 6,
                        padding: '5px 10px',
                        fontSize: '0.75rem',
                        fontWeight: 700,
                        cursor: 'pointer',
                      }}
                    >
                      {h.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <button
              onClick={load15Y}
              disabled={loading15Y}
              style={{
                display: 'flex', alignItems: 'center', gap: 6,
                background: 'linear-gradient(135deg, #06b6d4, #3b82f6)',
                border: 'none', color: '#fff',
                padding: '6px 14px', borderRadius: 6,
                fontSize: '0.75rem', fontWeight: 700,
                cursor: 'pointer', opacity: loading15Y ? 0.7 : 1,
              }}
            >
              <RefreshCw size={13} style={{ animation: loading15Y ? 'spin 1s linear infinite' : 'none' }} />
              {loading15Y ? 'Recomputing…' : 'Run 15-Year Backtest'}
            </button>
          </div>

          {error15Y && (
            <div style={{ background: 'rgba(244,63,94,0.08)', border: '1px solid rgba(244,63,94,0.3)', borderRadius: 8, padding: '12px 16px', color: '#f43f5e', fontSize: '0.8rem' }}>
              <AlertTriangle size={14} style={{ marginRight: 6 }} />
              {error15Y}
            </div>
          )}

          {/* ── Cross-Asset Comparative Overview ── */}
          {summary15Y && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                15-Year Cross-Asset Performance Matrix (2011–2026 · {horizonWeeks15Y}-Week Forward Horizon)
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 10 }}>
                {summary15Y.map(s => {
                  const isSelected = s.symbol === symbol15Y;
                  return (
                    <div
                      key={s.symbol}
                      onClick={() => setSymbol15Y(s.symbol)}
                      style={{
                        ...card,
                        padding: '12px 14px',
                        cursor: 'pointer',
                        border: isSelected ? '1px solid #38bdf8' : '1px solid var(--border-subtle)',
                        background: isSelected ? 'rgba(56,189,248,0.05)' : 'var(--bg-card)',
                        boxShadow: isSelected ? '0 0 12px rgba(56,189,248,0.15)' : 'none',
                        transition: 'all 0.2s',
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                        <span style={{ fontSize: '0.85rem', fontWeight: 800, color: isSelected ? '#38bdf8' : 'var(--text-primary)' }}>
                          {s.symbol}
                        </span>
                        <span className="mono" style={{ fontSize: '0.82rem', fontWeight: 800, color: accuracyColor(s.overall_hit_rate_pct) }}>
                          {s.overall_hit_rate_pct.toFixed(1)}% Hit
                        </span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                        <span>Sharpe: <strong className="mono" style={{ color: 'var(--text-primary)' }}>{s.sharpe_equivalent.toFixed(2)}</strong></span>
                        <span>OOS: <strong className="mono" style={{ color: accuracyColor(s.oos_accuracy_pct) }}>{s.oos_accuracy_pct.toFixed(0)}%</strong></span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: 4 }}>
                        <span>Strategy: <strong className="mono" style={{ color: s.cumulative_strategy_return_pct >= 0 ? '#10b981' : '#f43f5e' }}>{s.cumulative_strategy_return_pct >= 0 ? '+' : ''}{s.cumulative_strategy_return_pct}%</strong></span>
                        <span>B&H: <strong className="mono" style={{ color: 'var(--text-secondary)' }}>{s.cumulative_buy_hold_return_pct >= 0 ? '+' : ''}{s.cumulative_buy_hold_return_pct}%</strong></span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {data15Y && (
            <>
              {/* ── Strategy Mode Selector Banner ── */}
              <div style={{
                background: 'rgba(15, 23, 42, 0.75)',
                border: '1px solid var(--border-subtle)',
                borderRadius: 10,
                padding: '12px 18px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                flexWrap: 'wrap',
                gap: 12,
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <ShieldCheck size={20} color={strategyMode15Y === 'enhanced' ? '#10b981' : '#38bdf8'} />
                  <div>
                    <div style={{ fontSize: '0.82rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                      Execution Strategy: {strategyMode15Y === 'enhanced' ? 'Enhanced High-Conviction (Macro + CFTC COT + Vol Stop)' : 'Baseline Unhedged (Pure Macro Signals)'}
                    </div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                      {strategyMode15Y === 'enhanced'
                        ? 'Filters out false breakouts and squeeze traps when speculative managed money is overcrowded (>80 or <20 index).'
                        : 'Raw linear macro signal execution without institutional positioning exhaustion filters.'}
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: 6, background: 'var(--bg-main)', padding: 3, borderRadius: 8, border: '1px solid var(--border-subtle)' }}>
                  <button
                    onClick={() => setStrategyMode15Y('enhanced')}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 6,
                      background: strategyMode15Y === 'enhanced' ? 'linear-gradient(135deg, #10b981, #059669)' : 'transparent',
                      color: strategyMode15Y === 'enhanced' ? '#fff' : 'var(--text-muted)',
                      border: 'none', padding: '6px 14px', borderRadius: 6,
                      fontSize: '0.75rem', fontWeight: 700, cursor: 'pointer',
                      transition: 'all 0.15s ease',
                    }}
                  >
                    <Target size={13} />
                    Enhanced (Macro + COT + Stop)
                  </button>
                  <button
                    onClick={() => setStrategyMode15Y('baseline')}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 6,
                      background: strategyMode15Y === 'baseline' ? 'rgba(56,189,248,0.2)' : 'transparent',
                      color: strategyMode15Y === 'baseline' ? '#38bdf8' : 'var(--text-muted)',
                      border: 'none', padding: '6px 14px', borderRadius: 6,
                      fontSize: '0.75rem', fontWeight: 700, cursor: 'pointer',
                      transition: 'all 0.15s ease',
                    }}
                  >
                    Baseline (Pure Macro)
                  </button>
                </div>
              </div>

              {/* ── 15-Year Scorecard KPIs ── */}
              {(() => {
                const isEnh = strategyMode15Y === 'enhanced' && data15Y.enhanced_hit_rate_pct !== undefined;
                const hitRate = isEnh ? data15Y.enhanced_hit_rate_pct! : data15Y.overall_hit_rate_pct;
                const sharpe = isEnh ? data15Y.enhanced_sharpe_equivalent! : data15Y.sharpe_equivalent;
                const winLoss = isEnh ? data15Y.enhanced_win_loss_ratio! : data15Y.win_loss_ratio;
                const cumReturn = isEnh ? data15Y.enhanced_cumulative_return_pct! : data15Y.cumulative_strategy_return_pct;
                const maxDD = isEnh ? data15Y.enhanced_max_drawdown_pct! : data15Y.max_drawdown_pct;
                const activeSignals = isEnh ? (data15Y.enhanced_signals_count ?? data15Y.total_signals) : data15Y.total_signals;
                const filteredTraps = data15Y.total_signals - activeSignals;

                return (
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 12 }}>
                    <div style={metricCard(isEnh ? '#10b981' : '#38bdf8')}>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                        15Y Hit Rate ({isEnh ? 'Enhanced' : 'Baseline'})
                      </div>
                      <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
                        <span className="mono" style={{ fontSize: '1.75rem', fontWeight: 800, color: accuracyColor(hitRate) }}>
                          {hitRate.toFixed(1)}%
                        </span>
                        <SampleBadge n={activeSignals} />
                      </div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                        {isEnh && filteredTraps > 0 ? `${filteredTraps} squeeze traps avoided` : `${horizonWeeks15Y}-week forward direction`}
                      </div>
                    </div>

                    <div style={metricCard('#38bdf8')}>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                        Walk-Forward OOS
                      </div>
                      <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
                        <span className="mono" style={{ fontSize: '1.75rem', fontWeight: 800, color: accuracyColor(data15Y.walk_forward_oos_accuracy_pct) }}>
                          {data15Y.walk_forward_oos_accuracy_pct.toFixed(1)}%
                        </span>
                      </div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                        Out-of-sample forward test
                      </div>
                    </div>

                    <div style={metricCard('#a78bfa')}>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                        Sharpe Equivalent
                      </div>
                      <div>
                        <span className="mono" style={{ fontSize: '1.75rem', fontWeight: 800, color: sharpe > 0.5 ? '#10b981' : sharpe > 0 ? '#f59e0b' : '#f43f5e' }}>
                          {sharpe.toFixed(2)}
                        </span>
                      </div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                        {isEnh ? 'Risk-adjusted (COT + ATR stop)' : 'Unhedged baseline signal'}
                      </div>
                    </div>

                    <div style={metricCard('#f59e0b')}>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                        Win / Loss Ratio
                      </div>
                      <div>
                        <span className="mono" style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                          {winLoss.toFixed(2)}x
                        </span>
                      </div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                        Profit factor on winning calls
                      </div>
                    </div>

                    <div style={metricCard('#06b6d4')}>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                        Strategy Cumulative
                      </div>
                      <div>
                        <span className="mono" style={{ fontSize: '1.75rem', fontWeight: 800, color: cumReturn >= 0 ? '#10b981' : '#f43f5e' }}>
                          {cumReturn >= 0 ? '+' : ''}{cumReturn.toFixed(1)}%
                        </span>
                      </div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                        vs Buy & Hold {data15Y.cumulative_buy_hold_return_pct >= 0 ? '+' : ''}{data15Y.cumulative_buy_hold_return_pct.toFixed(1)}%
                      </div>
                    </div>

                    <div style={metricCard('#ec4899')}>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                        Max Drawdown
                      </div>
                      <div>
                        <span className="mono" style={{ fontSize: '1.75rem', fontWeight: 800, color: maxDD < 15 ? '#10b981' : maxDD < 30 ? '#f59e0b' : '#f43f5e' }}>
                          -{maxDD.toFixed(1)}%
                        </span>
                      </div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                        {isEnh ? 'Controlled via volatility stops' : 'Peak-to-trough unhedged'}
                      </div>
                    </div>
                  </div>
                );
              })()}

              {/* ── Directional Split ── */}
              <div style={card}>
                <div style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: 12 }}>
                  Directional Signal Breakdown ({data15Y.asset_symbol} · 780 Observation Weeks)
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 14 }}>
                  <div style={{ background: 'var(--bg-main)', border: '1px solid var(--border-subtle)', borderRadius: 8, padding: '12px 16px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
                      <ArrowUpRight size={15} color="#10b981" />
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Bullish Signals Accuracy</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
                      <span className="mono" style={{ fontSize: '1.4rem', fontWeight: 800, color: accuracyColor(data15Y.bullish_hit_rate_pct) }}>
                        {data15Y.bullish_hit_rate_pct.toFixed(1)}%
                      </span>
                      <SampleBadge n={data15Y.bullish_signals_count} />
                    </div>
                  </div>

                  <div style={{ background: 'var(--bg-main)', border: '1px solid var(--border-subtle)', borderRadius: 8, padding: '12px 16px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
                      <ArrowDownRight size={15} color="#f43f5e" />
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Bearish Signals Accuracy</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
                      <span className="mono" style={{ fontSize: '1.4rem', fontWeight: 800, color: accuracyColor(data15Y.bearish_hit_rate_pct) }}>
                        {data15Y.bearish_hit_rate_pct.toFixed(1)}%
                      </span>
                      <SampleBadge n={data15Y.bearish_signals_count} />
                    </div>
                  </div>

                  <div style={{ background: 'var(--bg-main)', border: '1px solid var(--border-subtle)', borderRadius: 8, padding: '12px 16px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
                      <Minus size={15} color="#64748b" />
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Neutral / Rangebound</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
                      <span className="mono" style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--text-secondary)' }}>
                        {data15Y.neutral_signals_count}
                      </span>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>weeks (flat / zero delta)</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* ── 15-Year Cumulative Equity Curve Chart ── */}
              <div style={card}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
                  <div>
                    <div style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                      15-Year Cumulative Equity Curve (2011–2026)
                    </div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: 2 }}>
                      Macro-fundamental directional bias execution vs Buy & Hold benchmark. Base 100.0.
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                      {data15Y.equity_curve.length} weekly points
                    </span>
                  </div>
                </div>
                <FifteenYearEquityChart
                  equityCurve={data15Y.equity_curve}
                  assetSymbol={data15Y.asset_symbol}
                  strategyMode={strategyMode15Y}
                />
              </div>

              {/* ── 5 Historical Macro Regimes Performance Breakdown ── */}
              <div style={card}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
                  <div>
                    <div style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                      Macroeconomic Regime Performance Breakdown (5 Eras)
                    </div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: 2 }}>
                      Evaluates how fundamental signals performed across distinct monetary regimes (ZIRP, tightening, pandemic, inflation shock, pivot).
                    </div>
                  </div>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                    5 Eras (2011–2026)
                  </span>
                </div>
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.75rem' }}>
                    <thead>
                      <tr style={{ borderBottom: '1px solid var(--border-subtle)', color: 'var(--text-muted)' }}>
                        <th style={{ padding: '8px 12px', textAlign: 'left', fontWeight: 600 }}>Regime Era</th>
                        <th style={{ padding: '8px 12px', textAlign: 'left', fontWeight: 600 }}>Timeframe</th>
                        <th style={{ padding: '8px 12px', textAlign: 'right', fontWeight: 600 }}>Signals</th>
                        <th style={{ padding: '8px 12px', textAlign: 'right', fontWeight: 600 }}>Hit Rate</th>
                        <th style={{ padding: '8px 12px', textAlign: 'right', fontWeight: 600 }}>Avg Gain</th>
                        <th style={{ padding: '8px 12px', textAlign: 'right', fontWeight: 600 }}>Avg Loss</th>
                        <th style={{ padding: '8px 12px', textAlign: 'right', fontWeight: 600 }}>Win/Loss</th>
                        <th style={{ padding: '8px 12px', textAlign: 'right', fontWeight: 600 }}>Sharpe</th>
                      </tr>
                    </thead>
                    <tbody>
                      {data15Y.regime_breakdowns.map(r => (
                        <tr key={r.regime_id} style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                          <td style={{ padding: '10px 12px' }}>
                            <div style={{ fontWeight: 700, color: 'var(--text-primary)' }}>{r.regime_name}</div>
                            <div style={{ fontSize: '0.75rem', color: 'var(--text-dim, #64748b)', maxWidth: 280, marginTop: 2 }}>
                              {r.description}
                            </div>
                          </td>
                          <td style={{ padding: '10px 12px', color: 'var(--text-secondary)', fontFamily: 'monospace', whiteSpace: 'nowrap' }}>
                            {r.start_date.substring(0, 7)} → {r.end_date.substring(0, 7)}
                          </td>
                          <td style={{ padding: '10px 12px', textAlign: 'right' }}>
                            <SampleBadge n={r.total_signals} />
                          </td>
                          <td style={{ padding: '10px 12px', textAlign: 'right' }}>
                            <span className="mono" style={{ fontWeight: 800, color: accuracyColor(r.hit_rate_pct) }}>
                              {r.hit_rate_pct.toFixed(1)}%
                            </span>
                          </td>
                          <td className="mono" style={{ padding: '10px 12px', textAlign: 'right', color: '#10b981', fontWeight: 700 }}>
                            +{r.avg_gain_pct.toFixed(2)}%
                          </td>
                          <td className="mono" style={{ padding: '10px 12px', textAlign: 'right', color: '#f43f5e', fontWeight: 700 }}>
                            -{r.avg_loss_pct.toFixed(2)}%
                          </td>
                          <td className="mono" style={{ padding: '10px 12px', textAlign: 'right', color: 'var(--text-primary)', fontWeight: 700 }}>
                            {r.win_loss_ratio.toFixed(2)}x
                          </td>
                          <td className="mono" style={{ padding: '10px 12px', textAlign: 'right', color: r.sharpe_equivalent > 0 ? '#10b981' : '#f43f5e', fontWeight: 700 }}>
                            {r.sharpe_equivalent.toFixed(2)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* ── Milestone Historical Case Studies (Point-In-Time Empirical Proof) ── */}
              <div style={card}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
                  <div>
                    <div style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                      Empirical Historical Milestones & Inflection Points (Proof of Signal Value)
                    </div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: 2 }}>
                      Shows what the model predicted at historic market moments using only point-in-time data available on that day, and how price actually moved.
                    </div>
                  </div>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                    {data15Y.milestone_case_studies.length} Milestones
                  </span>
                </div>
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.75rem' }}>
                    <thead>
                      <tr style={{ borderBottom: '1px solid var(--border-subtle)', color: 'var(--text-muted)' }}>
                        <th style={{ padding: '8px 10px', textAlign: 'left', fontWeight: 600 }}>Date</th>
                        <th style={{ padding: '8px 10px', textAlign: 'left', fontWeight: 600 }}>Historical Milestone</th>
                        <th style={{ padding: '8px 10px', textAlign: 'left', fontWeight: 600 }}>Point-in-Time Macro Context</th>
                        <th style={{ padding: '8px 10px', textAlign: 'center', fontWeight: 600 }}>Model Bias & Score</th>
                        <th style={{ padding: '8px 10px', textAlign: 'right', fontWeight: 600 }}>Actual {horizonWeeks15Y}W Move</th>
                        <th style={{ padding: '8px 10px', textAlign: 'center', fontWeight: 600 }}>Verdict</th>
                      </tr>
                    </thead>
                    <tbody>
                      {data15Y.milestone_case_studies.map((m, i) => {
                        const isAccurate = m.verdict === 'ACCURATE';
                        return (
                          <tr key={i} style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                            <td style={{ padding: '10px 10px', color: 'var(--text-secondary)', fontFamily: 'monospace', whiteSpace: 'nowrap' }}>
                              {m.date}
                            </td>
                            <td style={{ padding: '10px 10px', fontWeight: 700, color: 'var(--text-primary)', whiteSpace: 'nowrap' }}>
                              {m.event_title}
                            </td>
                            <td style={{ padding: '10px 10px', color: 'var(--text-secondary)', fontSize: '0.75rem', lineHeight: 1.4, maxWidth: 320 }}>
                              {m.macro_context}
                            </td>
                            <td style={{ padding: '10px 10px', textAlign: 'center' }}>
                              <span style={{
                                display: 'inline-flex', alignItems: 'center', gap: 4,
                                background: m.predicted_bias === 'BULLISH' ? 'rgba(16,185,129,0.15)' : m.predicted_bias === 'BEARISH' ? 'rgba(244,63,94,0.15)' : 'rgba(100,116,139,0.15)',
                                color: m.predicted_bias === 'BULLISH' ? '#10b981' : m.predicted_bias === 'BEARISH' ? '#f43f5e' : 'var(--text-muted)',
                                padding: '2px 8px', borderRadius: 4, fontSize: '0.75rem', fontWeight: 800,
                              }}>
                                {m.predicted_bias} ({m.model_score > 0 ? '+' : ''}{m.model_score.toFixed(1)})
                              </span>
                            </td>
                            <td className="mono" style={{ padding: '10px 10px', textAlign: 'right', fontWeight: 800, color: m.forward_return_pct >= 0 ? '#10b981' : '#f43f5e' }}>
                              {m.forward_return_pct >= 0 ? '+' : ''}{m.forward_return_pct.toFixed(2)}%
                            </td>
                            <td style={{ padding: '10px 10px', textAlign: 'center' }}>
                              <span style={{
                                display: 'inline-flex', alignItems: 'center', gap: 4,
                                background: isAccurate ? 'rgba(16,185,129,0.15)' : 'rgba(244,63,94,0.15)',
                                color: isAccurate ? '#10b981' : '#f43f5e',
                                padding: '2px 8px', borderRadius: 4, fontSize: '0.75rem', fontWeight: 800, letterSpacing: '0.04em',
                              }}>
                                {isAccurate ? '✓ ACCURATE' : '✕ INVALIDATED'}
                              </span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Disclaimer */}
              <div style={{ fontSize: '0.75rem', color: 'var(--text-dim, #475569)', lineHeight: 1.6, padding: '8px 0', borderTop: '1px solid var(--border-subtle)' }}>
                <strong>Institutional Disclaimer:</strong> {data15Y.disclaimer}
              </div>
            </>
          )}
        </>
      )}

      {/* ═══════════════════════════════════════════════════════════════════════
          TAB 2: 52-WEEK ROLLING WALK-FORWARD & CALIBRATION
         ═══════════════════════════════════════════════════════════════════════ */}
      {activeTab === '52w' && (
        <>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <select
                value={symbol52W}
                onChange={e => setSymbol52W(e.target.value)}
                style={{ background: 'var(--bg-card)', border: '1px solid var(--border-subtle)', color: 'var(--text-primary)', padding: '6px 10px', borderRadius: 6, fontSize: '0.75rem', fontWeight: 700, cursor: 'pointer' }}
              >
                {ASSET_OPTIONS_52W.map(a => <option key={a} value={a}>{a}</option>)}
              </select>
              <select
                value={horizonDays52W}
                onChange={e => setHorizonDays52W(Number(e.target.value))}
                style={{ background: 'var(--bg-card)', border: '1px solid var(--border-subtle)', color: 'var(--text-primary)', padding: '6px 10px', borderRadius: 6, fontSize: '0.75rem', fontWeight: 600, cursor: 'pointer' }}
              >
                {HORIZON_OPTIONS_52W.map(h => <option key={h} value={h}>{h}-Day Horizon</option>)}
              </select>
              <button
                onClick={load52W}
                disabled={loading52W}
                style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'linear-gradient(135deg, #06b6d4, #3b82f6)', border: 'none', color: '#fff', padding: '6px 14px', borderRadius: 6, fontSize: '0.75rem', fontWeight: 700, cursor: 'pointer', opacity: loading52W ? 0.7 : 1 }}
              >
                <RefreshCw size={13} style={{ animation: loading52W ? 'spin 1s linear infinite' : 'none' }} />
                {loading52W ? 'Running…' : 'Run 52W Validation'}
              </button>
            </div>
          </div>

          {error52W && (
            <div style={{ background: 'rgba(244,63,94,0.08)', border: '1px solid rgba(244,63,94,0.3)', borderRadius: 8, padding: '12px 16px', color: '#f43f5e', fontSize: '0.8rem' }}>
              <AlertTriangle size={14} style={{ marginRight: 6 }} />
              {error52W}
            </div>
          )}

          {data52W && (
            <>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 12 }}>
                <div style={metricCard('#10b981')}>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Overall Hit Rate</div>
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
                    <span className="mono" style={{ fontSize: '1.7rem', fontWeight: 800, color: accuracyColor(data52W.overall_accuracy_pct) }}>
                      {data52W.overall_accuracy_pct.toFixed(1)}%
                    </span>
                    <SampleBadge n={data52W.n_total_signals} />
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Directional signals only</div>
                </div>

                <div style={metricCard('#38bdf8')}>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>OOS Accuracy</div>
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
                    <span className="mono" style={{ fontSize: '1.7rem', fontWeight: 800, color: accuracyColor(data52W.oos_accuracy_pct) }}>
                      {data52W.oos_accuracy_pct.toFixed(1)}%
                    </span>
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Walk-forward out-of-sample</div>
                </div>

                <div style={metricCard('#a78bfa')}>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Sharpe-Equiv.</div>
                  <div>
                    <span className="mono" style={{ fontSize: '1.7rem', fontWeight: 800, color: data52W.sharpe_equivalent > 0.5 ? '#10b981' : data52W.sharpe_equivalent > 0 ? '#f59e0b' : '#f43f5e' }}>
                      {data52W.sharpe_equivalent.toFixed(2)}
                    </span>
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Annualised signal Sharpe</div>
                </div>

                <div style={metricCard('#f59e0b')}>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Win / Loss Ratio</div>
                  <div>
                    <span className="mono" style={{ fontSize: '1.7rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                      {data52W.win_loss_ratio.toFixed(2)}x
                    </span>
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Avg +{data52W.avg_gain_pct}% / {data52W.avg_loss_pct}%</div>
                </div>

                <div style={metricCard('#64748b')}>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>IC</div>
                  <div>
                    <span className="mono" style={{ fontSize: '1.7rem', fontWeight: 800, color: data52W.information_coefficient > 0.05 ? '#10b981' : data52W.information_coefficient < 0 ? '#f43f5e' : 'var(--text-secondary)' }}>
                      {data52W.information_coefficient.toFixed(4)}
                    </span>
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Information Coefficient</div>
                </div>

                <div style={metricCard('#f43f5e')}>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>False Signal Rate</div>
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
                    <span className="mono" style={{ fontSize: '1.7rem', fontWeight: 800, color: data52W.false_signal_rate_pct > 30 ? '#f43f5e' : '#f59e0b' }}>
                      {data52W.false_signal_rate_pct.toFixed(1)}%
                    </span>
                    <SampleBadge n={data52W.false_signals.length} />
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>High-conviction reversals ≤3d</div>
                </div>
              </div>

              {/* 52W Walk-Forward Timeline */}
              <div style={card}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
                  <div>
                    <div style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                      Walk-Forward Validation Timeline (52 Weeks)
                    </div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: 2 }}>
                      Each window: 8-week training · 4-week out-of-sample validation.
                    </div>
                  </div>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                    {data52W.walk_forward_windows.length} windows
                  </span>
                </div>
                <WalkForwardTimeline windows={data52W.walk_forward_windows} />
              </div>

              {/* Confusion Matrix */}
              <div style={card}>
                <div style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: 14 }}>
                  Directional Confusion Matrix
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 4, maxWidth: 320, marginBottom: 16 }}>
                  {[
                    { label: 'True Positive', val: data52W.confusion_matrix.true_positive, desc: 'Bullish → UP', color: '#10b981' },
                    { label: 'False Positive', val: data52W.confusion_matrix.false_positive, desc: 'Bullish → DOWN', color: '#f43f5e' },
                    { label: 'False Negative', val: data52W.confusion_matrix.false_negative, desc: 'Bearish → UP', color: '#f43f5e' },
                    { label: 'True Negative', val: data52W.confusion_matrix.true_negative, desc: 'Bearish → DOWN', color: '#10b981' },
                  ].map(cell => (
                    <div key={cell.label} style={{ background: `rgba(${cell.color === '#10b981' ? '16,185,129' : '244,63,94'},0.08)`, border: `1px solid rgba(${cell.color === '#10b981' ? '16,185,129' : '244,63,94'},0.2)`, borderRadius: 6, padding: '10px 14px', textAlign: 'center' }}>
                      <div className="mono" style={{ fontSize: '1.4rem', fontWeight: 800, color: cell.color }}>{cell.val}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: 2 }}>{cell.label}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-dim, #475569)' }}>{cell.desc}</div>
                    </div>
                  ))}
                </div>
                <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
                  {[
                    { label: 'Precision', val: data52W.confusion_matrix.precision },
                    { label: 'Recall', val: data52W.confusion_matrix.recall },
                    { label: 'F1 Score', val: data52W.confusion_matrix.f1_score },
                  ].map(m => (
                    <div key={m.label} style={{ background: 'var(--bg-main)', border: '1px solid var(--border-subtle)', borderRadius: 6, padding: '8px 14px' }}>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{m.label}</div>
                      <div className="mono" style={{ fontSize: '1rem', fontWeight: 800, color: '#38bdf8' }}>{m.val.toFixed(1)}%</div>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}
        </>
      )}
    </div>
  );
};
