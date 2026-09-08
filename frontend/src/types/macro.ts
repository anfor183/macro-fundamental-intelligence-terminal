export type BiasCategory =
  | 'STRONG BULLISH'
  | 'BULLISH'
  | 'MILD BULLISH'
  | 'NEUTRAL'
  | 'MILD BEARISH'
  | 'BEARISH'
  | 'STRONG BEARISH';

export interface AssetItem {
  id: number;
  symbol: string;
  name: string;
  asset_class: 'forex' | 'index' | 'metal' | 'commodity';
  base_currency?: string;
  quote_currency?: string;
  current_price: number;
  daily_change_pct: number;
  tactical_bias: BiasCategory;
  weekly_bias: BiasCategory;
  score: number;
  weekly_score: number;
  confidence: number;
  primary_driver: string;
  updated_at: string;
}

export interface FactorContribution {
  category: string;
  label: string;
  raw_score: number;
  weight: number;
  contribution: number;
  status: 'BULLISH' | 'BEARISH' | 'NEUTRAL';
  source_count: number;
}

export interface InvalidationCondition {
  id: string;
  condition: string;
  likelihood: 'Low' | 'Medium' | 'High';
  impact_if_triggered: string;
  metric_to_watch: string;
}

export interface ScenarioItem {
  title: string;
  probability: number;
  description: string;
  implications: string;
  triggers: string[];
}

export interface AssetDetail {
  symbol: string;
  name: string;
  asset_class: 'forex' | 'index' | 'metal' | 'commodity';
  base_currency?: string;
  quote_currency?: string;
  current_price: number;
  daily_change_pct: number;
  tactical_bias: BiasCategory;
  weekly_bias: BiasCategory;
  score: number;
  weekly_score: number;
  confidence: number;
  primary_driver: string;
  secondary_driver: string;
  bullish_factors: string[];
  bearish_factors: string[];
  conflicting_factors: string[];
  invalidation_conditions: InvalidationCondition[];
  scenario_bull?: ScenarioItem;
  scenario_base?: ScenarioItem;
  scenario_bear?: ScenarioItem;
  data_quality: {
    status: 'HEALTHY' | 'WARNING' | 'INSUFFICIENT_DATA';
    completeness_pct: number;
    stale_factors?: string[];
    conflicting_signals?: string[];
  };
  factor_breakdown: FactorContribution[];
  explanation: string;
  timestamp: string;
}

export interface MacroRegime {
  primary_regime: string;
  active_regimes: string[];
  risk_sentiment: 'RISK_ON' | 'RISK_OFF' | 'NEUTRAL';
  liquidity_cycle: 'EXPANDING' | 'CONTRACTING' | 'NEUTRAL';
  growth_cycle: 'EXPANSION' | 'SLOWDOWN' | 'CONTRACTION';
  inflation_cycle: 'INFLATIONARY' | 'DISINFLATIONARY' | 'STAGFLATIONARY' | 'MODERATE_INFLATION';
  summary: string;
  key_drivers: string[];
  timestamp: string;
}

export interface CurrencyMatrixItem {
  currency: string;
  name: string;
  absolute_score: number;
  weekly_score: number;
  rank: number;
  policy_stance: string;
  growth_stance: string;
  relative_scores: Record<string, number>;
}

export interface ForexRankingItem {
  rank: number;
  symbol: string;
  name: string;
  tactical_score: number;
  weekly_score: number;
  bias: BiasCategory;
  confidence: number;
  conviction_score: number;
  primary_driver: string;
}

export interface GoldDashboard {
  symbol: string;
  name: string;
  score: number;
  bias: BiasCategory;
  confidence: number;
  drivers: {
    gold_macro_score: number;
    real_yield_pressure: number;
    usd_pressure: number;
    fed_expectations: number;
    geopolitical_demand: number;
    central_bank_demand: number;
    primary_driver: string;
  };
  narrative: string;
}

export interface OilDashboard {
  symbol: string;
  name: string;
  score: number;
  bias: BiasCategory;
  confidence: number;
  drivers: {
    oil_macro_score: number;
    opec_discipline: number;
    china_demand_drag: number;
    inventory_draw_support: number;
    geopolitical_risk: number;
    global_growth: number;
    primary_driver: string;
  };
  narrative: string;
}

export interface CalendarEvent {
  id: string;
  country: string;
  currency: string;
  event: string;
  category: string;
  event_time: string;
  consensus: string;
  previous: string;
  importance: 'Critical' | 'High' | 'Medium' | 'Low';
  expected_volatility: 'High' | 'Medium' | 'Low';
  affected_assets: string[];
  sensitivity: string;
}

export interface WhatChangedItem {
  id: number;
  asset_symbol: string;
  timestamp: string;
  previous_bias: BiasCategory;
  new_bias: BiasCategory;
  previous_score: number;
  new_score: number;
  delta_score: number;
  primary_driver: string;
  secondary_driver?: string;
  confidence: number;
}

export interface AlertItem {
  id: number;
  asset_symbol?: string;
  alert_type: string;
  title: string;
  message: string;
  severity: 'INFO' | 'WARNING' | 'CRITICAL';
  timestamp: string;
}

export interface SystemHealthData {
  overall_status: string;
  timestamp: string;
  active_sources_count: number;
  total_events_processed: number;
  cache_connected: boolean;
  ai_service_available: boolean;
  data_freshness_seconds: number;
  components: Array<{
    component: string;
    status: string;
    latency_ms: number;
    error_rate_pct: number;
    message?: string;
    last_check: string;
  }>;
  recent_errors: string[];
}

// ---------------------------------------------------------------------------
// Validation Engine Types
// ---------------------------------------------------------------------------

export interface WalkForwardWindow {
  window_id: number;
  train_start: string;
  train_end: string;
  val_start: string;
  val_end: string;
  train_accuracy_pct: number;
  val_accuracy_pct: number;
  n_train_signals: number;
  n_val_signals: number;
  regime_at_val: string;
}

export interface CalibrationBin {
  bin_label: string;
  bin_min: number;
  bin_max: number;
  n_observations: number;
  model_confidence_avg: number;
  actual_hit_rate: number;
  is_well_calibrated: boolean;
}

export interface RegimeHitRate {
  regime: string;
  directional_accuracy_pct: number;
  n_signals: number;
  p_value: number;
  is_significant: boolean;
}

export interface FalseSignal {
  as_of_date: string;
  predicted_direction: string;
  score_at_signal: number;
  confidence_at_signal: number;
  reversal_day: number;
  reversal_return_pct: number;
  regime: string;
}

export interface ConfusionMatrix {
  true_positive: number;
  false_positive: number;
  true_negative: number;
  false_negative: number;
  precision: number;
  recall: number;
  f1_score: number;
}

export interface ValidationResult {
  asset_symbol: string;
  generated_at: string;
  horizon_days: number;
  overall_accuracy_pct: number;
  n_total_signals: number;
  n_bullish_signals: number;
  n_bearish_signals: number;
  n_neutral_periods: number;
  bullish_accuracy_pct: number;
  bearish_accuracy_pct: number;
  avg_gain_pct: number;
  avg_loss_pct: number;
  win_loss_ratio: number;
  sharpe_equivalent: number;
  bias_persistence_half_life_days: number;
  oos_accuracy_pct: number;
  information_coefficient: number;
  walk_forward_windows: WalkForwardWindow[];
  calibration_bins: CalibrationBin[];
  regime_hit_rates: RegimeHitRate[];
  false_signals: FalseSignal[];
  false_signal_rate_pct: number;
  confusion_matrix: ConfusionMatrix;
  disclaimer: string;
}

export interface CalibrationData {
  asset_symbol: string;
  horizon_days: number;
  calibration_bins: CalibrationBin[];
  overall_accuracy_pct: number;
  n_total_signals: number;
}

// ---------------------------------------------------------------------------
// Data Integrity Engine Types
// ---------------------------------------------------------------------------

export interface ProviderHeartbeat {
  provider_id: string;
  provider_name: string;
  data_category: string;
  country: string;
  last_seen: string;
  expected_interval_minutes: number;
  status: 'LIVE' | 'DELAYED' | 'STALE' | 'OFFLINE';
  freshness_delta_minutes: number;
  schema_drift_events_24h: number;
  consecutive_failures: number;
}

export interface SchemaReport {
  provider_id: string;
  expected_fields: string[];
  received_fields: string[];
  missing_fields: string[];
  extra_fields: string[];
  drift_events_24h: number;
  last_validated: string;
  is_healthy: boolean;
}

export interface GapDetection {
  release_id: string;
  expected_release: string;
  country: string;
  expected_window_start: string;
  hours_overdue: number;
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  auto_action: string;
}

export interface ReconciliationResult {
  indicator_name: string;
  country: string;
  provider_a: string;
  value_a: number;
  provider_b: string;
  value_b: number;
  divergence_pct: number;
  is_flagged: boolean;
  flagged_at: string;
}

export interface IntegrityIncident {
  incident_id: string;
  occurred_at: string;
  event_type: string;
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  provider_id: string | null;
  description: string;
  auto_action_taken: string;
  resolved: boolean;
}

export interface IntegrityStatus {
  computed_at: string;
  integrity_score: number;
  freshness_score: number;
  schema_health_score: number;
  gap_rate_score: number;
  circuit_breaker_active: boolean;
  circuit_breaker_triggered_at: string | null;
  circuit_breaker_reason: string | null;
  provider_heartbeats: ProviderHeartbeat[];
  schema_reports: SchemaReport[];
  gap_detections: GapDetection[];
  reconciliation_results: ReconciliationResult[];
  incidents: IntegrityIncident[];
}

export interface LiveStatus {
  is_active: boolean;
  status: string;
  last_price_sync: string | null;
  last_calendar_sync: string | null;
  last_news_sync: string | null;
  total_price_updates: number;
  total_calendar_events: number;
  total_news_events: number;
  last_error: string | null;
  providers_monitored: number;
  cost: string;
  timestamp: string;
}

export interface Regime15YPerformance {
  regime_id: string;
  regime_name: string;
  start_date: string;
  end_date: string;
  total_signals: number;
  correct_signals: number;
  hit_rate_pct: number;
  avg_gain_pct: number;
  avg_loss_pct: number;
  win_loss_ratio: number;
  sharpe_equivalent: number;
  description: string;
}

export interface Milestone15YCaseStudy {
  date: string;
  event_title: string;
  macro_context: string;
  model_score: number;
  predicted_bias: string;
  actual_market_move: string;
  forward_return_pct: number;
  verdict: string;
}

export interface Equity15YPoint {
  date: string;
  strategy_equity: number;
  enhanced_equity?: number;
  buy_hold_equity: number;
  drawdown_pct: number;
  enhanced_drawdown_pct?: number;
  signal: string;
  enhanced_signal?: string;
  score: number;
}

export interface Historical15YReport {
  asset_symbol: string;
  asset_name: string;
  start_date: string;
  end_date: string;
  total_weeks: number;
  evaluated_horizon_weeks: number;
  overall_hit_rate_pct: number;
  total_signals: number;
  bullish_signals_count: number;
  bullish_hit_rate_pct: number;
  bearish_signals_count: number;
  bearish_hit_rate_pct: number;
  neutral_signals_count: number;
  win_loss_ratio: number;
  sharpe_equivalent: number;
  information_coefficient: number;
  max_drawdown_pct: number;
  cumulative_strategy_return_pct: number;
  cumulative_buy_hold_return_pct: number;
  walk_forward_oos_accuracy_pct: number;
  enhanced_hit_rate_pct?: number;
  enhanced_sharpe_equivalent?: number;
  enhanced_win_loss_ratio?: number;
  enhanced_max_drawdown_pct?: number;
  enhanced_cumulative_return_pct?: number;
  enhanced_signals_count?: number;
  disclaimer: string;
  regime_breakdowns: Regime15YPerformance[];
  milestone_case_studies: Milestone15YCaseStudy[];
  equity_curve: Equity15YPoint[];
}

export interface Historical15YSummaryItem {
  symbol: string;
  name: string;
  total_signals: number;
  overall_hit_rate_pct: number;
  bullish_hit_rate_pct: number;
  bearish_hit_rate_pct: number;
  sharpe_equivalent: number;
  win_loss_ratio: number;
  information_coefficient: number;
  max_drawdown_pct: number;
  cumulative_strategy_return_pct: number;
  cumulative_buy_hold_return_pct: number;
  oos_accuracy_pct: number;
}

// ── CFTC Commitments of Traders (COT) & Confluence Types ──

export interface COTPositionSnapshot {
  symbol: string;
  asset_name: string;
  cftc_contract_code: string;
  report_date: string;
  non_commercial_long: number;
  non_commercial_short: number;
  commercial_long: number;
  commercial_short: number;
  total_open_interest: number;
  net_speculative: number;
  net_commercial: number;
  spec_net_pct_oi: number;
  cot_zscore_3y: number;
  crowding_index: number;
  positioning_trend_4w: number;
  sentiment_label: string;
  squeeze_warning: string | null;
}

export interface ConfluencePillar {
  name: string;
  label: string;
  score: number;
  weight: number;
  status: string;
  details: string;
}

export interface ConfluenceChecklistItem {
  title: string;
  passed: boolean;
  note: string;
}

export interface TraderConfluenceCard {
  symbol: string;
  asset_name: string;
  current_price: number;
  daily_atr: number;
  high_conviction_score: number;
  high_conviction_bias: string;
  confidence_pct: number;
  primary_direction: string;
  execution_directive: string;
  invalidation_price_level: number;
  cot_crowding_index: number;
  cot_zscore_3y: number;
  cot_sentiment_label: string;
  squeeze_warning: string | null;
  pillars: ConfluencePillar[];
  checklist: ConfluenceChecklistItem[];
  disclaimer: string;
}


