"""Multi-Dimensional Financial NLP Sentiment Engine.

Implements institutional financial text analysis grounded in:
1. Loughran-McDonald Financial Lexicon & Monetary Policy Hawkish/Dovish Taxonomy
2. Contextual valence modification (Negations, Intensifiers, Diminishers)
3. Multi-Aspect scoring: Monetary Stance, Growth Impulse, Inflation Pressure
4. Statement Category Classification (Hard Data vs Central Bank Guidance vs Market Speculation)
"""

import re
from dataclasses import dataclass, field
from typing import Dict, Any, List, Optional, Set


# ── Lexical Dictionaries ───────────────────────────────────────────────────────

HAWKISH_TERMS = {
    "hike": 2.2, "rate hike": 2.8, "tighten": 2.0, "tightening": 2.2,
    "restrictive": 2.0, "restrictive stance": 2.6, "higher for longer": 2.8,
    "overheating": 2.2, "upside risk": 1.8, "upside risks to inflation": 2.5,
    "wage pressure": 1.9, "tight labor market": 2.0, "accelerate": 1.6,
    "inflation persistence": 2.4, "above target": 2.0, "premature to ease": 2.6,
    "quantitative tightening": 2.2, "balance sheet runoff": 1.8, "vigilant": 1.6,
    "stubborn inflation": 2.0, "sticky inflation": 2.2, "resilient demand": 1.5,
}

DOVISH_TERMS = {
    "cut": 2.2, "rate cut": 2.8, "ease": 2.0, "easing": 2.2,
    "accommodative": 2.2, "monetary accommodation": 2.6, "policy pivot": 2.2,
    "cooling": 1.8, "downside risk": 1.8, "downside risks to growth": 2.4,
    "slack in labor": 2.0, "unemployment rising": 2.2, "subdued inflation": 2.2,
    "disinflation": 2.0, "disinflationary progress": 2.5, "below target": 2.0,
    "policy recalibration": 2.0, "headwinds": 1.6, "recession fears": 2.2,
    "quantitative easing": 2.5, "liquidity injection": 2.0, "pause": 1.4,
    "softening demand": 1.9, "sluggish activity": 1.8,
}

GROWTH_POSITIVE_TERMS = {
    "expansion": 2.0, "resilient": 1.8, "outperform": 2.0, "surge": 1.9,
    "boom": 2.2, "record high": 2.0, "robust": 1.8, "job gains": 2.0,
    "payroll beat": 2.4, "gdp growth": 2.0, "stronger than expected": 2.2,
    "optimism": 1.5, "capital expenditure": 1.6, "consumer confidence rise": 2.0,
    "factory orders jump": 2.0, "pmi expansion": 2.2,
    "rose": 1.5, "beating consensus": 2.2, "beating": 2.0, "payrolls rose": 2.4,
    "nonfarm payrolls": 1.6,
}

GROWTH_NEGATIVE_TERMS = {
    "contraction": 2.2, "recession": 2.6, "slump": 2.2, "curtailment": 1.8,
    "job cuts": 2.2, "layoffs": 2.2, "jobless claims rise": 2.0, "slowdown": 2.0,
    "stagflation": 2.8, "miss consensus": 2.0, "subdued": 1.6,
    "factory orders drop": 2.0, "pmi contraction": 2.2, "deteriorating": 2.2,
    "bank failures": 2.8, "credit crunch": 2.5, "default risk": 2.4,
}

INFLATION_PRESSURES_TERMS = {
    "cpi beat": 2.5, "pce surge": 2.5, "price acceleration": 2.4,
    "producer price jump": 2.0, "commodity spike": 2.0, "supply chain bottleneck": 2.0,
    "energy price spike": 2.2, "wage-price spiral": 2.6, "tariff impact": 1.8,
}

INFLATION_COOLING_TERMS = {
    "cpi miss": 2.4, "pce cooler": 2.4, "price moderation": 2.2,
    "disinflation": 2.2, "falling fuel prices": 1.8, "goods deflation": 2.2,
    "supply normalization": 1.8, "shelter disinflation": 2.2,
}

NEGATION_TERMS = {
    "not", "no", "never", "unlikely", "failed to", "without", "hardly", "scarcely",
    "little sign of", "prevented", "rejected", "denied", "ruled out", "cannot", "neither"
}

INTENSIFIERS = {
    "sharply": 1.6, "significantly": 1.5, "substantially": 1.5, "massively": 1.7,
    "extremely": 1.6, "historically": 1.4, "unprecedented": 1.8, "strongly": 1.4,
    "dramatically": 1.6, "decisively": 1.5,
}

DIMINISHERS = {
    "slightly": 0.6, "marginally": 0.5, "modestly": 0.7, "tentatively": 0.6,
    "partially": 0.7, "somewhat": 0.7, "temporarily": 0.7,
}

CURRENCY_PATTERNS = {
    "USD": [r"\busd\b", r"\bdollar\b", r"\bfed\b", r"\bfomc\b", r"\bpowell\b", r"\btreasury\b", r"\bunited states\b"],
    "EUR": [r"\beur\b", r"\beuro\b", r"\becb\b", r"\blagarde\b", r"\beurozone\b", r"\bgermany\b", r"\bbund\b"],
    "GBP": [r"\bgbp\b", r"\bpound\b", r"\bsterling\b", r"\bboe\b", r"\bbailey\b", r"\bbank of england\b", r"\buk\b"],
    "JPY": [r"\bjpy\b", r"\byen\b", r"\bboj\b", r"\bueda\b", r"\bbank of japan\b", r"\bjgb\b"],
    "CHF": [r"\bchf\b", r"\bfranc\b", r"\bsnb\b", r"\bswiss\b", r"\bjordan\b", r"\bschlegel\b"],
    "CAD": [r"\bcad\b", r"\bloonie\b", r"\bboc\b", r"\bmacklem\b", r"\bcanada\b"],
    "AUD": [r"\baud\b", r"\baussie\b", r"\brba\b", r"\bbullock\b", r"\baustralia\b"],
    "NZD": [r"\bnzd\b", r"\bkiwi\b", r"\brbnz\b", r"\borr\b", r"\bnew zealand\b"],
    "GOLD": [r"\bgold\b", r"\bxau\b", r"\bbullion\b", r"\byellow metal\b"],
    "OIL": [r"\boil\b", r"\bcrude\b", r"\bwti\b", r"\bbrent\b", r"\bopec\b"],
    "CRYPTO": [r"\bbitcoin\b", r"\bbtc\b", r"\bethereum\b", r"\beth\b", r"\bcrypto\b"],
}


@dataclass
class SentimentResult:
    """Comprehensive multi-dimensional sentiment analysis."""
    sentiment_score: float  # -100.0 to +100.0
    hawkish_dovish_score: float  # -100.0 (Extremely Dovish) to +100.0 (Extremely Hawkish)
    growth_sentiment: float  # -100.0 (Recessionary) to +100.0 (Expansionary)
    inflation_pressure: float  # -100.0 (Cooling/Deflation) to +100.0 (Severe Inflation)
    direction: str  # BULLISH, BEARISH, NEUTRAL
    statement_type: str  # HARD_DATA, CENTRAL_BANK_GUIDANCE, ANALYST_OPINION, MARKET_SPECULATION
    confidence: float  # 0.0 to 100.0
    detected_currencies: List[str] = field(default_factory=list)
    key_signals: List[str] = field(default_factory=list)


class MacroNLPSentiment:
    """High-accuracy institutional NLP sentiment analyzer for macro financial text."""

    @classmethod
    def _score_lexicon(
        cls,
        text_tokens: List[str],
        pos_lexicon: Dict[str, float],
        neg_lexicon: Dict[str, float]
    ) -> float:
        """Score text against positive and negative lexicons with 3-token negation/intensifier window."""
        score = 0.0
        n = len(text_tokens)

        for i, token in enumerate(text_tokens):
            unigram = token
            bigram = f"{text_tokens[i]} {text_tokens[i+1]}" if i + 1 < n else ""

            matched_pos = pos_lexicon.get(bigram) or pos_lexicon.get(unigram)
            matched_neg = neg_lexicon.get(bigram) or neg_lexicon.get(unigram)

            if not matched_pos and not matched_neg:
                continue

            # Check context window of 3 preceding tokens for negations/modifiers
            window = text_tokens[max(0, i - 3):i]
            window_set = set(window)
            window_str = " ".join(window)

            multiplier = 1.0
            negated = any(t in window_set for t in ["not", "no", "never", "unlikely", "without", "hardly", "scarcely", "cannot", "neither", "rejected", "denied", "ruled"]) or any(phrase in window_str for phrase in ["unlikely to", "failed to", "little sign of"])

            for inten, factor in INTENSIFIERS.items():
                if inten in window_set or inten in window_str:
                    multiplier *= factor

            for dimin, factor in DIMINISHERS.items():
                if dimin in window_set or dimin in window_str:
                    multiplier *= factor

            if matched_pos:
                term_val = matched_pos * multiplier
                score += (-term_val * 0.8) if negated else term_val
            elif matched_neg:
                term_val = matched_neg * multiplier
                score += (term_val * 0.8) if negated else -term_val

        return score

    @classmethod
    def analyze_text(cls, text: str, title: Optional[str] = None) -> SentimentResult:
        """Run full multi-aspect NLP analysis on title + body text."""
        full_text = f"{title or ''} {text or ''}".strip()
        lower_text = full_text.lower()
        clean_text = re.sub(r"[^\w\s\.-]", " ", lower_text)
        tokens = [t for t in clean_text.split() if t]

        # 1. Hawkish vs Dovish scoring
        hawk_dove_raw = cls._score_lexicon(tokens, HAWKISH_TERMS, DOVISH_TERMS)
        hawkish_dovish_score = max(-100.0, min(100.0, hawk_dove_raw * 18.0))

        # 2. Growth sentiment scoring
        growth_raw = cls._score_lexicon(tokens, GROWTH_POSITIVE_TERMS, GROWTH_NEGATIVE_TERMS)
        growth_sentiment = max(-100.0, min(100.0, growth_raw * 20.0))

        # 3. Inflation pressure scoring
        infl_raw = cls._score_lexicon(tokens, INFLATION_PRESSURES_TERMS, INFLATION_COOLING_TERMS)
        inflation_pressure = max(-100.0, min(100.0, infl_raw * 22.0))

        # 4. Overall Macro Composite Sentiment
        composite = (hawkish_dovish_score * 0.40) + (growth_sentiment * 0.45) - (inflation_pressure * 0.15)
        sentiment_score = max(-100.0, min(100.0, round(composite, 1)))

        if sentiment_score >= 12.0:
            direction = "BULLISH"
        elif sentiment_score <= -12.0:
            direction = "BEARISH"
        else:
            direction = "NEUTRAL"

        # 5. Statement Classification
        statement_type = cls._classify_statement_type(lower_text)

        # 6. Entity & Currency Detection
        detected_currencies = []
        for curr, patterns in CURRENCY_PATTERNS.items():
            for pat in patterns:
                if re.search(pat, lower_text):
                    detected_currencies.append(curr)
                    break

        # 7. Confidence Calibration
        signal_density = (abs(hawkish_dovish_score) + abs(growth_sentiment) + abs(inflation_pressure)) / 3.0
        if statement_type == "HARD_DATA":
            confidence = min(98.0, max(82.0, 75.0 + (signal_density * 0.45)))
        elif statement_type == "MARKET_SPECULATION":
            confidence = max(40.0, min(65.0, 50.0 + (signal_density * 0.35) - 15.0))
        else:
            confidence = min(96.0, max(45.0, 50.0 + (signal_density * 0.45)))

        # 8. Key signals list
        key_signals = []
        if abs(hawkish_dovish_score) >= 20.0:
            key_signals.append(f"{'Hawkish' if hawkish_dovish_score > 0 else 'Dovish'} Policy Stance ({hawkish_dovish_score:+.0f})")
        if abs(growth_sentiment) >= 20.0:
            key_signals.append(f"{'Expansionary' if growth_sentiment > 0 else 'Contractionary'} Growth ({growth_sentiment:+.0f})")
        if abs(inflation_pressure) >= 20.0:
            key_signals.append(f"{'Accelerating' if inflation_pressure > 0 else 'Cooling'} Inflation ({inflation_pressure:+.0f})")

        return SentimentResult(
            sentiment_score=sentiment_score,
            hawkish_dovish_score=round(hawkish_dovish_score, 1),
            growth_sentiment=round(growth_sentiment, 1),
            inflation_pressure=round(inflation_pressure, 1),
            direction=direction,
            statement_type=statement_type,
            confidence=round(confidence, 1),
            detected_currencies=detected_currencies,
            key_signals=key_signals or ["Balanced macroeconomic backdrop"],
        )

    @classmethod
    def _classify_statement_type(cls, lower_text: str) -> str:
        """Categorize into hard verified data, central bank guidance, opinion, or speculation."""
        hard_data_indicators = [
            "reported", "printed", "data showed", "statistic", "preliminary", "revised to",
            "jumped by", "dropped by", "rose to", "fell to", "unemployment rate at",
            "cpi rose", "gdp grew", "nonfarm payrolls", "actual was", "bps"
        ]
        guidance_indicators = [
            "powell", "lagarde", "bailey", "ueda", "fomc statement", "press conference",
            "forward guidance", "dot plot", "will maintain", "prepared to adjust",
            "data dependent", "central bank said", "official release", "rate decision"
        ]
        speculation_indicators = [
            "sources say", "rumor", "speculation", "could be", "talk of", "might see",
            "whisper number", "unconfirmed", "leaked"
        ]
        forecast_indicators = [
            "expect", "forecast", "predict", "project", "estimate", "outlook", "sees", "anticipate"
        ]

        if any(w in lower_text for w in hard_data_indicators):
            return "HARD_DATA"
        if any(w in lower_text for w in guidance_indicators):
            return "CENTRAL_BANK_GUIDANCE"
        if any(w in lower_text for w in speculation_indicators):
            return "MARKET_SPECULATION"
        if any(w in lower_text for w in forecast_indicators):
            return "FORECAST"
        return "ANALYST_OPINION"
