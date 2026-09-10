import React, { useEffect, useState } from 'react';
import { Sparkles, Droplet, TrendingUp, TrendingDown, Shield, RefreshCw } from 'lucide-react';
import { GoldDashboard, OilDashboard } from '../types/macro';
import { api } from '../services/api';
import { getBiasBadgeClass } from './AssetTable';

export const GoldTerminalView: React.FC = () => {
  const [data, setData] = useState<GoldDashboard | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.getGoldDashboard()
      .then(setData)
      .finally(() => setLoading(false));
  }, []);

  if (loading || !data) {
    return <div style={{ padding: 40, textAlign: 'center', color: 'var(--text-secondary)' }}>Loading Gold Specialized Terminal...</div>;
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <h2 style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--text-primary)' }}>
              Precious Metals Macro Terminal — XAU/USD
            </h2>
            <span className={getBiasBadgeClass(data.bias)}>
              {data.bias}
            </span>
          </div>
          <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
            Real yields, USD valuation, central bank reserve flows, and safe-haven transmission
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 10 }}>
          <span className="mono" style={{ fontSize: '1.8rem', fontWeight: 800, color: data.score >= 0 ? '#10b981' : '#ef4444' }}>
            {data.score > 0 ? `+${data.score.toFixed(1)}` : data.score.toFixed(1)}
          </span>
          <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Confidence: {data.confidence.toFixed(0)}%</span>
        </div>
      </div>

      {/* Driver Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 14 }}>
        <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-subtle)', borderRadius: 8, padding: 16 }}>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>US 10Y Real Yield Impulse</div>
          <div className="mono" style={{ fontSize: '1.3rem', fontWeight: 800, color: data.drivers.real_yield_pressure >= 0 ? '#10b981' : '#ef4444', marginTop: 4 }}>
            {data.drivers.real_yield_pressure > 0 ? `+${data.drivers.real_yield_pressure}` : data.drivers.real_yield_pressure}
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: 4 }}>TIPS inverse discount transmission</div>
        </div>

        <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-subtle)', borderRadius: 8, padding: 16 }}>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>USD Denominator Pressure</div>
          <div className="mono" style={{ fontSize: '1.3rem', fontWeight: 800, color: data.drivers.usd_pressure >= 0 ? '#10b981' : '#ef4444', marginTop: 4 }}>
            {data.drivers.usd_pressure > 0 ? `+${data.drivers.usd_pressure}` : data.drivers.usd_pressure}
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: 4 }}>DXY inverse valuation effect</div>
        </div>

        <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-subtle)', borderRadius: 8, padding: 16 }}>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Fed Rate Easing Path</div>
          <div className="mono" style={{ fontSize: '1.3rem', fontWeight: 800, color: '#38bdf8', marginTop: 4 }}>
            +{data.drivers.fed_expectations}
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: 4 }}>Opportunity cost repricing</div>
        </div>

        <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-subtle)', borderRadius: 8, padding: 16 }}>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Central Bank Buying Pace</div>
          <div className="mono" style={{ fontSize: '1.3rem', fontWeight: 800, color: '#f59e0b', marginTop: 4 }}>
            +{data.drivers.central_bank_demand}
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: 4 }}>Sovereign reserve accumulation</div>
        </div>
      </div>

      {/* Narrative */}
      <div style={{
        background: 'var(--bg-card)',
        border: '1px solid var(--border-subtle)',
        borderLeft: '4px solid var(--accent-gold)',
        borderRadius: 8,
        padding: '18px 20px',
      }}>
        <h4 style={{ fontSize: '0.84rem', fontWeight: 700, color: '#fbbf24', marginBottom: 6 }}>
          Why Gold is {data.bias} Today
        </h4>
        <p style={{ fontSize: '0.82rem', color: '#cbd5e1', lineHeight: 1.6 }}>
          {data.narrative} Primary driver: {data.drivers.primary_driver}.
        </p>
      </div>
    </div>
  );
};

export const OilTerminalView: React.FC = () => {
  const [data, setData] = useState<OilDashboard | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.getOilDashboard()
      .then(setData)
      .finally(() => setLoading(false));
  }, []);

  if (loading || !data) {
    return <div style={{ padding: 40, textAlign: 'center', color: 'var(--text-secondary)' }}>Loading Oil Specialized Terminal...</div>;
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <h2 style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--text-primary)' }}>
              Energy Commodities Terminal — WTI / Brent Crude
            </h2>
            <span className={getBiasBadgeClass(data.bias)}>
              {data.bias}
            </span>
          </div>
          <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
            Physical OPEC+ quotas, inventory cycles, China manufacturing demand, and maritime transit risk
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 10 }}>
          <span className="mono" style={{ fontSize: '1.8rem', fontWeight: 800, color: data.score >= 0 ? '#10b981' : '#ef4444' }}>
            {data.score > 0 ? `+${data.score.toFixed(1)}` : data.score.toFixed(1)}
          </span>
          <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Confidence: {data.confidence.toFixed(0)}%</span>
        </div>
      </div>

      {/* Driver Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 14 }}>
        <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-subtle)', borderRadius: 8, padding: 16 }}>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>OPEC+ Quota Compliance</div>
          <div className="mono" style={{ fontSize: '1.3rem', fontWeight: 800, color: '#38bdf8', marginTop: 4 }}>
            +{data.drivers.opec_discipline}
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: 4 }}>Voluntary output discipline</div>
        </div>

        <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-subtle)', borderRadius: 8, padding: 16 }}>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>China Industrial Demand Drag</div>
          <div className="mono" style={{ fontSize: '1.3rem', fontWeight: 800, color: '#ef4444', marginTop: 4 }}>
            {data.drivers.china_demand_drag}
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: 4 }}>Refinery run rates & diesel demand</div>
        </div>

        <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-subtle)', borderRadius: 8, padding: 16 }}>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>US EIA Inventory Support</div>
          <div className="mono" style={{ fontSize: '1.3rem', fontWeight: 800, color: '#10b981', marginTop: 4 }}>
            +{data.drivers.inventory_draw_support}
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: 4 }}>Drawdowns in commercial stocks</div>
        </div>

        <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-subtle)', borderRadius: 8, padding: 16 }}>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Geopolitical Chokepoint Risk</div>
          <div className="mono" style={{ fontSize: '1.3rem', fontWeight: 800, color: '#f59e0b', marginTop: 4 }}>
            +{data.drivers.geopolitical_risk}
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: 4 }}>Tanker transit risk premia</div>
        </div>
      </div>

      {/* Narrative */}
      <div style={{
        background: 'var(--bg-card)',
        border: '1px solid var(--border-subtle)',
        borderLeft: '4px solid #ef4444',
        borderRadius: 8,
        padding: '18px 20px',
      }}>
        <h4 style={{ fontSize: '0.84rem', fontWeight: 700, color: '#f87171', marginBottom: 6 }}>
          Why Crude Oil is {data.bias} Today
        </h4>
        <p style={{ fontSize: '0.82rem', color: '#cbd5e1', lineHeight: 1.6 }}>
          {data.narrative} Primary driver: {data.drivers.primary_driver}.
        </p>
      </div>
    </div>
  );
};
