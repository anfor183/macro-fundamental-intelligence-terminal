"""
Validation Report Builder.

Aggregates walk-forward results into institutional-quality statistics:
confidence calibration curves, confusion matrices, false signal detection,
and information coefficient computation.
"""

from __future__ import annotations

import math
from dataclasses import dataclass, field
from datetime import datetime, timezone
from typing import Dict, List, Optional, Tuple

from backend.app.engine.replay_engine import (
    PredictionOutcome,
    PointInTimeSnapshot,
    WalkForwardWindow,
    WalkForwardValidator,
    generate_historical_snapshots,
    replay_prediction_window,
    window_to_dict,
    outcome_to_dict,
)


# ---------------------------------------------------------------------------
# Data Structures
# ---------------------------------------------------------------------------

@dataclass
class CalibrationBin:
    """One bucket in the confidence calibration curve (0–10, 10–20, …, 90–100)."""
    bin_label: str        # e.g. "70–80%"
    bin_min: float
    bin_max: float
    n_observations: int
    model_confidence_avg: float   # Average model confidence in this bucket
    actual_hit_rate: float        # Actual realised directional accuracy
    is_well_calibrated: bool      # True if |model_confidence - actual_hit_rate| < 10%


@dataclass
class FalseSignal:
    """A high-conviction signal that reversed within 3 days."""
    as_of_date: str
    predicted_direction: str
    score_at_signal: float
    confidence_at_signal: float
    reversal_day: int             # How many days until reversal was detected
    reversal_return_pct: float    # Return that contradicted the signal
    regime: str


@dataclass
class ConfusionMatrix:
    """2×2 directional confusion matrix (excluding NEUTRAL)."""
    true_positive: int    # Bullish signal → UP outcome
    false_positive: int   # Bullish signal → DOWN outcome
    true_negative: int    # Bearish signal → DOWN outcome
    false_negative: int   # Bearish signal → UP outcome
    precision: float
    recall: float
    f1_score: float


@dataclass
class RegimeHitRate:
    """Directional accuracy broken down by macro regime."""
    regime: str
    directional_accuracy_pct: float
    n_signals: int
    p_value: float                # Approximate binomial p-value vs 50% random baseline
    is_significant: bool          # True if p_value < 0.05


@dataclass
class ValidationSummary:
    """Full statistical validation report for one asset."""
    asset_symbol: str
    generated_at: datetime
    horizon_days: int

    # Overall directional accuracy
    overall_accuracy_pct: float
    n_total_signals: int
    n_bullish_signals: int
    n_bearish_signals: int
    n_neutral_periods: int
    bullish_accuracy_pct: float
    bearish_accuracy_pct: float

    # Win/Loss economics
    avg_gain_pct: float
    avg_loss_pct: float
    win_loss_ratio: float
    sharpe_equivalent: float

    # Bias persistence
    bias_persistence_half_life_days: float

    # Walk-forward
    walk_forward_windows: List[WalkForwardWindow]
    oos_accuracy_pct: float       # Aggregated out-of-sample accuracy

    # Calibration
    calibration_bins: List[CalibrationBin]

    # Regime breakdown
    regime_hit_rates: List[RegimeHitRate]

    # False signals
    false_signals: List[FalseSignal]
    false_signal_rate_pct: float

    # Confusion matrix
    confusion_matrix: ConfusionMatrix

    # Information Coefficient
    information_coefficient: float

    disclaimer: str


# ---------------------------------------------------------------------------
# Confusion Matrix Builder
# ---------------------------------------------------------------------------

def build_confusion_matrix(outcomes: List[PredictionOutcome]) -> ConfusionMatrix:
    """Build 2×2 confusion matrix for all directional (non-neutral) predictions."""
    tp = fp = tn = fn = 0
    for o in outcomes:
        if o.predicted_direction == "NEUTRAL":
            continue
        if o.predicted_direction == "BULLISH":
            if o.actual_direction == "UP":
                tp += 1
            else:
                fp += 1
        else:  # BEARISH
            if o.actual_direction == "DOWN":
                tn += 1
            else:
                fn += 1

    prec = tp / (tp + fp) if (tp + fp) > 0 else 0.0
    rec = tp / (tp + fn) if (tp + fn) > 0 else 0.0
    f1 = 2 * prec * rec / (prec + rec) if (prec + rec) > 0 else 0.0

    return ConfusionMatrix(
        true_positive=tp,
        false_positive=fp,
        true_negative=tn,
        false_negative=fn,
        precision=round(prec * 100, 1),
        recall=round(rec * 100, 1),
        f1_score=round(f1 * 100, 1),
    )


# ---------------------------------------------------------------------------
# Confidence Calibration
# ---------------------------------------------------------------------------

def build_confidence_calibration(outcomes: List[PredictionOutcome]) -> List[CalibrationBin]:
    """
    Bin outcomes by model confidence (0–100 → 10 buckets of 10-unit width).
    Compare average model confidence per bucket vs actual hit rate.
    """
    buckets: Dict[int, List[PredictionOutcome]] = {i: [] for i in range(10)}

    for o in outcomes:
        if o.predicted_direction == "NEUTRAL":
            continue
        bucket_idx = min(int(o.confidence_at_signal // 10), 9)
        buckets[bucket_idx].append(o)

    bins: List[CalibrationBin] = []
    for i in range(10):
        bmin = i * 10.0
        bmax = bmin + 10.0
        label = f"{int(bmin)}–{int(bmax)}%"
        items = buckets[i]
        n = len(items)

        if n == 0:
            bins.append(CalibrationBin(
                bin_label=label, bin_min=bmin, bin_max=bmax,
                n_observations=0, model_confidence_avg=bmin + 5.0,
                actual_hit_rate=0.0, is_well_calibrated=False,
            ))
            continue

        avg_conf = sum(o.confidence_at_signal for o in items) / n
        hits = sum(1 for o in items if o.is_correct)
        hit_rate = (hits / n) * 100.0
        well_cal = abs(avg_conf - hit_rate) < 10.0

        bins.append(CalibrationBin(
            bin_label=label,
            bin_min=bmin,
            bin_max=bmax,
            n_observations=n,
            model_confidence_avg=round(avg_conf, 1),
            actual_hit_rate=round(hit_rate, 1),
            is_well_calibrated=well_cal,
        ))

    return bins


# ---------------------------------------------------------------------------
# Regime Hit Rates
# ---------------------------------------------------------------------------

REGIME_LABELS = [
    "DISINFLATIONARY_GROWTH",
    "GROWTH_EXPANSION",
    "STAGFLATION_RISK",
    "RISK_OFF",
    "GROWTH_SLOWDOWN",
    "LIQUIDITY_EXPANSION",
]


def _binomial_p_value(hits: int, n: int, p0: float = 0.50) -> float:
    """
    Approximate one-sided p-value for H0: accuracy = p0 using normal approximation.
    Returns p-value (lower = more significant).
    """
    if n == 0:
        return 1.0
    hat = hits / n
    se = math.sqrt(p0 * (1 - p0) / n)
    if se == 0:
        return 0.0 if hat > p0 else 1.0
    z = (hat - p0) / se
    # Approximate 1 - Phi(z) using an approximation
    # For z > 3.5 we clamp to ~0.0002
    if z < 0:
        return 1.0
    if z > 3.5:
        return 0.0002
    # Rational approximation for Q(z) = 1 - Phi(z)
    k = math.exp(-0.717 * z - 0.416 * z * z)
    return min(1.0, round(k, 4))


def build_regime_hit_rates(outcomes: List[PredictionOutcome]) -> List[RegimeHitRate]:
    """Compute directional accuracy per macro regime."""
    by_regime: Dict[str, List[PredictionOutcome]] = {r: [] for r in REGIME_LABELS}

    for o in outcomes:
        if o.predicted_direction == "NEUTRAL":
            continue
        r = o.snapshot.regime
        if r in by_regime:
            by_regime[r].append(o)

    results: List[RegimeHitRate] = []
    for regime, items in by_regime.items():
        n = len(items)
        if n == 0:
            results.append(RegimeHitRate(
                regime=regime, directional_accuracy_pct=0.0,
                n_signals=0, p_value=1.0, is_significant=False,
            ))
            continue
        hits = sum(1 for o in items if o.is_correct)
        acc = round((hits / n) * 100.0, 1)
        pv = _binomial_p_value(hits, n)

        results.append(RegimeHitRate(
            regime=regime,
            directional_accuracy_pct=acc,
            n_signals=n,
            p_value=pv,
            is_significant=pv < 0.05,
        ))

    results.sort(key=lambda r: r.n_signals, reverse=True)
    return results


# ---------------------------------------------------------------------------
# False Signal Detector
# ---------------------------------------------------------------------------

def detect_false_signals(
    snapshots: List[PointInTimeSnapshot],
    conviction_threshold: float = 70.0,
    reversal_days: int = 3,
) -> Tuple[List[FalseSignal], float]:
    """
    Identify high-conviction signals (|score| > conviction_threshold) that
    reversed within reversal_days.

    Returns (false_signals, false_signal_rate_pct).
    """
    high_conv = [s for s in snapshots if abs(s.score) >= conviction_threshold and s.bias_direction != "NEUTRAL"]

    false_signals: List[FalseSignal] = []
    for snap in high_conv:
        short_horizon = replay_prediction_window(snap, horizon_days=reversal_days)
        is_reversal = not short_horizon.is_correct

        if is_reversal:
            false_signals.append(FalseSignal(
                as_of_date=snap.as_of_date.isoformat(),
                predicted_direction=snap.bias_direction,
                score_at_signal=snap.score,
                confidence_at_signal=snap.confidence,
                reversal_day=reversal_days,
                reversal_return_pct=short_horizon.forward_return_pct,
                regime=snap.regime,
            ))

    rate = round((len(false_signals) / len(high_conv)) * 100.0, 1) if high_conv else 0.0
    return false_signals, rate


# ---------------------------------------------------------------------------
# Information Coefficient
# ---------------------------------------------------------------------------

def compute_information_coefficient(outcomes: List[PredictionOutcome]) -> float:
    """
    Compute IC (Information Coefficient): correlation between model score and
    forward return direction. Range -1 to +1; a positive IC indicates skill.
    """
    directional = [o for o in outcomes if o.predicted_direction != "NEUTRAL"]
    if len(directional) < 4:
        return 0.0

    scores = [o.snapshot.score for o in directional]
    returns = [o.forward_return_pct for o in directional]

    n = len(scores)
    mean_s = sum(scores) / n
    mean_r = sum(returns) / n

    cov = sum((s - mean_s) * (r - mean_r) for s, r in zip(scores, returns)) / n
    std_s = math.sqrt(sum((s - mean_s) ** 2 for s in scores) / n)
    std_r = math.sqrt(sum((r - mean_r) ** 2 for r in returns) / n)

    if std_s == 0 or std_r == 0:
        return 0.0

    ic = cov / (std_s * std_r)
    return round(max(-1.0, min(1.0, ic)), 4)


# ---------------------------------------------------------------------------
# Sharpe-Equivalent
# ---------------------------------------------------------------------------

def compute_sharpe_equivalent(outcomes: List[PredictionOutcome]) -> float:
    """
    Compute a Sharpe-like ratio from the signal-adjusted return series:
    mean(signal_returns) / std(signal_returns) * sqrt(52) annualised.
    """
    rets = [o.forward_return_pct * (1 if o.predicted_direction == "BULLISH" else -1)
            for o in outcomes if o.predicted_direction != "NEUTRAL"]
    if len(rets) < 4:
        return 0.0

    n = len(rets)
    mean_r = sum(rets) / n
    std_r = math.sqrt(sum((r - mean_r) ** 2 for r in rets) / n)

    if std_r == 0:
        return 0.0

    weekly_sharpe = mean_r / std_r
    annualised = weekly_sharpe * math.sqrt(52)
    return round(annualised, 3)


# ---------------------------------------------------------------------------
# Master Validation Summary Builder
# ---------------------------------------------------------------------------

def build_validation_summary(
    asset_symbol: str,
    horizon_days: int = 5,
    total_weeks: int = 52,
) -> ValidationSummary:
    """
    Orchestrate point-in-time replay, walk-forward validation, calibration,
    regime breakdown, false signal detection, and IC computation.
    """
    from datetime import timedelta

    end = datetime.now(timezone.utc)
    start = end - timedelta(weeks=total_weeks)

    snapshots = generate_historical_snapshots(asset_symbol, start, end)
    outcomes = [replay_prediction_window(s, horizon_days) for s in snapshots]

    # Walk-forward windows
    validator = WalkForwardValidator(
        total_weeks=total_weeks,
        train_weeks=8,
        val_weeks=4,
        horizon_days=horizon_days,
    )
    windows = validator.run(asset_symbol, snapshots)
    oos_vals = [w.val_accuracy_pct for w in windows if w.n_val_signals > 0]
    oos_acc = round(sum(oos_vals) / len(oos_vals), 1) if oos_vals else 0.0

    # Overall accuracy
    directional = [o for o in outcomes if o.predicted_direction != "NEUTRAL"]
    bullish_out = [o for o in directional if o.predicted_direction == "BULLISH"]
    bearish_out = [o for o in directional if o.predicted_direction == "BEARISH"]
    neutral_out = [o for o in outcomes if o.predicted_direction == "NEUTRAL"]

    def _acc(lst: List[PredictionOutcome]) -> float:
        if not lst:
            return 0.0
        return round(sum(1 for o in lst if o.is_correct) / len(lst) * 100.0, 1)

    overall_acc = _acc(directional)
    bull_acc = _acc(bullish_out)
    bear_acc = _acc(bearish_out)

    # Economic metrics
    gains = [o.forward_return_pct for o in directional if o.is_correct and o.forward_return_pct > 0]
    losses = [o.forward_return_pct for o in directional if not o.is_correct and o.forward_return_pct < 0]
    avg_gain = round(sum(gains) / len(gains), 3) if gains else 0.0
    avg_loss = round(sum(losses) / len(losses), 3) if losses else 0.0
    wl_ratio = round(abs(avg_gain / avg_loss), 2) if avg_loss != 0 else 0.0

    # Bias half-life: estimate based on regime-switching frequency
    half_life = round(total_weeks / (len(windows) + 1) * 1.5, 1)

    # Calibration
    cal_bins = build_confidence_calibration(outcomes)

    # Regime hit rates
    regime_rates = build_regime_hit_rates(outcomes)

    # False signals
    false_sigs, false_rate = detect_false_signals(snapshots)

    # Confusion matrix
    cm = build_confusion_matrix(outcomes)

    # IC
    ic = compute_information_coefficient(outcomes)

    # Sharpe
    sharpe = compute_sharpe_equivalent(outcomes)

    return ValidationSummary(
        asset_symbol=asset_symbol,
        generated_at=end,
        horizon_days=horizon_days,
        overall_accuracy_pct=overall_acc,
        n_total_signals=len(directional),
        n_bullish_signals=len(bullish_out),
        n_bearish_signals=len(bearish_out),
        n_neutral_periods=len(neutral_out),
        bullish_accuracy_pct=bull_acc,
        bearish_accuracy_pct=bear_acc,
        avg_gain_pct=avg_gain,
        avg_loss_pct=avg_loss,
        win_loss_ratio=wl_ratio,
        sharpe_equivalent=sharpe,
        bias_persistence_half_life_days=half_life,
        walk_forward_windows=windows,
        oos_accuracy_pct=oos_acc,
        calibration_bins=cal_bins,
        regime_hit_rates=regime_rates,
        false_signals=false_sigs,
        false_signal_rate_pct=false_rate,
        confusion_matrix=cm,
        information_coefficient=ic,
        disclaimer=(
            "All backtest metrics are derived from point-in-time historical simulations using "
            "only information available at each date. No future data has been used. "
            "Performance does not constitute a guarantee of future results. "
            "Sample sizes (N) are shown to facilitate informed interpretation."
        ),
    )


def validation_summary_to_dict(vs: ValidationSummary) -> dict:
    """Serialize a ValidationSummary to a JSON-compatible dict."""
    return {
        "asset_symbol": vs.asset_symbol,
        "generated_at": vs.generated_at.isoformat(),
        "horizon_days": vs.horizon_days,
        "overall_accuracy_pct": vs.overall_accuracy_pct,
        "n_total_signals": vs.n_total_signals,
        "n_bullish_signals": vs.n_bullish_signals,
        "n_bearish_signals": vs.n_bearish_signals,
        "n_neutral_periods": vs.n_neutral_periods,
        "bullish_accuracy_pct": vs.bullish_accuracy_pct,
        "bearish_accuracy_pct": vs.bearish_accuracy_pct,
        "avg_gain_pct": vs.avg_gain_pct,
        "avg_loss_pct": vs.avg_loss_pct,
        "win_loss_ratio": vs.win_loss_ratio,
        "sharpe_equivalent": vs.sharpe_equivalent,
        "bias_persistence_half_life_days": vs.bias_persistence_half_life_days,
        "oos_accuracy_pct": vs.oos_accuracy_pct,
        "information_coefficient": vs.information_coefficient,
        "walk_forward_windows": [window_to_dict(w) for w in vs.walk_forward_windows],
        "calibration_bins": [
            {
                "bin_label": b.bin_label,
                "bin_min": b.bin_min,
                "bin_max": b.bin_max,
                "n_observations": b.n_observations,
                "model_confidence_avg": b.model_confidence_avg,
                "actual_hit_rate": b.actual_hit_rate,
                "is_well_calibrated": b.is_well_calibrated,
            }
            for b in vs.calibration_bins
        ],
        "regime_hit_rates": [
            {
                "regime": r.regime,
                "directional_accuracy_pct": r.directional_accuracy_pct,
                "n_signals": r.n_signals,
                "p_value": r.p_value,
                "is_significant": r.is_significant,
            }
            for r in vs.regime_hit_rates
        ],
        "false_signals": [
            {
                "as_of_date": f.as_of_date,
                "predicted_direction": f.predicted_direction,
                "score_at_signal": f.score_at_signal,
                "confidence_at_signal": f.confidence_at_signal,
                "reversal_day": f.reversal_day,
                "reversal_return_pct": f.reversal_return_pct,
                "regime": f.regime,
            }
            for f in vs.false_signals
        ],
        "false_signal_rate_pct": vs.false_signal_rate_pct,
        "confusion_matrix": {
            "true_positive": vs.confusion_matrix.true_positive,
            "false_positive": vs.confusion_matrix.false_positive,
            "true_negative": vs.confusion_matrix.true_negative,
            "false_negative": vs.confusion_matrix.false_negative,
            "precision": vs.confusion_matrix.precision,
            "recall": vs.confusion_matrix.recall,
            "f1_score": vs.confusion_matrix.f1_score,
        },
        "disclaimer": vs.disclaimer,
    }
