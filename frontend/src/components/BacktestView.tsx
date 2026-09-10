import React, { useEffect, useState } from 'react';
import { Activity, BarChart2, CheckCircle2, TrendingUp, AlertCircle, RefreshCw } from 'lucide-react';
import { api } from '../services/api';

export const BacktestView: React.FC = () => {
  const [symbol, setSymbol] = useState('EURUSD');
  const [holdingDays, setHoldingDays] = useState(5);
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const runBacktest = () => {
    setLoading(true);
    api.getBacktest(symbol, holdingDays)
      .then((res) => {
        setData(res);
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setLoading(false);
      });
  };

  useEffect(() => {
    runBacktest();
  }, [symbol, holdingDays]);

  const metrics = data?.metrics;
  const calibrations = data?.calibrations || [];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h2 style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--text-primary)' }}>
            Historical Macro Model Backtest & Calibration Framework
          </h2>
          <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
            Evaluation of bias persistence, directional hit rates, and statistical factor weight optimization
          </div>
        </div>

        {/* Controls */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <select
            value={symbol}
            onChange={(e) => setSymbol(e.target.value)}
            style={{
              background: 'var(--bg-card)',
              border: '1px solid var(--border-subtle)',
              color: 'var(--text-primary)',
              padding: '6px 12px',
              borderRadius: 6,
              fontSize: '0.75rem',
              fontWeight: 700,
            }}
          >
            <option value="EURUSD">EURUSD</option>
            <option value="USDJPY">USDJPY</option>
            <option value="GBPUSD">GBPUSD</option>
            <option value="XAUUSD">Gold (XAUUSD)</option>
            <option value="CL">WTI Crude (CL)</option>
            <option value="SPX">S&P 500 (SPX)</option>
          </select>

          <select
            value={holdingDays}
            onChange={(e) => setHoldingDays(Number(e.target.value))}
            style={{
              background: 'var(--bg-card)',
              border: '1px solid var(--border-subtle)',
              color: 'var(--text-primary)',
              padding: '6px 12px',
              borderRadius: 6,
              fontSize: '0.75rem',
              fontWeight: 600,
            }}
          >
            <option value={3}>3-Day Horizon</option>
            <option value={5}>5-Day Horizon</option>
            <option value={10}>10-Day Horizon</option>
            <option value={20}>20-Day Horizon</option>
          </select>

          <button
            onClick={runBacktest}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              background: 'linear-gradient(135deg, #06b6d4 0%, #3b82f6 100%)',
              border: 'none',
              color: '#fff',
              padding: '6px 14px',
              borderRadius: 6,
              fontSize: '0.75rem',
              fontWeight: 700,
              cursor: 'pointer',
            }}
          >
            <RefreshCw size={13} className={loading ? 'animate-spin' : ''} />
            Recalculate
          </button>
        </div>
      </div>

      {metrics && (
        <>
          {/* Stat Cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 12 }}>
            <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-subtle)', borderRadius: 8, padding: 16 }}>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Directional Hit Rate</div>
              <div className="mono" style={{ fontSize: '1.6rem', fontWeight: 800, color: '#10b981', marginTop: 4 }}>
                {metrics.directional_accuracy_pct}%
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: 4 }}>
                {metrics.total_signals} evaluated signals
              </div>
            </div>

            <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-subtle)', borderRadius: 8, padding: 16 }}>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Win / Loss Ratio</div>
              <div className="mono" style={{ fontSize: '1.6rem', fontWeight: 800, color: '#38bdf8', marginTop: 4 }}>
                {metrics.win_loss_ratio}x
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: 4 }}>
                Avg +{metrics.avg_gain_pct}% / {metrics.avg_loss_pct}%
              </div>
            </div>

            <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-subtle)', borderRadius: 8, padding: 16 }}>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Max Hypothetical Drawdown</div>
              <div className="mono" style={{ fontSize: '1.6rem', fontWeight: 800, color: '#f59e0b', marginTop: 4 }}>
                -{metrics.max_drawdown_pct}%
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: 4 }}>
                Signal series peak-to-trough
              </div>
            </div>

            <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-subtle)', borderRadius: 8, padding: 16 }}>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Bias Persistence Half-Life</div>
              <div className="mono" style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--text-primary)', marginTop: 4 }}>
                {metrics.bias_persistence_half_life_days} days
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: 4 }}>
                Decay rate of signal edge
              </div>
            </div>
          </div>

          {/* Regime Breakdown */}
          <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-subtle)', borderRadius: 8, padding: 18 }}>
            <h3 style={{ fontSize: '0.88rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: 12 }}>
              Directional Hit Rate by Macro Regime
            </h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 12 }}>
              {Object.entries(metrics.regime_breakdown).map(([regime, rate]) => (
                <div key={regime} style={{ background: 'var(--bg-main)', border: '1px solid var(--border-subtle)', borderRadius: 6, padding: '10px 14px' }}>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{regime.replace(/_/g, ' ')}</div>
                  <div className="mono" style={{ fontSize: '1.1rem', fontWeight: 800, color: '#38bdf8', marginTop: 4 }}>
                    {rate as number}%
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Factor Calibration Table */}
          <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-subtle)', borderRadius: 8, padding: 18 }}>
            <h3 style={{ fontSize: '0.88rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: 12 }}>
              Statistical Factor Weight Calibration Suggestions
            </h3>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.78rem', textAlign: 'left' }}>
              <thead>
                <tr style={{ background: 'var(--surface-2)', borderBottom: '1px solid var(--border-subtle)', color: 'var(--text-muted)' }}>
                  <th style={{ padding: '8px 12px' }}>Factor Dimension</th>
                  <th style={{ padding: '8px 12px' }}>Current Weight</th>
                  <th style={{ padding: '8px 12px' }}>Suggested Weight</th>
                  <th style={{ padding: '8px 12px' }}>t-Statistic</th>
                  <th style={{ padding: '8px 12px' }}>p-Value</th>
                </tr>
              </thead>
              <tbody>
                {calibrations.map((c: any) => (
                  <tr key={c.category} style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                    <td style={{ padding: '10px 12px', fontWeight: 600, color: 'var(--text-primary)' }}>{c.category}</td>
                    <td className="mono" style={{ padding: '10px 12px', color: 'var(--text-secondary)' }}>{(c.current_weight * 100).toFixed(0)}%</td>
                    <td className="mono" style={{ padding: '10px 12px', color: '#10b981', fontWeight: 700 }}>{(c.suggested_weight * 100).toFixed(0)}%</td>
                    <td className="mono" style={{ padding: '10px 12px', color: '#38bdf8' }}>{c.t_stat.toFixed(2)}</td>
                    <td className="mono" style={{ padding: '10px 12px', color: 'var(--text-muted)' }}>{c.p_value.toFixed(4)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)', textAlign: 'center' }}>
            {metrics.disclaimer}
          </div>
        </>
      )}
    </div>
  );
};
