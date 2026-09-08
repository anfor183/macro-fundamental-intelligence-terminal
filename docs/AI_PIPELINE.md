# AI Pipeline & Explainability Architecture

## 1. Zero-Hallucination Mandate
A core architectural principle of this platform is:
**"Never let the AI invent numerical scores, fake quotations, or hallucinated economic releases."**

- **Deterministic Quantitative Scoring**: The numerical macro scores (-100 to +100) and bias categories are calculated strictly by the deterministic mathematical engine in `backend/app/scoring/`.
- **Constrained Role of AI**: Language models and NLP parsers are restricted to:
  1. Extracting structured numbers (actual, consensus, previous) from raw text releases.
  2. Categorizing releases into one of the 14 macro dimensions.
  3. Generating grounded, human-readable explanations summarizing the mathematically calculated factor waterfall.
  4. Identifying narrative contradictions between central bank guidance and cyclical economic data.

---

## 2. Tiered Model Strategy
1. **Tier 1 (Fast Deterministic Parser)**: Regex, keyword heuristics, and entity extraction parser (`extract_structured_facts`). Guaranteed 100% offline uptime, zero cost, sub-millisecond latency.
2. **Tier 2 (Reasoning LLM Adapter)**: Optional LLM connector (e.g. Gemini 2.0 Flash / OpenAI) with strict Pydantic JSON schema output validation for deep synthesis. If external network or API key is absent, the system automatically falls back to deterministic grounded synthesis with zero downtime.

---

## 3. Structured Explanation Generation
For every asset, the explanation follows an institutional 3-paragraph structure:
- **Paragraph 1 (Thesis)**: Directional bias, score, and primary catalytic driver.
- **Paragraph 2 (Counterarguments)**: Factual headwinds and opposing factors.
- **Paragraph 3 (Invalidation)**: Specific measurable conditions that would dismantle the thesis.
