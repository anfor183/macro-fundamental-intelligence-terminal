import React, { useState, useEffect, useRef } from 'react';
import {
  Search,
  Command,
  TrendingUp,
  LayoutDashboard,
  Grid3X3,
  Sparkles,
  Droplet,
  Calendar,
  Newspaper,
  History,
  Activity,
  ShieldCheck,
  Moon,
  Sun,
  Layers,
  Download,
  PlayCircle,
  X,
  ChevronRight,
} from 'lucide-react';
import { ViewTab } from './Sidebar';

import { AssetItem } from '../types/macro';

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectAsset: (symbol: string) => void;
  onNavigateTab: (tab: ViewTab) => void;
  onOpenSimulation: () => void;
  assets?: AssetItem[];
  theme?: 'dark' | 'light';
  onToggleTheme?: () => void;
  density?: 'compact' | 'standard' | 'comfortable';
  onChangeDensity?: (density: 'compact' | 'standard' | 'comfortable') => void;
}

interface CommandItem {
  id: string;
  label: string;
  category: 'Assets' | 'Navigation' | 'Actions' | 'Simulation';
  icon: React.ReactNode;
  hint?: string;
  action: () => void;
}

export const CommandPalette: React.FC<CommandPaletteProps> = ({
  isOpen,
  onClose,
  onSelectAsset,
  onNavigateTab,
  onOpenSimulation,
  assets = [],
  theme = 'dark',
  onToggleTheme,
  density = 'standard',
  onChangeDensity,
}) => {
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setQuery('');
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  const items: CommandItem[] = [
    // Top Assets
    {
      id: 'asset-eurusd',
      label: 'Open EURUSD Macro Deep-Dive',
      category: 'Assets',
      icon: <TrendingUp size={16} color="var(--color-bullish)" />,
      hint: 'Forex Major • +42.0 Bullish',
      action: () => { onSelectAsset('EURUSD'); onClose(); },
    },
    {
      id: 'asset-xauusd',
      label: 'Open Gold (XAUUSD) Terminal',
      category: 'Assets',
      icon: <Sparkles size={16} color="var(--accent-gold)" />,
      hint: 'Precious Metals • +64.0 Strong Bullish',
      action: () => { onSelectAsset('XAUUSD'); onClose(); },
    },
    {
      id: 'asset-cl',
      label: 'Open WTI Crude Oil (CL) Terminal',
      category: 'Assets',
      icon: <Droplet size={16} color="var(--color-bearish)" />,
      hint: 'Commodities • -24.0 Mild Bearish',
      action: () => { onSelectAsset('CL'); onClose(); },
    },
    {
      id: 'asset-spx',
      label: 'Open S&P 500 (SPX) Index Terminal',
      category: 'Assets',
      icon: <TrendingUp size={16} color="var(--accent-cyan)" />,
      hint: 'Equity Indices • +46.0 Bullish',
      action: () => { onSelectAsset('SPX'); onClose(); },
    },
    {
      id: 'asset-usdjpy',
      label: 'Open USDJPY Macro Breakdown',
      category: 'Assets',
      icon: <TrendingUp size={16} color="var(--text-muted)" />,
      hint: 'Forex Major • -37.0 Mild Bearish',
      action: () => { onSelectAsset('USDJPY'); onClose(); },
    },

    // Navigation
    {
      id: 'nav-dashboard',
      label: 'Go to Overview Dashboard',
      category: 'Navigation',
      icon: <LayoutDashboard size={16} color="var(--accent-cyan)" />,
      action: () => { onNavigateTab('dashboard'); onClose(); },
    },
    {
      id: 'nav-matrix',
      label: 'View Currency Relative-Value Matrix',
      category: 'Navigation',
      icon: <Grid3X3 size={16} color="var(--accent-cyan)" />,
      hint: '11x11 Cross Matrix',
      action: () => { onNavigateTab('matrix'); onClose(); },
    },
    {
      id: 'nav-forex',
      label: 'View Forex Pairs Conviction Rankings',
      category: 'Navigation',
      icon: <TrendingUp size={16} color="var(--accent-cyan)" />,
      hint: '28 Pairs Ranked',
      action: () => { onNavigateTab('forex'); onClose(); },
    },
    {
      id: 'nav-calendar',
      label: 'Open High-Impact Macro Calendar',
      category: 'Navigation',
      icon: <Calendar size={16} color="var(--accent-gold)" />,
      action: () => { onNavigateTab('calendar'); onClose(); },
    },
    {
      id: 'nav-news',
      label: 'Open Intelligence & News Feed',
      category: 'Navigation',
      icon: <Newspaper size={16} color="var(--accent-cyan)" />,
      action: () => { onNavigateTab('news'); onClose(); },
    },
    {
      id: 'nav-what-changed',
      label: "Show What Changed Today (Delta Audit)",
      category: 'Navigation',
      icon: <History size={16} color="var(--accent-cyan)" />,
      action: () => { onNavigateTab('what_changed'); onClose(); },
    },
    {
      id: 'nav-backtest',
      label: 'Open Historical Backtesting Engine',
      category: 'Navigation',
      icon: <Activity size={16} color="var(--accent-cyan)" />,
      action: () => { onNavigateTab('backtest'); onClose(); },
    },
    {
      id: 'nav-health',
      label: 'Inspect System Health & Feeds',
      category: 'Navigation',
      icon: <ShieldCheck size={16} color="#10b981" />,
      action: () => { onNavigateTab('health'); onClose(); },
    },

    // Actions
    {
      id: 'act-theme',
      label: `Switch Theme to ${theme === 'dark' ? 'Light Institutional' : 'Dark Terminal'} Mode`,
      category: 'Actions',
      icon: theme === 'dark' ? <Sun size={16} color="#fbbf24" /> : <Moon size={16} color="#3b82f6" />,
      action: () => {
        if (onToggleTheme) onToggleTheme();
        else {
          const next = theme === 'dark' ? 'light' : 'dark';
          document.documentElement.setAttribute('data-theme', next);
        }
        onClose();
      },
    },
    {
      id: 'act-density',
      label: `Cycle Density Mode (Current: ${density.toUpperCase()})`,
      category: 'Actions',
      icon: <Layers size={16} color="var(--text-secondary)" />,
      action: () => {
        const next = density === 'standard' ? 'compact' : density === 'compact' ? 'comfortable' : 'standard';
        if (onChangeDensity) onChangeDensity(next);
        else document.documentElement.setAttribute('data-density', next);
        onClose();
      },
    },
    {
      id: 'act-pdf',
      label: 'Download Institutional PDF Macro Report',
      category: 'Actions',
      icon: <Download size={16} color="var(--text-primary)" />,
      action: () => { window.open('/api/v1/export/pdf', '_blank'); onClose(); },
    },

    // Simulation
    {
      id: 'sim-open',
      label: 'Launch Macro Scenario Simulator [DEMO]',
      category: 'Simulation',
      icon: <PlayCircle size={16} color="#fbbf24" />,
      hint: 'Inject CPI, NFP, BoJ Shocks',
      action: () => { onOpenSimulation(); onClose(); },
    },
  ];

  const filtered = query.trim()
    ? items.filter((it) =>
        it.label.toLowerCase().includes(query.toLowerCase()) ||
        it.category.toLowerCase().includes(query.toLowerCase()) ||
        (it.hint && it.hint.toLowerCase().includes(query.toLowerCase()))
      )
    : items;

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev + 1) % Math.max(1, filtered.length));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev - 1 + filtered.length) % Math.max(1, filtered.length));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (filtered[selectedIndex]) {
        filtered[selectedIndex].action();
      }
    } else if (e.key === 'Escape') {
      e.preventDefault();
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(15, 23, 42, 0.65)',
        backdropFilter: 'blur(10px)',
        display: 'flex',
        alignItems: 'flex-start',
        justifyContent: 'center',
        paddingTop: '12vh',
        zIndex: 200,
      }}
      onClick={onClose}
    >
      <div
        style={{
          width: '100%',
          maxWidth: 620,
          background: 'var(--surface-elevated)',
          border: '1px solid var(--border-active)',
          borderRadius: 12,
          boxShadow: 'var(--shadow-lg)',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          animation: 'fadeIn 0.15s ease',
        }}
        onClick={(e) => e.stopPropagation()}
        onKeyDown={handleKeyDown}
      >
        {/* Input Bar */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: 12,
          padding: '14px 18px',
          borderBottom: '1px solid var(--border-subtle)',
          background: 'var(--surface-2)',
        }}>
          <Search size={18} color="var(--text-muted)" />
          <input
            ref={inputRef}
            type="text"
            placeholder="Type a command, currency, asset, or release... (e.g. 'EURUSD', 'Gold', 'Theme')"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setSelectedIndex(0);
            }}
            style={{
              background: 'transparent',
              border: 'none',
              outline: 'none',
              fontSize: '0.92rem',
              color: 'var(--text-primary)',
              width: '100%',
              fontFamily: 'var(--font-sans)',
            }}
          />
          <div style={{
            fontSize: '0.65rem',
            fontFamily: 'var(--font-mono)',
            background: 'var(--surface-3)',
            color: 'var(--text-muted)',
            padding: '3px 6px',
            borderRadius: 4,
            fontWeight: 700,
          }}>
            ESC
          </div>
        </div>

        {/* Results List */}
        <div style={{ maxHeight: 360, overflowY: 'auto', padding: '8px', background: 'var(--surface-elevated)' }}>
          {filtered.length === 0 ? (
            <div style={{ padding: '32px 16px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.84rem' }}>
              No terminal commands matching <strong style={{ color: 'var(--text-primary)' }}>"{query}"</strong>
            </div>
          ) : (
            filtered.map((item, idx) => {
              const isSelected = idx === selectedIndex;
              return (
                <div
                  key={item.id}
                  onClick={item.action}
                  onMouseEnter={() => setSelectedIndex(idx)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '10px 14px',
                    borderRadius: 6,
                    cursor: 'pointer',
                    background: isSelected ? 'var(--bg-hover)' : 'transparent',
                    borderLeft: isSelected ? '3px solid var(--accent-cyan)' : '3px solid transparent',
                    transition: 'all 0.1s ease',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div style={{
                      width: 28,
                      height: 28,
                      borderRadius: 6,
                      background: 'var(--surface-3)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}>
                      {item.icon}
                    </div>
                    <div>
                      <div style={{
                        fontSize: '0.84rem',
                        fontWeight: isSelected ? 800 : 600,
                        color: isSelected ? 'var(--text-primary)' : 'var(--text-primary)',
                      }}>
                        {item.label}
                      </div>
                      {item.hint && (
                        <div style={{ fontSize: '0.72rem', color: isSelected ? 'var(--text-secondary)' : 'var(--text-muted)', marginTop: 2 }}>
                          {item.hint}
                        </div>
                      )}
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{
                      fontSize: '0.65rem',
                      fontFamily: 'var(--font-mono)',
                      color: 'var(--text-secondary)',
                      textTransform: 'uppercase',
                      padding: '2px 6px',
                      borderRadius: 4,
                      background: 'var(--surface-3)',
                      fontWeight: 700,
                    }}>
                      {item.category}
                    </span>
                    <ChevronRight size={14} color={isSelected ? 'var(--accent-cyan)' : 'var(--text-muted)'} />
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div style={{
          padding: '8px 16px',
          borderTop: '1px solid var(--border-subtle)',
          background: 'var(--surface-2)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          fontSize: '0.68rem',
          color: 'var(--text-secondary)',
          fontFamily: 'var(--font-mono)',
        }}>
          <div style={{ display: 'flex', gap: 14 }}>
            <span>↑↓ Navigate</span>
            <span>↵ Select</span>
            <span>ESC Close</span>
          </div>
          <div style={{ fontWeight: 700, letterSpacing: '0.04em' }}>FORTUNE ANUKPOSI COMMAND PALETTE</div>
        </div>
      </div>
    </div>
  );
};
