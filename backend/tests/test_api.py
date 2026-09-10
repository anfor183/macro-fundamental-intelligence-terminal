"""Integration tests for FastAPI REST endpoints."""

import pytest
import pytest_asyncio
from httpx import AsyncClient, ASGITransport
from backend.app.main import app
from backend.app.core.seeder import seed_database


@pytest_asyncio.fixture(autouse=True)
async def init_test_db():
    await seed_database()


@pytest.mark.asyncio
async def test_root_endpoint():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        res = await ac.get("/api/v1/info")
        assert res.status_code == 200
        data = res.json()
        assert data["status"] == "OPERATIONAL"
        assert "Automated Macro Fundamental Intelligence Platform" in data["platform"]


@pytest.mark.asyncio
async def test_get_macro_regime():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        res = await ac.get("/api/v1/macro/regime")
        assert res.status_code == 200
        data = res.json()
        assert "primary_regime" in data
        assert "active_regimes" in data


@pytest.mark.asyncio
async def test_get_assets_list():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        res = await ac.get("/api/v1/assets")
        assert res.status_code == 200
        assets = res.json()
        assert len(assets) >= 50
        symbols = [a["symbol"] for a in assets]
        assert "EURUSD" in symbols
        assert "XAUUSD" in symbols
        assert "CL" in symbols
        assert "SPX" in symbols


@pytest.mark.asyncio
async def test_get_asset_detail_eurusd():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        res = await ac.get("/api/v1/assets/EURUSD")
        assert res.status_code == 200
        data = res.json()
        assert data["symbol"] == "EURUSD"
        assert "tactical_bias" in data
        assert "score" in data
        assert "confidence" in data
        assert len(data["bullish_factors"]) > 0
        assert len(data["invalidation_conditions"]) > 0
        assert "explanation" in data


@pytest.mark.asyncio
async def test_currency_matrix_and_forex_rankings():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        m_res = await ac.get("/api/v1/currencies/matrix")
        assert m_res.status_code == 200
        matrix = m_res.json()
        assert len(matrix) >= 11
        
        r_res = await ac.get("/api/v1/forex/rankings")
        assert r_res.status_code == 200
        rankings = r_res.json()
        assert len(rankings) > 0
        assert "conviction_score" in rankings[0]


@pytest.mark.asyncio
async def test_specialized_dashboards():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        g_res = await ac.get("/api/v1/specialized/gold")
        assert g_res.status_code == 200
        assert g_res.json()["symbol"] == "XAUUSD"
        
        o_res = await ac.get("/api/v1/specialized/oil")
        assert o_res.status_code == 200
        assert o_res.json()["symbol"] == "CL"


@pytest.mark.asyncio
async def test_backtest_endpoint():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        res = await ac.get("/api/v1/backtest?symbol=EURUSD&holding_days=5")
        assert res.status_code == 200
        data = res.json()
        assert "metrics" in data
        assert data["metrics"]["directional_accuracy_pct"] > 50.0


@pytest.mark.asyncio
async def test_regime_signals_history_endpoint():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        # 1. Full history
        res = await ac.get("/api/v1/regime-signals/history?limit=100")
        assert res.status_code == 200
        data = res.json()
        assert data["total_signals"] > 0
        assert data["hit_rate_pct"] > 0
        assert len(data["signals"]) <= 100
        first = data["signals"][0]
        assert "date" in first
        assert "symbol" in first
        assert first["signal_type"] in ("REVERSAL", "CONTINUATION", "PULLBACK_EXHAUSTION")
        assert first["outcome"] in ("WIN", "LOSS")
        assert "entry_price" in first
        assert "exit_price" in first
        assert "forward_return_pct" in first

        # 2. Filter by symbol
        res_eur = await ac.get("/api/v1/regime-signals/history?symbol=EURUSD&limit=50")
        assert res_eur.status_code == 200
        data_eur = res_eur.json()
        assert all(s["symbol"] == "EURUSD" for s in data_eur["signals"])

        # 3. Filter by signal_type and outcome
        res_rev_win = await ac.get("/api/v1/regime-signals/history?signal_type=REVERSAL&outcome=WIN&limit=20")
        assert res_rev_win.status_code == 200
        data_rev_win = res_rev_win.json()
        assert all(s["signal_type"] == "REVERSAL" for s in data_rev_win["signals"])
        assert all(s["outcome"] == "WIN" for s in data_rev_win["signals"])

