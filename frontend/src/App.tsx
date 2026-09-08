import React, { useEffect, useState } from 'react';
import { Header } from './components/Header';
import { Sidebar, ViewTab } from './components/Sidebar';
import { DashboardView } from './components/DashboardView';
import { AssetTable } from './components/AssetTable';
import { CurrencyMatrixView } from './components/CurrencyMatrixView';
import { ForexRankingsView } from './components/ForexRankingsView';
import { GoldTerminalView, OilTerminalView } from './components/SpecializedDashboards';
import { CalendarView } from './components/CalendarView';
import { NewsIntelligenceView } from './components/NewsIntelligenceView';
import { WhatChangedView } from './components/WhatChangedView';
import { BacktestView } from './components/BacktestView';
import { SystemHealthView } from './components/SystemHealthView';
import { ValidationDashboard } from './components/ValidationDashboard';
import { DataIntegrityDashboard } from './components/DataIntegrityDashboard';
import { AssetDetailModal } from './components/AssetDetailModal';
import { SimulationModal } from './components/SimulationModal';
import { CommandPalette } from './components/CommandPalette';
import { MacroBattleView } from './components/MacroBattleView';
import { WatchlistPortfolio } from './components/WatchlistPortfolio';
import { EvidenceDrawer } from './components/EvidenceDrawer';
import { AssetItem, MacroRegime, WhatChangedItem, CalendarEvent } from './types/macro';
import { api } from './services/api';

export function App() {
  const [activeTab, setActiveTab] = useState<ViewTab>('dashboard');
  const [regime, setRegime] = useState<MacroRegime | null>(null);
  const [assets, setAssets] = useState<AssetItem[]>([]);
  const [whatChanged, setWhatChanged] = useState<WhatChangedItem[]>([]);
  const [calendar, setCalendar] = useState<CalendarEvent[]>([]);
  const [searchQuery, setSearchQuery] = useState<string>('');

  const [selectedAsset, setSelectedAsset] = useState<string | null>(null);
  const [isSimulationOpen, setIsSimulationOpen] = useState<boolean>(false);
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState<boolean>(false);
  const [isEvidenceDrawerOpen, setIsEvidenceDrawerOpen] = useState<boolean>(false);
  const [battleCurrencies, setBattleCurrencies] = useState<{ base: string; quote: string }>({
    base: 'EUR',
    quote: 'USD',
  });
  const [loading, setLoading] = useState<boolean>(true);

  const [theme, setTheme] = useState<'dark' | 'light'>(() => {
    const saved = localStorage.getItem('terminal-theme');
    return saved === 'light' ? 'light' : 'dark';
  });

  const [density, setDensity] = useState<'compact' | 'standard' | 'comfortable'>(() => {
    const saved = localStorage.getItem('terminal-density');
    return saved === 'compact' || saved === 'comfortable' ? saved : 'standard';
  });

  const loadAllData = async () => {
    try {
      const [regData, astData, wcData, calData] = await Promise.all([
        api.getRegime(),
        api.getAssets(),
        api.getWhatChanged(),
        api.getCalendar(),
      ]);
      setRegime(regData);
      setAssets(astData);
      setWhatChanged(wcData);
      setCalendar(calData);
    } catch (err) {
      console.error('Failed loading macro data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    document.documentElement.setAttribute('data-density', density);
    document.body.setAttribute('data-theme', theme);
    document.body.setAttribute('data-density', density);
    document.body.className = `theme-${theme} density-${density}`;
    localStorage.setItem('terminal-theme', theme);
    localStorage.setItem('terminal-density', density);
  }, [theme, density]);

  useEffect(() => {
    loadAllData();
    // Auto-refresh interval every 60s
    const interval = setInterval(loadAllData, 60000);
    return () => clearInterval(interval);
  }, []);

  // Global keyboard shortcut for Command Palette (Cmd/Ctrl + K)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setIsCommandPaletteOpen((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Filter assets by search query if present
  const searchedAssets = searchQuery.trim()
    ? assets.filter(
        (a) =>
          a.symbol.toLowerCase().includes(searchQuery.toLowerCase()) ||
          a.name.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : assets;

  const handleOpenMacroBattle = (base: string, quote: string) => {
    setBattleCurrencies({ base, quote });
    setActiveTab('battle');
  };

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        minHeight: '100vh',
        background: 'var(--bg-main)',
      }}
    >
      {/* Top Header with terminal controls */}
      <Header
        regime={regime}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        onOpenSimulation={() => setIsSimulationOpen(true)}
        onSelectAsset={(sym) => setSelectedAsset(sym)}
        onOpenCommandPalette={() => setIsCommandPaletteOpen(true)}
        theme={theme}
        onToggleTheme={() => setTheme((t) => (t === 'dark' ? 'light' : 'dark'))}
        density={density}
        onCycleDensity={() =>
          setDensity((d) =>
            d === 'standard' ? 'compact' : d === 'compact' ? 'comfortable' : 'standard'
          )
        }
      />

      {/* Main Terminal Workspace */}
      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
        {/* Left Navigation Sidebar */}
        <Sidebar
          activeTab={activeTab}
          onTabChange={setActiveTab}
          unreadAlertsCount={3}
        />

        {/* Center View Area */}
        <main
          style={{
            flex: 1,
            padding: '20px 28px',
            overflowY: 'auto',
            maxHeight: 'calc(100vh - 58px)',
          }}
        >
          {searchQuery.trim() ? (
            <div>
              <div
                style={{
                  marginBottom: 14,
                  fontSize: '0.85rem',
                  color: 'var(--text-secondary)',
                }}
              >
                Search results for: <strong style={{ color: 'var(--accent-cyan)' }}>"{searchQuery}"</strong> ({searchedAssets.length} matches)
              </div>
              <AssetTable
                assets={searchedAssets}
                onSelectAsset={setSelectedAsset}
                title="Search Filtered Trading Assets"
              />
            </div>
          ) : activeTab === 'dashboard' ? (
            <DashboardView
              regime={regime}
              assets={assets}
              whatChanged={whatChanged}
              calendar={calendar}
              onSelectAsset={setSelectedAsset}
              onNavigateTab={setActiveTab}
              onOpenEvidence={() => setIsEvidenceDrawerOpen(true)}
            />
          ) : activeTab === 'battle' ? (
            <MacroBattleView
              initialBase={battleCurrencies.base}
              initialQuote={battleCurrencies.quote}
              onSelectPairAsset={setSelectedAsset}
            />
          ) : activeTab === 'watchlist' ? (
            <WatchlistPortfolio
              assets={assets}
              onSelectAsset={setSelectedAsset}
            />
          ) : activeTab === 'forex' ? (
            <ForexRankingsView onSelectAsset={setSelectedAsset} />
          ) : activeTab === 'matrix' ? (
            <CurrencyMatrixView
              onSelectPairAsset={setSelectedAsset}
              onOpenMacroBattle={handleOpenMacroBattle}
            />
          ) : activeTab === 'gold' ? (
            <GoldTerminalView />
          ) : activeTab === 'oil' ? (
            <OilTerminalView />
          ) : activeTab === 'indices' ? (
            <AssetTable
              assets={assets.filter((a) => a.asset_class === 'index')}
              onSelectAsset={setSelectedAsset}
              title="Global Equity Indices Macro Landscape"
            />
          ) : activeTab === 'calendar' ? (
            <CalendarView onSelectAsset={setSelectedAsset} />
          ) : activeTab === 'news' ? (
            <NewsIntelligenceView onSelectAsset={setSelectedAsset} />
          ) : activeTab === 'what_changed' ? (
            <WhatChangedView onSelectAsset={setSelectedAsset} />
          ) : activeTab === 'backtest' ? (
            <BacktestView />
          ) : activeTab === 'validation' ? (
            <ValidationDashboard />
          ) : activeTab === 'integrity' ? (
            <DataIntegrityDashboard />
          ) : activeTab === 'health' ? (
            <SystemHealthView />
          ) : null}
        </main>
      </div>

      {/* Global Command Palette (Cmd + K) */}
      <CommandPalette
        isOpen={isCommandPaletteOpen}
        onClose={() => setIsCommandPaletteOpen(false)}
        assets={assets}
        onSelectAsset={(sym) => {
          setSelectedAsset(sym);
          setIsCommandPaletteOpen(false);
        }}
        onNavigateTab={(tab) => {
          setActiveTab(tab as ViewTab);
          setIsCommandPaletteOpen(false);
        }}
        onOpenSimulation={() => {
          setIsSimulationOpen(true);
          setIsCommandPaletteOpen(false);
        }}
        theme={theme}
        onToggleTheme={() => setTheme((t) => (t === 'dark' ? 'light' : 'dark'))}
        density={density}
        onChangeDensity={(newDensity) => setDensity(newDensity)}
      />

      {/* Deep Dive Asset Inspection Modal */}
      {selectedAsset && (
        <AssetDetailModal
          symbol={selectedAsset}
          onClose={() => setSelectedAsset(null)}
        />
      )}

      {/* Global Evidence Provenance Drawer */}
      <EvidenceDrawer
        isOpen={isEvidenceDrawerOpen}
        onClose={() => setIsEvidenceDrawerOpen(false)}
      />

      {/* Macro Scenario Simulator Modal */}
      <SimulationModal
        isOpen={isSimulationOpen}
        onClose={() => setIsSimulationOpen(false)}
        onSimulationSuccess={() => {
          loadAllData();
        }}
      />
    </div>
  );
}

export default App;
