import React, { useEffect, useState } from 'react';
import {
  Grid3X3,
  ArrowUpDown,
  TrendingUp,
  TrendingDown,
  RefreshCw,
  ArrowUpRight,
  ArrowDownRight,
  Minus,
  Swords,
} from 'lucide-react';
import { CurrencyMatrixItem } from '../types/macro';
import { api } from '../services/api';

interface CellHoverData {
  base: string;
  quote: string;
  pair: string;
  score: number;
  bias: string;
  confidence: number;
  driver: string;
  x: number;
  y: number;
}

interface CurrencyMatrixViewProps {
  theme?: 'dark' | 'light';
  onSelectPairAsset?: (symbol: string) => void;
  onOpenMacroBattle?: (base: string, quote: string) => void;
}

function getMatrixCellStyles(score: number, isLight: boolean) {
  const isPositive = score > 0;
  const intensity = Math.min(0.4, Math.abs(score) / 160.0);

  if (isLight) {
    // High-contrast Light Mode: deep forest green (#065f46) and deep crimson (#991b1b)
    const alpha = (0.09 + intensity * 0.28).toFixed(2);
    return {
      bg: isPositive ? `rgba(16, 185, 129, ${alpha})` : `rgba(239, 68, 68, ${alpha})`,
      textColor: isPositive ? '#065f46' : '#991b1b',
      arrowColor: isPositive ? '#065f46' : '#991b1b',
      borderColor: isPositive ? 'rgba(5, 150, 105, 0.35)' : 'rgba(220, 38, 38, 0.35)',
    };
  } else {
    // Terminal Dark Mode: glowing pastel mint (#6ee7b7) and rose (#fca5a5)
    const alpha = (0.14 + intensity).toFixed(2);
    return {
      bg: isPositive ? `rgba(16, 185, 129, ${alpha})` : `rgba(239, 68, 68, ${alpha})`,
      textColor: isPositive ? '#6ee7b7' : '#fca5a5',
      arrowColor: isPositive ? '#34d399' : '#f87171',
      borderColor: 'var(--border-subtle)',
    };
  }
}

export const CurrencyMatrixView: React.FC<CurrencyMatrixViewProps> = ({
  theme = 'dark',
  onSelectPairAsset,
  onOpenMacroBattle,
}) => {
  // Live reactive light mode detection across React props, DOM data-theme and body classes
  const [isLightMode, setIsLightMode] = useState<boolean>(() => {
    if (typeof document !== 'undefined') {
      const docTheme = document.documentElement.getAttribute('data-theme');
      if (docTheme === 'light' || document.body.classList.contains('theme-light')) return true;
      if (docTheme === 'dark') return false;
      const saved = localStorage.getItem('terminal-theme');
      if (saved === 'light') return true;
    }
    return theme === 'light';
  });

  useEffect(() => {
    const checkTheme = () => {
      const docTheme = document.documentElement.getAttribute('data-theme');
      const isL =
        theme === 'light' ||
        docTheme === 'light' ||
        (typeof document !== 'undefined' && document.body.classList.contains('theme-light'));
      setIsLightMode(isL);
    };
    checkTheme();

    if (typeof document !== 'undefined') {
      const observer = new MutationObserver(checkTheme);
      observer.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme', 'class'] });
      observer.observe(document.body, { attributes: true, attributeFilter: ['data-theme', 'class'] });
      return () => observer.disconnect();
    }
  }, [theme]);

  const [matrix, setMatrix] = useState<CurrencyMatrixItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [hoveredCell, setHoveredCell] = useState<CellHoverData | null>(null);

  const loadData = () => {
    setLoading(true);
    api.getCurrencyMatrix()
      .then((data) => {
        setMatrix(data);
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

  const currencies = matrix.map((m) => m.currency);

  const handleMouseEnterCell = (
    e: React.MouseEvent,
    row: CurrencyMatrixItem,
    colCurr: string,
    score: number
  ) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const isBull = score > 10;
    const isBear = score < -10;
    const bias = isBull
      ? score > 25
        ? 'STRONG BULLISH'
        : 'BULLISH'
      : isBear
      ? score < -25
        ? 'STRONG BEARISH'
        : 'BEARISH'
      : 'NEUTRAL';

    const driver =
      row.policy_stance.includes('Hawkish') || row.policy_stance.includes('Restrictive')
        ? `${row.currency} monetary policy divergence over ${colCurr}`
        : `${row.currency} yield differential & growth momentum vs ${colCurr}`;

    setHoveredCell({
      base: row.currency,
      quote: colCurr,
      pair: `${row.currency}${colCurr}`,
      score,
      bias,
      confidence: Math.min(94, Math.max(70, Math.round(75 + Math.abs(score) * 0.2))),
      driver,
      x: rect.right + 10,
      y: rect.top,
    });
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20, position: 'relative' }}>
      {/* Top Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-primary)' }}>
            Global Currency Relative-Value Strength Matrix
          </h2>
          <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: 2 }}>
            Base vs. Quote relative fundamental strength model • Hover cells for driver attribution
          </div>
        </div>
        <button
          onClick={loadData}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            background: 'var(--surface-2)',
            border: '1px solid var(--border-subtle)',
            color: 'var(--text-secondary)',
            padding: '6px 12px',
            borderRadius: 'var(--radius-sm)',
            fontSize: '0.75rem',
            fontWeight: 600,
            cursor: 'pointer',
          }}
        >
          <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
          Refresh Matrix
        </button>
      </div>

      {/* Ranked Currencies Cards */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(170px, 1fr))',
          gap: 12,
        }}
      >
        {matrix.map((c) => (
          <div
            key={c.currency}
            style={{
              background: 'var(--surface-1)',
              border: '1px solid var(--border-subtle)',
              borderRadius: 'var(--radius-md)',
              padding: '12px 14px',
              borderTop:
                c.rank <= 3
                  ? `3px solid ${isLightMode ? '#059669' : '#10b981'}`
                  : c.rank >= 9
                  ? `3px solid ${isLightMode ? '#dc2626' : '#f43f5e'}`
                  : `3px solid ${isLightMode ? '#cbd5e1' : 'var(--border-strong)'}`,
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span
                className="mono"
                style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--text-primary)' }}
              >
                {c.currency}
              </span>
              <span
                style={{
                  fontSize: '0.68rem',
                  fontWeight: 700,
                  color: isLightMode ? '#334155' : 'var(--text-muted)',
                  background: isLightMode ? '#e2e8f0' : 'var(--surface-3)',
                  padding: '2px 6px',
                  borderRadius: 4,
                }}
              >
                #{c.rank}
              </span>
            </div>
            <div style={{ fontSize: '0.7rem', color: isLightMode ? '#475569' : 'var(--text-muted)', marginTop: 2 }}>
              {c.name}
            </div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 6, marginTop: 8 }}>
              <span
                className="mono"
                style={{
                  fontSize: '1.25rem',
                  fontWeight: 800,
                  color:
                    c.absolute_score >= 0
                      ? isLightMode ? '#059669' : '#10b981'
                      : isLightMode ? '#dc2626' : '#f43f5e',
                }}
              >
                {c.absolute_score > 0 ? `+${c.absolute_score.toFixed(1)}` : c.absolute_score.toFixed(1)}
              </span>
            </div>
            <div
              style={{
                fontSize: '0.68rem',
                color: isLightMode ? '#475569' : 'var(--text-dim)',
                marginTop: 6,
                display: 'flex',
                justifyContent: 'space-between',
              }}
            >
              <span>{c.policy_stance}</span>
              <span>{c.growth_stance}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Cross-Comparison Matrix Table */}
      <div
        style={{
          background: 'var(--surface-1)',
          border: '1px solid var(--border-subtle)',
          borderRadius: 'var(--radius-lg)',
          padding: '18px',
          overflowX: 'auto',
          boxShadow: 'var(--shadow-sm)',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
          <h3 style={{ fontSize: '0.92rem', fontWeight: 800, color: 'var(--text-primary)' }}>
            Pair Relative Macro Scores (Row Base − Column Quote)
          </h3>
          <span className="matrix-legend-text" style={{ fontSize: '0.74rem', fontWeight: 600 }}>
            Green = Base Currency Strength (Bullish Cross) • Red = Quote Currency Strength
          </span>
        </div>

        <table
          style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.78rem', textAlign: 'center' }}
        >
          <thead>
            <tr style={{ background: isLightMode ? '#f1f5f9' : 'var(--surface-2)' }}>
              <th
                className="matrix-th-base"
                style={{
                  padding: '10px 14px',
                  textAlign: 'left',
                  fontWeight: 800,
                  fontSize: '0.76rem',
                }}
              >
                BASE \ QUOTE
              </th>
              {currencies.map((curr) => (
                <th
                  key={curr}
                  className="mono matrix-th-quote"
                  style={{
                    padding: '10px 10px',
                    fontWeight: 800,
                    fontSize: '0.82rem',
                  }}
                >
                  {curr}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {matrix.map((row) => (
              <tr key={row.currency} style={{ borderBottom: isLightMode ? '1px solid #e2e8f0' : '1px solid var(--border-subtle)' }}>
                <td
                  style={{
                    padding: '10px 14px',
                    textAlign: 'left',
                    fontWeight: 800,
                    fontSize: '0.84rem',
                  }}
                  className="mono matrix-row-header"
                >
                  {row.currency}
                </td>
                {currencies.map((col) => {
                  if (row.currency === col) {
                    return (
                      <td
                        key={col}
                        className="matrix-cell-diagonal"
                        style={{
                          padding: '10px 10px',
                          fontWeight: 700,
                        }}
                      >
                        —
                      </td>
                    );
                  }
                  const score = row.relative_scores[col] || 0.0;
                  const isPositive = score > 0;
                  const { bg, textColor, borderColor } = getMatrixCellStyles(score, isLightMode);
                  const ArrowIcon = isPositive ? ArrowUpRight : ArrowDownRight;

                  return (
                    <td
                      key={col}
                      className={`mono ${isPositive ? 'matrix-cell-positive' : 'matrix-cell-negative'}`}
                      style={{
                        padding: '10px 10px',
                        background: bg,
                        color: textColor,
                        fontWeight: 800,
                        fontSize: '0.82rem',
                        border: `1px solid ${borderColor}`,
                        cursor: 'pointer',
                        transition: 'transform 0.1s ease',
                      }}
                      onMouseEnter={(e) => handleMouseEnterCell(e, row, col, score)}
                      onMouseLeave={() => setHoveredCell(null)}
                      onClick={() => {
                        if (onOpenMacroBattle) onOpenMacroBattle(row.currency, col);
                        else if (onSelectPairAsset) onSelectPairAsset(`${row.currency}${col}`);
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 3 }}>
                        <span className={isPositive ? 'matrix-cell-positive' : 'matrix-cell-negative'}>
                          {score > 0 ? `+${score.toFixed(0)}` : score.toFixed(0)}
                        </span>
                        <ArrowIcon size={12} color="currentColor" strokeWidth={2.5} />
                      </div>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Interactive Cell Hovercard Popover */}
      {hoveredCell && (
        <div
          style={{
            position: 'fixed',
            left: Math.min(window.innerWidth - 280, hoveredCell.x),
            top: Math.max(80, hoveredCell.y - 40),
            background: isLightMode ? '#ffffff' : 'var(--surface-elevated)',
            border: isLightMode ? '1px solid #cbd5e1' : '1px solid var(--border-active)',
            borderRadius: 'var(--radius-md)',
            padding: '14px',
            boxShadow: isLightMode ? '0 12px 30px -4px rgba(0, 0, 0, 0.15)' : 'var(--shadow-lg)',
            zIndex: 90,
            pointerEvents: 'none',
            minWidth: 240,
            backdropFilter: 'blur(10px)',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
            <span className="mono" style={{ fontSize: '0.95rem', fontWeight: 800, color: 'var(--text-primary)' }}>
              {hoveredCell.pair}
            </span>
            <span
              style={{
                fontSize: '0.65rem',
                fontWeight: 800,
                padding: '2px 6px',
                borderRadius: 4,
                background:
                  hoveredCell.score >= 0
                    ? (isLightMode ? 'rgba(16, 185, 129, 0.18)' : 'rgba(16, 185, 129, 0.2)')
                    : (isLightMode ? 'rgba(239, 68, 68, 0.18)' : 'rgba(239, 68, 68, 0.2)'),
                color:
                  hoveredCell.score >= 0
                    ? (isLightMode ? '#065f46' : '#34d399')
                    : (isLightMode ? '#991b1b' : '#f87171'),
              }}
            >
              {hoveredCell.bias}
            </span>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginTop: 4 }}>
            <span style={{ fontSize: '0.72rem', color: isLightMode ? '#475569' : 'var(--text-secondary)' }}>Relative Score:</span>
            <span
              className="mono"
              style={{
                fontSize: '1.1rem',
                fontWeight: 800,
                color:
                  hoveredCell.score >= 0
                    ? (isLightMode ? '#059669' : '#10b981')
                    : (isLightMode ? '#dc2626' : '#ef4444'),
              }}
            >
              {hoveredCell.score > 0 ? `+${hoveredCell.score.toFixed(1)}` : hoveredCell.score.toFixed(1)}
            </span>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 2 }}>
            <span style={{ fontSize: '0.72rem', color: isLightMode ? '#475569' : 'var(--text-secondary)' }}>Model Confidence:</span>
            <span className="mono" style={{ fontSize: '0.75rem', fontWeight: 700, color: isLightMode ? '#0284c7' : '#38bdf8' }}>
              {hoveredCell.confidence}%
            </span>
          </div>

          <div
            style={{
              marginTop: 8,
              paddingTop: 6,
              borderTop: isLightMode ? '1px solid #e2e8f0' : '1px solid var(--border-subtle)',
              fontSize: '0.68rem',
              color: isLightMode ? '#334155' : 'var(--text-secondary)',
              lineHeight: 1.35,
            }}
          >
            {hoveredCell.driver}
          </div>

          <div
            style={{
              marginTop: 6,
              fontSize: '0.62rem',
              color: isLightMode ? '#0369a1' : 'var(--accent-cyan)',
              textAlign: 'center',
              fontWeight: 600,
            }}
          >
            Click cell to launch Macro Battle clash
          </div>
        </div>
      )}
    </div>
  );
};
