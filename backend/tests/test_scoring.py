"""Unit tests for factor scoring, normalization, and currency relative value."""

from backend.app.scoring.factor_scorer import compute_weighted_macro_score
from backend.app.scoring.currency_model import calculate_forex_pair_score, calculate_currency_strength_matrix


def test_weighted_macro_score_bounded_and_normalized():
    factor_scores = {
        "monetary_policy": 80.0,
        "rates_yields": 60.0,
        "inflation": 40.0,
        "growth": 30.0,
        "labor": 20.0,
        "risk_sentiment": 10.0,
    }
    result = compute_weighted_macro_score(asset_class="forex", factor_scores=factor_scores)
    assert -100.0 <= result["final_score"] <= 100.0
    assert result["final_score"] > 0.0
    assert len(result["contributions"]) > 0
    # Check that weights sum to approximately 1.0
    assert round(sum(result["weights_used"].values()), 2) == 1.0


def test_currency_relative_value():
    """EURUSD relative score = EUR score - USD score + yield spread."""
    # EUR bullish (+45), USD mild bearish (-15)
    eur_usd_score = calculate_forex_pair_score(
        base_currency_score=45.0,
        quote_currency_score=-15.0,
        yield_differential_score=10.0,
    )
    # Expected: (45 - (-15)) + (10 * 0.15) = 60 + 1.5 = 61.5
    assert eur_usd_score == 61.5


def test_currency_matrix_ranking():
    currencies = [
        {"code": "USD", "current_score": 20.0, "name": "US Dollar"},
        {"code": "EUR", "current_score": 50.0, "name": "Euro"},
        {"code": "JPY", "current_score": -10.0, "name": "Japanese Yen"},
    ]
    matrix = calculate_currency_strength_matrix(currencies)
    assert matrix[0]["currency"] == "EUR"
    assert matrix[0]["rank"] == 1
    assert matrix[1]["currency"] == "USD"
    assert matrix[1]["rank"] == 2
    assert matrix[2]["currency"] == "JPY"
    assert matrix[2]["rank"] == 3
    # Check relative score EUR vs JPY: 50 - (-10) = 60
    assert matrix[0]["relative_scores"]["JPY"] == 60.0
