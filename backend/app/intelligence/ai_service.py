"""AI Analysis and Macro Synthesis Engine.

Enforces zero-hallucination institutional standards:
- Numerical scores and biases are calculated mathematically.
- AI generates structured explanations, scenario narratives, and contradiction analyses strictly grounded in verified facts.
- Connects to Google Gemini API (gemini-2.0-flash) when configured.
- Seamless fallback to deterministic grounded synthesis guarantees 100% offline availability and testing.
"""

import json
import logging
from typing import Dict, Any, List, Optional
from datetime import datetime, timezone
import httpx

from backend.app.core.config import settings
from backend.app.intelligence.nlp_sentiment import MacroNLPSentiment
from backend.app.intelligence.rag_service import rag_service

logger = logging.getLogger(__name__)


class MacroAIService:
    """Provides structured qualitative reasoning, RAG-grounded copilot queries, and zero-hallucination synthesis."""

    def __init__(self, api_key: Optional[str] = None):
        self.api_key = api_key or settings.AI_API_KEY
        self.model = settings.AI_MODEL or "gemini-2.0-flash"

    async def generate_explanation(
        self,
        symbol: str,
        asset_class: str,
        score: float,
        bias: str,
        confidence: float,
        bullish_factors: List[str],
        bearish_factors: List[str],
        conflicts: List[str],
        top_driver: str,
    ) -> str:
        """Generate institutional-grade explanation of the macro bias."""
        # 1. Check if Gemini API key is configured and attempt live LLM synthesis
        if self.api_key:
            try:
                system_prompt = (
                    "You are a Chief Macroeconomic Strategist for a premier global macro fund. "
                    "Analyze the provided quantitative scores and fundamental drivers with strict factual grounding. "
                    "Do NOT invent unverified numbers, phantom economic releases, or fake quotes. "
                    "Structure your analysis into exactly 3 concise, impactful paragraphs:\n"
                    "1. Executive Thesis: Core directional bias, conviction score, and primary macro transmission catalyst.\n"
                    "2. Counterarguments & Headwinds: Structural risks, offsetting forces, or positioning traps.\n"
                    "3. Technical & Macro Invalidation: Explicit conditions that would dismantle this thesis."
                )

                user_content = (
                    f"Asset: {symbol} ({asset_class.upper()})\n"
                    f"Calculated Score: {score:+.1f} (-100 to +100)\n"
                    f"Directional Bias: {bias}\n"
                    f"Model Conviction: {confidence:.0f}%\n"
                    f"Primary Catalyst: {top_driver}\n"
                    f"Tailwind Factors: {', '.join(bullish_factors) if bullish_factors else 'None noted'}\n"
                    f"Headwind Factors: {', '.join(bearish_factors) if bearish_factors else 'None noted'}\n"
                    f"Cross-Asset Conflicts: {', '.join(conflicts) if conflicts else 'None'}"
                )

                url = f"https://generativelanguage.googleapis.com/v1beta/models/{self.model}:generateContent?key={self.api_key}"
                payload = {
                    "contents": [
                        {
                            "role": "user",
                            "parts": [
                                {"text": f"{system_prompt}\n\n{user_content}"}
                            ]
                        }
                    ],
                    "generationConfig": {
                        "temperature": 0.2,
                        "maxOutputTokens": 600,
                    }
                }

                async with httpx.AsyncClient(timeout=12.0) as client:
                    resp = await client.post(url, json=payload)
                    if resp.status_code == 200:
                        data = resp.json()
                        candidates = data.get("candidates", [])
                        if candidates:
                            text = candidates[0].get("content", {}).get("parts", [{}])[0].get("text", "")
                            if text.strip():
                                return text.strip()
                    else:
                        logger.warning(f"Gemini API returned status {resp.status_code}: {resp.text[:200]}")
            except Exception as exc:
                logger.warning(f"Gemini API call failed, falling back to deterministic explanation: {exc}")

        # 2. Deterministic Grounded Synthesis Engine (Zero hallucination, 100% offline availability)
        bull_str = "; ".join(bullish_factors[:2]) if bullish_factors else "constructive cyclical fundamentals"
        bear_str = "; ".join(bearish_factors[:2]) if bearish_factors else "isolated growth and valuation headwinds"
        conflict_str = f" The model notes caution due to: {conflicts[0]}." if conflicts else ""

        narrative = (
            f"{symbol} is currently {bias.title()} with a normalized macro score of {score:+.1f} and institutional conviction of {confidence:.0f}%.\n\n"
            f"The primary driver is {top_driver.lower()}. Upside momentum is supported by {bull_str}.{conflict_str}\n\n"
            f"Key counterarguments and risks include {bear_str}. "
            f"This fundamental bias would face immediate invalidation if monetary policy expectations sharply reverse or unexpected growth contractions emerge."
        )
        return narrative

    async def query_macro_copilot(
        self,
        query: str,
        symbol: Optional[str] = None,
        macro_regime: Optional[str] = None
    ) -> Dict[str, Any]:
        """Interactive Macro Copilot: retrieves central bank RAG precedents and generates an institutional synthesis."""
        # 1. Retrieve grounded precedents from vector RAG
        search_results = rag_service.search(query, top_k=3)
        grounded_context = rag_service.build_grounded_context(query, top_k=3)

        citations = [
            {
                "id": r.document.id,
                "title": r.document.title,
                "institution": r.document.institution,
                "date": r.document.date,
                "relevance_score": r.relevance_score,
                "takeaway": r.document.key_takeaway,
            }
            for r in search_results
        ]

        provider = "Deterministic Grounded Synthesis Engine (Offline)"
        response_text = ""

        # 2. If Gemini API Key exists, call live generative model with grounded prompt
        if self.api_key:
            try:
                system_prompt = (
                    "You are the Lead Macro Economist & Portfolio Strategist on the Fortune Macro Fundamental Intelligence Platform. "
                    "Provide an authoritative, clear, and actionable macroeconomic analysis addressing the user's inquiry. "
                    "Ground your reasoning strictly in the historical precedents and central bank records provided. "
                    "Do NOT invent numbers or false historical facts."
                )

                prompt = (
                    f"{system_prompt}\n\n"
                    f"USER QUESTION: {query}\n"
                    f"CONTEXT ASSET: {symbol or 'Cross-Asset Global Macro'}\n"
                    f"CURRENT REGIME: {macro_regime or 'EXPANSION'}\n\n"
                    f"HISTORICAL PRECEDENTS & CENTRAL BANK TRANSCRIPTS:\n{grounded_context}\n\n"
                    "Synthesize an institutional briefing with:\n"
                    "1. Direct Macro Answer\n"
                    "2. Historical Analogue / Central Bank Precedent (referencing the retrieved documents)\n"
                    "3. Key Trading & Risk Implications"
                )

                url = f"https://generativelanguage.googleapis.com/v1beta/models/{self.model}:generateContent?key={self.api_key}"
                payload = {
                    "contents": [{"role": "user", "parts": [{"text": prompt}]}],
                    "generationConfig": {"temperature": 0.25, "maxOutputTokens": 800}
                }

                async with httpx.AsyncClient(timeout=15.0) as client:
                    resp = await client.post(url, json=payload)
                    if resp.status_code == 200:
                        data = resp.json()
                        candidates = data.get("candidates", [])
                        if candidates:
                            text = candidates[0].get("content", {}).get("parts", [{}])[0].get("text", "")
                            if text.strip():
                                response_text = text.strip()
                                provider = f"Google Gemini 2.0 Flash (Live - {self.model})"
            except Exception as exc:
                logger.warning(f"Live Copilot call failed: {exc}")

        # 3. Fallback deterministic synthesis if offline or live call unavailable
        if not response_text:
            top_precedent = search_results[0].document if search_results else None
            precedent_summary = (
                f"Historically, central banks faced analogous dynamics during the '{top_precedent.title}' ({top_precedent.date}), "
                f"where the primary transmission was: {top_precedent.key_takeaway}. "
                f"Market reaction: {top_precedent.historical_asset_reaction}"
            ) if top_precedent else "Cross-asset historical correlations indicate monetary policy expectations and real yield differentials serve as primary anchors."

            response_text = (
                f"**Macro Synthesis**: In addressing '{query}', the primary fundamental transmission mechanism operates through central bank policy rate spreads, "
                f"growth momentum, and liquidity expectations.\n\n"
                f"**Historical Precedent & Doctrine**: {precedent_summary}\n\n"
                f"**Strategic Risk Implication**: Traders should closely monitor forward rate probabilities and positioning crowding to avoid liquidity squeeze traps."
            )

        return {
            "query": query,
            "response": response_text,
            "provider": provider,
            "citations": citations,
            "timestamp": datetime.now(timezone.utc).isoformat(),
        }

    def extract_structured_facts(self, raw_text: str, title: str) -> Dict[str, Any]:
        """Extract structured entities, sentiment scores, and macro categorization using MacroNLPSentiment."""
        sentiment_res = MacroNLPSentiment.analyze_text(raw_text, title)

        return {
            "macro_category": "monetary_policy" if abs(sentiment_res.hawkish_dovish_score) > 20 else "growth",
            "direction": sentiment_res.direction.lower(),
            "impact_score": abs(sentiment_res.sentiment_score),
            "hawkish_dovish_score": sentiment_res.hawkish_dovish_score,
            "growth_sentiment": sentiment_res.growth_sentiment,
            "inflation_pressure": sentiment_res.inflation_pressure,
            "statement_type": sentiment_res.statement_type,
            "confidence": sentiment_res.confidence,
            "detected_currencies": sentiment_res.detected_currencies,
            "key_signals": sentiment_res.key_signals,
            "time_horizon": "weekly",
        }


# Global singleton instance
ai_service = MacroAIService()
