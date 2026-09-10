import React, { useState } from 'react';
import {
  Star,
  Pin,
  TrendingUp,
  TrendingDown,
  Layers,
  ShieldAlert,
  Sparkles,
  ArrowUpRight,
  ArrowDownRight,
} from 'lucide-react';
import { AssetItem, BiasCategory } from '../types/macro';

interface WatchlistPortfolioProps {
  assets: AssetItem[];
  onSelectAsset: (symbol: string) => void;
}

export const WatchlistPortfolio: React.FC<WatchlistPortfolioProps> = ({
  assets,
  onSelectAsset,
}) => {
  const [pinnedSymbols, setPinnedSymbols] = useState<string[]>([
    'EURUSD',
    'USDJPY',
    'XAUUSD',
    'USOIL',
    'SPX',
  ]);
  const [activeGroup, setActiveGroup] = useState<string>('watchlist');

  const togglePin = (sym: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (pinnedSymbols.includes(sym)) {
      setPinnedSymbols(pinnedSymbols.filter((s) => s !== sym));
    } else {
      setPinnedSymbols([...pinnedSymbols, sym]);
    }
  };

  // Thematic Groups mapping
  const thematicGroups: Record<string, { label: string; symbols: string[]; description: string }> = {
    watchlist: {
      label: 'My Macro Watchlist',
      symbols: pinnedSymbols,
      description: 'Pinned high-priority assets under active macro surveillance',
    },
    usd_exposure: {
      label: 'USD Exposure Cluster',
      symbols: ['EURUSD', 'GBPUSD', 'USDJPY', 'USDCHF', 'USDCAD', 'AUDUSD'],
      description: 'Sensitivity to Federal Reserve terminal rate and US Treasury curve dynamics',
    },
    safe_havens: {
      label: 'Safe Haven Sovereigns & Metals',
      symbols: ['XAUUSD', 'USDCHF', 'USDJPY', 'GER40'],
      description: 'Negative correlation to risk shocks and geopolitical escalations',
    },
    commodity_currencies: {
      label: 'Commodity Currencies & Energy',
      symbols: ['AUDUSD', 'NZDUSD', 'USDCAD', 'USOIL', 'BRENT'],
      description: 'Terms of trade proxies levered to Chinese industrial demand & energy tightness',
    },
    risk_on: {
      label: 'High-Beta & Pro-Cyclical',
      symbols: ['SPX', 'NAS100', 'EURUSD', 'AUDUSD', 'COPPER'],
      description: 'Pro-cyclical assets benefiting from global liquidity expansion & disinflation',
    },
  };

  const currentTheme = thematicGroups[activeGroup] || thematicGroups.watchlist;
  const displayAssets = assets.filter((a) => currentTheme.symbols.includes(a.symbol));

  // Render tiny SVG sparkline
  const renderMiniSparkline = (score: number, isBullish: boolean) => {
    const points = isBullish
      ? '0,14 10,12 20,13 30,8 40,9 50,4 60,2'
      : '0,2 10,6 20,5 30,10 40,8 50,12 60,14';
    const color = isBullish ? '#10b981' : '#ef4444';

    return (
      <svg width="60" height="16" viewBox="0 0 60 16" style={{ overflow: 'visible' }}>
        <polyline
          fill="none"
          stroke={color}
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
          points={points}
        />
      </svg>
    );
  };

  return (
    <div
      style={{
        background: 'var(--surface-1)',
        border: '1px solid var(--border-subtle)',
        borderRadius: 'var(--radius-lg)',
        padding: '20px',
        display: 'flex',
        flexDirection: 'column',
        gap: 16,
      }}
    >
      {/* Header & Thematic Tabs */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: 12,
        }}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Star size={18} color="var(--accent-cyan)" fill="var(--accent-cyan)" />
            <h3 style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--text-primary)' }}>
              {currentTheme.label}
            </h3>
          </div>
          <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: 2 }}>
            {currentTheme.description}
          </p>
        </div>

        {/* Thematic Filter Tabs */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            background: 'var(--surface-2)',
            borderRadius: 'var(--radius-sm)',
            padding: '3px',
            border: '1px solid var(--border-subtle)',
            flexWrap: 'wrap',
            gap: 2,
          }}
        >
          {Object.entries(thematicGroups).map(([key, grp]) => (
            <button
              key={key}
              onClick={() => setActiveGroup(key)}
              style={{
                padding: '4px 10px',
                fontSize: '0.75rem',
                fontWeight: 600,
                borderRadius: 4,
                border: 'none',
                background: activeGroup === key ? 'var(--surface-3)' : 'transparent',
                color: activeGroup === key ? 'var(--text-primary)' : 'var(--text-dim)',
                cursor: 'pointer',
                transition: 'all 0.15s ease',
              }}
            >
              {grp.label.split(' ')[0]}
            </button>
          ))}
        </div>
      </div>

      {/* Assets Grid */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
          gap: 12,
        }}
      >
        {displayAssets.length === 0 ? (
          <div
            style={{
              padding: '30px',
              textAlign: 'center',
              color: 'var(--text-muted)',
              fontSize: '0.8rem',
              gridColumn: '1 / -1',
            }}
          >
            No assets pinned in this watchlist yet. Click the pin icon on any asset row or card to add it here.
          </div>
        ) : (
          displayAssets.map((asset) => {
            const isBullish = asset.score >= 0;
            const isPinned = pinnedSymbols.includes(asset.symbol);

            return (
              <div
                key={asset.symbol}
                onClick={() => onSelectAsset(asset.symbol)}
                style={{
                  background: 'var(--surface-2)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: 'var(--radius-md)',
                  padding: '14px 16px',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = 'var(--border-active)';
                  e.currentTarget.style.background = 'var(--surface-3)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = 'var(--border-subtle)';
                  e.currentTarget.style.background = 'var(--surface-2)';
                }}
              >
                {/* Left: Symbol & Name */}
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span
                      className="mono"
                      style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--text-primary)' }}
                    >
                      {asset.symbol}
                    </span>
                    <button
                      onClick={(e) => togglePin(asset.symbol, e)}
                      style={{
                        background: 'none',
                        border: 'none',
                        padding: 0,
                        cursor: 'pointer',
                        color: isPinned ? 'var(--accent-cyan)' : 'var(--text-dim)',
                      }}
                      title={isPinned ? 'Unpin' : 'Pin to Watchlist'}
                    >
                      <Pin size={13} fill={isPinned ? 'var(--accent-cyan)' : 'none'} />
                    </button>
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: 2 }}>
                    {asset.name}
                  </div>
                </div>

                {/* Center: Sparkline */}
                <div style={{ padding: '0 8px' }}>
                  {renderMiniSparkline(asset.score, isBullish)}
                </div>

                {/* Right: Score, Bias & Change */}
                <div style={{ textAlign: 'right' }}>
                  <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'flex-end', gap: 4 }}>
                    <span
                      className="mono"
                      style={{
                        fontSize: '1.1rem',
                        fontWeight: 800,
                        color: isBullish ? '#10b981' : '#ef4444',
                      }}
                    >
                      {asset.score > 0 ? `+${asset.score.toFixed(0)}` : asset.score.toFixed(0)}
                    </span>
                  </div>
                  <span
                    style={{
                      fontSize: '0.75rem',
                      fontWeight: 700,
                      padding: '1px 5px',
                      borderRadius: 3,
                      background: isBullish ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)',
                      color: isBullish ? '#34d399' : '#f87171',
                    }}
                  >
                    {asset.tactical_bias}
                  </span>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
