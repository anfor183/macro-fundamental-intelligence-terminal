"""Universe constants, default factor weights, half-lives, and bias thresholds."""

# BIAS CATEGORIES AND NUMERICAL THRESHOLDS
# Range: -100 to +100
BIAS_THRESHOLDS = [
    (70.0, 100.0, "STRONG BULLISH"),
    (40.0, 69.99, "BULLISH"),
    (15.0, 39.99, "MILD BULLISH"),
    (-14.99, 14.99, "NEUTRAL"),
    (-39.99, -15.0, "MILD BEARISH"),
    (-69.99, -40.0, "BEARISH"),
    (-100.0, -70.0, "STRONG BEARISH"),
]

def score_to_bias(score: float) -> str:
    """Deterministic conversion of numerical score (-100 to +100) to Bias Category."""
    clamped = max(-100.0, min(100.0, score))
    for low, high, bias in BIAS_THRESHOLDS:
        if low <= clamped <= high:
            return bias
    if clamped > 70.0:
        return "STRONG BULLISH"
    return "STRONG BEARISH"


# HALF-LIVES FOR MACRO CATEGORIES (in days)
# Used for time decay of news/economic releases
CATEGORY_HALF_LIVES = {
    "monetary_policy": 21.0,     # Central bank decisions & guidance hold influence for weeks
    "rates_yields": 10.0,        # Yield curves and rate differentials
    "inflation": 14.0,           # CPI / PCE data retains strong anchor until next monthly print
    "labor": 14.0,               # NFP / Unemployment rate anchor until next release
    "growth": 14.0,              # GDP / Retail sales / PMIs
    "consumer": 7.0,             # Consumer sentiment / confidence
    "trade": 14.0,               # Trade balance / current account
    "fiscal": 30.0,              # Government budgets & debt issuance
    "geopolitics": 5.0,          # Headlines decay rapidly unless active conflict/sanctions
    "commodities": 7.0,          # Supply shocks, OPEC, inventory prints
    "risk_sentiment": 3.0,       # Risk-on / risk-off mood swings decay fastest
    "institutional": 14.0,       # Bank strategist opinions
}


# DEFAULT FACTOR WEIGHTS BY ASSET CLASS
DEFAULT_WEIGHTS = {
    "forex": {
        "monetary_policy": 0.20,
        "rates_yields": 0.15,
        "inflation": 0.12,
        "growth": 0.12,
        "labor": 0.10,
        "risk_sentiment": 0.10,
        "trade": 0.05,
        "commodities": 0.05,
        "fiscal": 0.05,
        "institutional": 0.06,
    },
    "metal": { # e.g. Gold, Silver
        "rates_yields": 0.25,        # Real yields (TIPS) are primary gold driver
        "usd_pressure": 0.20,        # DXY negative correlation
        "monetary_policy": 0.15,     # Fed rate cuts/hikes
        "geopolitics": 0.15,         # Safe-haven demand
        "inflation": 0.10,           # Inflation hedge
        "central_bank_demand": 0.10, # Central bank reserve buying
        "risk_sentiment": 0.05,
    },
    "commodity": { # e.g. WTI, Brent, Copper
        "commodities": 0.25,         # Physical supply & OPEC+
        "growth": 0.25,              # Global industrial & China demand
        "inventories": 0.15,         # EIA/API/Cushing inventories
        "geopolitics": 0.15,         # Supply disruptions & shipping chokepoints
        "usd_pressure": 0.10,        # USD denominator effect
        "risk_sentiment": 0.10,      # Global trade appetite
    },
    "index": { # e.g. S&P 500, DAX, Nikkei
        "growth": 0.25,              # Corporate earnings & GDP
        "monetary_policy": 0.20,     # Liquidity & policy rates
        "rates_yields": 0.15,        # Discount rates / 10Y yields
        "inflation": 0.15,           # Input costs & margin squeeze
        "risk_sentiment": 0.15,      # Volatility / VIX
        "fiscal": 0.10,              # Government stimulus / corporate tax
    }
}


# CURRENCIES UNIVERSE
SUPPORTED_CURRENCIES = [
    {"code": "USD", "name": "United States Dollar", "country": "United States", "cb_code": "FED"},
    {"code": "EUR", "name": "Euro", "country": "Eurozone", "cb_code": "ECB"},
    {"code": "GBP", "name": "British Pound", "country": "United Kingdom", "cb_code": "BOE"},
    {"code": "JPY", "name": "Japanese Yen", "country": "Japan", "cb_code": "BOJ"},
    {"code": "CHF", "name": "Swiss Franc", "country": "Switzerland", "cb_code": "SNB"},
    {"code": "CAD", "name": "Canadian Dollar", "country": "Canada", "cb_code": "BOC"},
    {"code": "AUD", "name": "Australian Dollar", "country": "Australia", "cb_code": "RBA"},
    {"code": "NZD", "name": "New Zealand Dollar", "country": "New Zealand", "cb_code": "RBNZ"},
    {"code": "CNY", "name": "Chinese Yuan", "country": "China", "cb_code": "PBOC"},
    {"code": "SEK", "name": "Swedish Krona", "country": "Sweden", "cb_code": "RIKSBANK"},
    {"code": "NOK", "name": "Norwegian Krone", "country": "Norway", "cb_code": "NORGES"},
]


# CENTRAL BANKS UNIVERSE
SUPPORTED_CENTRAL_BANKS = [
    {
        "code": "FED", "name": "Federal Reserve", "country": "United States", "currency": "USD",
        "current_rate": 4.50, "previous_rate": 4.75, "expected_next_rate": 4.25,
        "guidance_stance": "Dovish", "balance_sheet_policy": "QT Deceleration",
        "last_statement_summary": "FOMC members signal rate path remains data-dependent with labor market cooling taking precedence over residual services inflation."
    },
    {
        "code": "ECB", "name": "European Central Bank", "country": "Eurozone", "currency": "EUR",
        "current_rate": 2.75, "previous_rate": 3.00, "expected_next_rate": 2.50,
        "guidance_stance": "Dovish", "balance_sheet_policy": "APP Runoff",
        "last_statement_summary": "ECB Governing Council highlights sluggish Eurozone manufacturing momentum while domestic wage pressure continues gradual moderation."
    },
    {
        "code": "BOE", "name": "Bank of England", "country": "United Kingdom", "currency": "GBP",
        "current_rate": 4.75, "previous_rate": 5.00, "expected_next_rate": 4.50,
        "guidance_stance": "Neutral", "balance_sheet_policy": "Active Gilt QT",
        "last_statement_summary": "MPC emphasizes a gradual approach to policy easing as UK services inflation and wage settlements demonstrate stickiness."
    },
    {
        "code": "BOJ", "name": "Bank of Japan", "country": "Japan", "currency": "JPY",
        "current_rate": 0.50, "previous_rate": 0.25, "expected_next_rate": 0.75,
        "guidance_stance": "Hawkish", "balance_sheet_policy": "JGB Tapering",
        "last_statement_summary": "Governor Ueda reaffirms that policy rate hikes will continue if inflation and virtuous wage-price spirals stay on track."
    },
    {
        "code": "SNB", "name": "Swiss National Bank", "country": "Switzerland", "currency": "CHF",
        "current_rate": 0.50, "previous_rate": 1.00, "expected_next_rate": 0.50,
        "guidance_stance": "Neutral", "balance_sheet_policy": "FX Interventions Ready",
        "last_statement_summary": "SNB maintains accommodative stance amid subdued Swiss inflation and elevated real exchange rate appreciation concerns."
    },
    {
        "code": "BOC", "name": "Bank of Canada", "country": "Canada", "currency": "CAD",
        "current_rate": 3.25, "previous_rate": 3.75, "expected_next_rate": 3.00,
        "guidance_stance": "Dovish", "balance_sheet_policy": "Balance Sheet Normalization",
        "last_statement_summary": "Governing Council notes Canadian consumer demand is soft and excess supply persists across non-commodity sectors."
    },
    {
        "code": "RBA", "name": "Reserve Bank of Australia", "country": "Australia", "currency": "AUD",
        "current_rate": 4.10, "previous_rate": 4.35, "expected_next_rate": 4.10,
        "guidance_stance": "Neutral", "balance_sheet_policy": "Runoff",
        "last_statement_summary": "RBA remains watchful of upside risks to underlying inflation while monitoring China stimulus efficacy."
    },
    {
        "code": "RBNZ", "name": "Reserve Bank of New Zealand", "country": "New Zealand", "currency": "NZD",
        "current_rate": 4.25, "previous_rate": 4.75, "expected_next_rate": 3.75,
        "guidance_stance": "Dovish", "balance_sheet_policy": "Bond Runoff",
        "last_statement_summary": "RBNZ accelerates rate normalization as headline inflation returns within the 1-3% target band."
    },
    {
        "code": "PBOC", "name": "People's Bank of China", "country": "China", "currency": "CNY",
        "current_rate": 3.10, "previous_rate": 3.35, "expected_next_rate": 3.00,
        "guidance_stance": "Accommodative", "balance_sheet_policy": "Targeted Liquidity",
        "last_statement_summary": "PBOC injects reverse repos and lowers reserve requirements to stimulate domestic credit demand and property sector stabilization."
    },
]


# ASSETS UNIVERSE (Forex Majors, Crosses, Indices, Metals, Commodities)
SUPPORTED_ASSETS = [
    # FOREX MAJORS
    {"symbol": "EURUSD", "name": "Euro / US Dollar", "asset_class": "forex", "base_currency": "EUR", "quote_currency": "USD", "current_price": 1.0825, "daily_change_pct": 0.22},
    {"symbol": "GBPUSD", "name": "British Pound / US Dollar", "asset_class": "forex", "base_currency": "GBP", "quote_currency": "USD", "current_price": 1.2940, "daily_change_pct": 0.15},
    {"symbol": "USDJPY", "name": "US Dollar / Japanese Yen", "asset_class": "forex", "base_currency": "USD", "quote_currency": "JPY", "current_price": 152.80, "daily_change_pct": -0.45},
    {"symbol": "USDCHF", "name": "US Dollar / Swiss Franc", "asset_class": "forex", "base_currency": "USD", "quote_currency": "CHF", "current_price": 0.8850, "daily_change_pct": -0.10},
    {"symbol": "USDCAD", "name": "US Dollar / Canadian Dollar", "asset_class": "forex", "base_currency": "USD", "quote_currency": "CAD", "current_price": 1.3980, "daily_change_pct": 0.08},
    {"symbol": "AUDUSD", "name": "Australian Dollar / US Dollar", "asset_class": "forex", "base_currency": "AUD", "quote_currency": "USD", "current_price": 0.6580, "daily_change_pct": 0.35},
    {"symbol": "NZDUSD", "name": "New Zealand Dollar / US Dollar", "asset_class": "forex", "base_currency": "NZD", "quote_currency": "USD", "current_price": 0.5890, "daily_change_pct": 0.18},

    # FOREX CROSSES
    {"symbol": "EURGBP", "name": "Euro / British Pound", "asset_class": "forex", "base_currency": "EUR", "quote_currency": "GBP", "current_price": 0.8365, "daily_change_pct": 0.07},
    {"symbol": "EURJPY", "name": "Euro / Japanese Yen", "asset_class": "forex", "base_currency": "EUR", "quote_currency": "JPY", "current_price": 165.40, "daily_change_pct": -0.23},
    {"symbol": "EURCHF", "name": "Euro / Swiss Franc", "asset_class": "forex", "base_currency": "EUR", "quote_currency": "CHF", "current_price": 0.9580, "daily_change_pct": 0.12},
    {"symbol": "EURAUD", "name": "Euro / Australian Dollar", "asset_class": "forex", "base_currency": "EUR", "quote_currency": "AUD", "current_price": 1.6450, "daily_change_pct": -0.13},
    {"symbol": "EURNZD", "name": "Euro / New Zealand Dollar", "asset_class": "forex", "base_currency": "EUR", "quote_currency": "NZD", "current_price": 1.8378, "daily_change_pct": 0.04},
    {"symbol": "EURCAD", "name": "Euro / Canadian Dollar", "asset_class": "forex", "base_currency": "EUR", "quote_currency": "CAD", "current_price": 1.5133, "daily_change_pct": 0.30},

    {"symbol": "GBPJPY", "name": "British Pound / Japanese Yen", "asset_class": "forex", "base_currency": "GBP", "quote_currency": "JPY", "current_price": 197.72, "daily_change_pct": -0.30},
    {"symbol": "GBPCHF", "name": "British Pound / Swiss Franc", "asset_class": "forex", "base_currency": "GBP", "quote_currency": "CHF", "current_price": 1.1450, "daily_change_pct": 0.05},
    {"symbol": "GBPAUD", "name": "British Pound / Australian Dollar", "asset_class": "forex", "base_currency": "GBP", "quote_currency": "AUD", "current_price": 1.9665, "daily_change_pct": -0.20},
    {"symbol": "GBPCAD", "name": "British Pound / Canadian Dollar", "asset_class": "forex", "base_currency": "GBP", "quote_currency": "CAD", "current_price": 1.8090, "daily_change_pct": 0.23},
    {"symbol": "GBPNZD", "name": "British Pound / New Zealand Dollar", "asset_class": "forex", "base_currency": "GBP", "quote_currency": "NZD", "current_price": 2.1969, "daily_change_pct": -0.03},

    {"symbol": "AUDJPY", "name": "Australian Dollar / Japanese Yen", "asset_class": "forex", "base_currency": "AUD", "quote_currency": "JPY", "current_price": 100.54, "daily_change_pct": -0.10},
    {"symbol": "AUDCAD", "name": "Australian Dollar / Canadian Dollar", "asset_class": "forex", "base_currency": "AUD", "quote_currency": "CAD", "current_price": 0.9198, "daily_change_pct": 0.43},
    {"symbol": "AUDCHF", "name": "Australian Dollar / Swiss Franc", "asset_class": "forex", "base_currency": "AUD", "quote_currency": "CHF", "current_price": 0.5823, "daily_change_pct": 0.25},
    {"symbol": "AUDNZD", "name": "Australian Dollar / New Zealand Dollar", "asset_class": "forex", "base_currency": "AUD", "quote_currency": "NZD", "current_price": 1.1171, "daily_change_pct": 0.17},

    {"symbol": "NZDJPY", "name": "New Zealand Dollar / Japanese Yen", "asset_class": "forex", "base_currency": "NZD", "quote_currency": "JPY", "current_price": 90.00, "daily_change_pct": -0.27},
    {"symbol": "NZDCHF", "name": "New Zealand Dollar / Swiss Franc", "asset_class": "forex", "base_currency": "NZD", "quote_currency": "CHF", "current_price": 0.5212, "daily_change_pct": 0.08},
    {"symbol": "NZDCAD", "name": "New Zealand Dollar / Canadian Dollar", "asset_class": "forex", "base_currency": "NZD", "quote_currency": "CAD", "current_price": 0.8234, "daily_change_pct": 0.10},

    {"symbol": "CADJPY", "name": "Canadian Dollar / Japanese Yen", "asset_class": "forex", "base_currency": "CAD", "quote_currency": "JPY", "current_price": 109.30, "daily_change_pct": -0.53},
    {"symbol": "CADCHF", "name": "Canadian Dollar / Swiss Franc", "asset_class": "forex", "base_currency": "CAD", "quote_currency": "CHF", "current_price": 0.6330, "daily_change_pct": -0.18},
    {"symbol": "CHFJPY", "name": "Swiss Franc / Japanese Yen", "asset_class": "forex", "base_currency": "CHF", "quote_currency": "JPY", "current_price": 172.65, "daily_change_pct": -0.35},

    # EQUITY INDICES
    {"symbol": "SPX", "name": "S&P 500 Index", "asset_class": "index", "base_currency": "USD", "quote_currency": None, "current_price": 5980.50, "daily_change_pct": 0.45},
    {"symbol": "NDX", "name": "Nasdaq 100 Index", "asset_class": "index", "base_currency": "USD", "quote_currency": None, "current_price": 21120.25, "daily_change_pct": 0.62},
    {"symbol": "DJI", "name": "Dow Jones Industrial Average", "asset_class": "index", "base_currency": "USD", "quote_currency": None, "current_price": 43910.00, "daily_change_pct": 0.18},
    {"symbol": "RUT", "name": "Russell 2000 Index", "asset_class": "index", "base_currency": "USD", "quote_currency": None, "current_price": 2350.80, "daily_change_pct": 0.85},
    {"symbol": "DAX", "name": "German DAX 40", "asset_class": "index", "base_currency": "EUR", "quote_currency": None, "current_price": 19450.00, "daily_change_pct": -0.15},
    {"symbol": "CAC", "name": "French CAC 40", "asset_class": "index", "base_currency": "EUR", "quote_currency": None, "current_price": 7420.50, "daily_change_pct": -0.32},
    {"symbol": "FTSE", "name": "UK FTSE 100", "asset_class": "index", "base_currency": "GBP", "quote_currency": None, "current_price": 8280.10, "daily_change_pct": 0.10},
    {"symbol": "SX5E", "name": "Euro Stoxx 50", "asset_class": "index", "base_currency": "EUR", "quote_currency": None, "current_price": 4890.30, "daily_change_pct": -0.21},
    {"symbol": "N225", "name": "Nikkei 225", "asset_class": "index", "base_currency": "JPY", "quote_currency": None, "current_price": 38650.00, "daily_change_pct": 0.70},
    {"symbol": "HSI", "name": "Hang Seng Index", "asset_class": "index", "base_currency": "HKD", "quote_currency": None, "current_price": 20450.00, "daily_change_pct": 1.25},
    {"symbol": "ASX200", "name": "Australia ASX 200", "asset_class": "index", "base_currency": "AUD", "quote_currency": None, "current_price": 8340.00, "daily_change_pct": 0.38},

    # METALS
    {"symbol": "XAUUSD", "name": "Gold (Spot USD)", "asset_class": "metal", "base_currency": "XAU", "quote_currency": "USD", "current_price": 2745.80, "daily_change_pct": 0.82},
    {"symbol": "XAGUSD", "name": "Silver (Spot USD)", "asset_class": "metal", "base_currency": "XAG", "quote_currency": "USD", "current_price": 33.40, "daily_change_pct": 1.45},
    {"symbol": "XPTUSD", "name": "Platinum (Spot USD)", "asset_class": "metal", "base_currency": "XPT", "quote_currency": "USD", "current_price": 995.50, "daily_change_pct": 0.30},
    {"symbol": "XPDUSD", "name": "Palladium (Spot USD)", "asset_class": "metal", "base_currency": "XPD", "quote_currency": "USD", "current_price": 1045.00, "daily_change_pct": -0.65},

    # COMMODITIES
    {"symbol": "CL", "name": "WTI Crude Oil", "asset_class": "commodity", "base_currency": "USD", "quote_currency": None, "current_price": 71.85, "daily_change_pct": -0.92},
    {"symbol": "BZ", "name": "Brent Crude Oil", "asset_class": "commodity", "base_currency": "USD", "quote_currency": None, "current_price": 75.60, "daily_change_pct": -0.85},
    {"symbol": "NG", "name": "Natural Gas (Henry Hub)", "asset_class": "commodity", "base_currency": "USD", "quote_currency": None, "current_price": 2.85, "daily_change_pct": 2.15},
    {"symbol": "HG", "name": "Copper Futures", "asset_class": "commodity", "base_currency": "USD", "quote_currency": None, "current_price": 4.38, "daily_change_pct": 0.65},
    {"symbol": "ZW", "name": "Wheat Futures", "asset_class": "commodity", "base_currency": "USD", "quote_currency": None, "current_price": 570.25, "daily_change_pct": -0.35},
    {"symbol": "ZC", "name": "Corn Futures", "asset_class": "commodity", "base_currency": "USD", "quote_currency": None, "current_price": 428.50, "daily_change_pct": 0.12},
    {"symbol": "ZS", "name": "Soybeans Futures", "asset_class": "commodity", "base_currency": "USD", "quote_currency": None, "current_price": 1020.00, "daily_change_pct": -0.18},
]


# OFFICIAL SOURCES REGISTRY WITH RELIABILITY TIERS
DEFAULT_SOURCES = [
    # Tier 1: Official Primary Sources
    {"name": "Federal Reserve", "domain": "federalreserve.gov", "tier": 1, "reliability_score": 98.0, "source_type": "official", "feed_url": "https://www.federalreserve.gov/feeds/press_all.xml"},
    {"name": "European Central Bank", "domain": "ecb.europa.eu", "tier": 1, "reliability_score": 98.0, "source_type": "official", "feed_url": "https://www.ecb.europa.eu/rss/press.html"},
    {"name": "Bank of England", "domain": "bankofengland.co.uk", "tier": 1, "reliability_score": 98.0, "source_type": "official", "feed_url": "https://www.bankofengland.co.uk/rss/publications"},
    {"name": "Bank of Japan", "domain": "boj.or.jp", "tier": 1, "reliability_score": 98.0, "source_type": "official", "feed_url": "https://www.boj.or.jp/en/rss/whatsnew.xml"},
    {"name": "U.S. Bureau of Labor Statistics", "domain": "bls.gov", "tier": 1, "reliability_score": 99.0, "source_type": "official", "feed_url": "https://www.bls.gov/feed/bls_news.rss"},
    {"name": "U.S. Bureau of Economic Analysis", "domain": "bea.gov", "tier": 1, "reliability_score": 99.0, "source_type": "official", "feed_url": "https://www.bea.gov/rss/newsreleases.xml"},
    {"name": "Eurostat", "domain": "ec.europa.eu/eurostat", "tier": 1, "reliability_score": 98.0, "source_type": "official", "feed_url": "https://ec.europa.eu/eurostat/api/news"},
    {"name": "U.K. Office for National Statistics", "domain": "ons.gov.uk", "tier": 1, "reliability_score": 98.0, "source_type": "official", "feed_url": "https://www.ons.gov.uk/releasecalendar"},
    {"name": "Energy Information Administration", "domain": "eia.gov", "tier": 1, "reliability_score": 97.0, "source_type": "official", "feed_url": "https://www.eia.gov/rss/petroleum.xml"},

    # Tier 2: Reputable Financial Media & Primary Markets
    {"name": "Reuters Macro & Markets", "domain": "reuters.com", "tier": 2, "reliability_score": 90.0, "source_type": "media", "feed_url": "https://www.reutersagency.com/feed/?best-topics=business-finance&post_type=best"},
    {"name": "Financial Times", "domain": "ft.com", "tier": 2, "reliability_score": 91.0, "source_type": "media", "feed_url": "https://www.ft.com/rss/home/us"},
    {"name": "Bloomberg Markets", "domain": "bloomberg.com", "tier": 2, "reliability_score": 92.0, "source_type": "media", "feed_url": "https://feeds.bloomberg.com/markets/news.rss"},
    {"name": "Wall Street Journal Markets", "domain": "wsj.com", "tier": 2, "reliability_score": 90.0, "source_type": "media", "feed_url": "https://feeds.a.dj.com/rss/RSSMarketsMain.xml"},

    # Tier 2/3: Public Institutional Research
    {"name": "Goldman Sachs Global Investment Research", "domain": "goldmansachs.com", "tier": 2, "reliability_score": 88.0, "source_type": "institutional", "feed_url": "https://www.goldmansachs.com/insights/rss/index.xml"},
    {"name": "JPMorgan Global Research", "domain": "jpmorgan.com", "tier": 2, "reliability_score": 88.0, "source_type": "institutional", "feed_url": "https://www.jpmorgan.com/insights/rss"},
    {"name": "Morgan Stanley Research", "domain": "morganstanley.com", "tier": 2, "reliability_score": 87.0, "source_type": "institutional", "feed_url": "https://www.morganstanley.com/ideas/rss"},
    {"name": "UBS Global Wealth Management", "domain": "ubs.com", "tier": 2, "reliability_score": 87.0, "source_type": "institutional", "feed_url": "https://www.ubs.com/global/en/wealth-management/insights/rss.xml"},

    # Tier 4: Specialist / Commodity Intelligence
    {"name": "OPEC Secretariat", "domain": "opec.org", "tier": 4, "reliability_score": 85.0, "source_type": "specialist", "feed_url": "https://www.opec.org/opec_web/en/press_room/28.htm"},
    {"name": "World Gold Council", "domain": "gold.org", "tier": 4, "reliability_score": 86.0, "source_type": "specialist", "feed_url": "https://www.gold.org/rss.xml"},
]
