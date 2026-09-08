import {
  AssetItem,
  AssetDetail,
  MacroRegime,
  CurrencyMatrixItem,
  ForexRankingItem,
  GoldDashboard,
  OilDashboard,
  CalendarEvent,
  WhatChangedItem,
  AlertItem,
  SystemHealthData,
  LiveStatus,
  Historical15YReport,
  Historical15YSummaryItem,
  COTPositionSnapshot,
  TraderConfluenceCard,
} from '../types/macro';

const API_BASE = '/api/v1';

async function fetchJson<T>(url: string, options?: RequestInit): Promise<T> {
  const res = await fetch(url, options);
  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`API Error ${res.status}: ${errText}`);
  }
  return res.json();
}

export const api = {
  getRegime: () => fetchJson<MacroRegime>(`${API_BASE}/macro/regime`),

  getAssets: (assetClass?: string, search?: string) => {
    const params = new URLSearchParams();
    if (assetClass) params.set('asset_class', assetClass);
    if (search) params.set('search', search);
    const qs = params.toString();
    return fetchJson<AssetItem[]>(`${API_BASE}/assets${qs ? `?${qs}` : ''}`);
  },

  getAssetDetail: (symbol: string) =>
    fetchJson<AssetDetail>(`${API_BASE}/assets/${encodeURIComponent(symbol)}`),

  getAssetHistory: (symbol: string) =>
    fetchJson<Array<{ timestamp: string; score: number; weekly_score: number; tactical_bias: string; confidence: number }>>(
      `${API_BASE}/assets/${encodeURIComponent(symbol)}/history`
    ),

  getCurrencyMatrix: () => fetchJson<CurrencyMatrixItem[]>(`${API_BASE}/currencies/matrix`),

  getCurrencyRanking: () =>
    fetchJson<Array<{ rank: number; code: string; name: string; score: number; weekly_score: number; policy_direction: string; growth_direction: string }>>(
      `${API_BASE}/currencies/ranking`
    ),

  getForexRankings: () => fetchJson<ForexRankingItem[]>(`${API_BASE}/forex/rankings`),

  getGoldDashboard: () => fetchJson<GoldDashboard>(`${API_BASE}/specialized/gold`),

  getOilDashboard: () => fetchJson<OilDashboard>(`${API_BASE}/specialized/oil`),

  getCalendar: () => fetchJson<CalendarEvent[]>(`${API_BASE}/calendar`),

  getNews: (category?: string, tier?: number) => {
    const params = new URLSearchParams();
    if (category) params.set('category', category);
    if (tier) params.set('tier', tier.toString());
    const qs = params.toString();
    return fetchJson<any[]>(`${API_BASE}/news${qs ? `?${qs}` : ''}`);
  },

  getInstitutional: () => fetchJson<any[]>(`${API_BASE}/institutional`),

  getWhatChanged: () => fetchJson<WhatChangedItem[]>(`${API_BASE}/what-changed`),

  getAlerts: () => fetchJson<AlertItem[]>(`${API_BASE}/alerts`),

  runSimulation: (scenarioId: string) =>
    fetchJson<{ status: string; message: string; scenario_executed: string }>(
      `${API_BASE}/simulation/run?scenario_id=${encodeURIComponent(scenarioId)}`,
      { method: 'POST' }
    ),

  getBacktest: (symbol: string, holdingDays: number = 5) =>
    fetchJson<{ metrics: any; calibrations: any[] }>(
      `${API_BASE}/backtest?symbol=${encodeURIComponent(symbol)}&holding_days=${holdingDays}`
    ),

  getSystemHealth: () => fetchJson<SystemHealthData>(`${API_BASE}/system/health`),

  // Validation engine
  getValidationHistorical: (symbol: string, horizonDays = 5, totalWeeks = 52) =>
    fetchJson<any>(
      `${API_BASE}/validation/historical/${encodeURIComponent(symbol)}?horizon_days=${horizonDays}&total_weeks=${totalWeeks}`
    ),

  getValidationCalibration: (symbol: string, horizonDays = 5) =>
    fetchJson<any>(
      `${API_BASE}/validation/calibration/${encodeURIComponent(symbol)}?horizon_days=${horizonDays}`
    ),

  // Data integrity engine
  getIntegrityStatus: () => fetchJson<any>(`${API_BASE}/integrity/status`),

  getIntegrityIncidents: (severity?: string, limit = 50) => {
    const params = new URLSearchParams();
    if (severity) params.set('severity', severity);
    params.set('limit', limit.toString());
    return fetchJson<any>(`${API_BASE}/integrity/incidents?${params.toString()}`);
  },

  // Live ingestion engine (100% Free Public Feeds)
  getLiveStatus: () => fetchJson<LiveStatus>(`${API_BASE}/live/status`),
  triggerLiveSync: () =>
    fetchJson<{ message: string; details: any }>(`${API_BASE}/live/sync`, {
      method: 'POST',
    }),

  // 15-Year Historical & Forward Backtesting Engine (2011-2026)
  get15YBacktest: (symbol: string, horizonWeeks = 4) =>
    fetchJson<Historical15YReport>(
      `${API_BASE}/backtest/15y/${encodeURIComponent(symbol)}?horizon_weeks=${horizonWeeks}`
    ),

  get15YSummary: (horizonWeeks = 4) =>
    fetchJson<{
      horizon_weeks: number;
      evaluation_period: string;
      assets_count: number;
      summary: Historical15YSummaryItem[];
    }>(`${API_BASE}/backtest/15y-summary?horizon_weeks=${horizonWeeks}`),

  // CFTC COT Positioning & Trader Confluence
  getCOTPositioning: (symbol: string) =>
    fetchJson<COTPositionSnapshot>(`${API_BASE}/cot/${encodeURIComponent(symbol)}`),

  getAllCOTPositioning: () =>
    fetchJson<COTPositionSnapshot[]>(`${API_BASE}/cot-all`),

  getTraderConfluenceCard: (symbol: string) =>
    fetchJson<TraderConfluenceCard>(
      `${API_BASE}/bias/confluence/${encodeURIComponent(symbol)}`
    ),

  getPdfExportUrl: () => `${API_BASE}/export/pdf`,
  getCsvExportUrl: () => `${API_BASE}/export/csv`,
};
