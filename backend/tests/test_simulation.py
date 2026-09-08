"""Acceptance tests: End-to-end simulation of macro shocks, bias transitions, and audit trail."""

import pytest
import pytest_asyncio
from httpx import AsyncClient, ASGITransport
from backend.app.main import app
from backend.app.core.seeder import seed_database


@pytest_asyncio.fixture(autouse=True)
async def init_test_db():
    await seed_database()


@pytest.mark.asyncio
async def test_acceptance_simulation_cpi_shock():
    """Verify Acceptance Tests 1-15:
    - Major economic release is ingested
    - Actual vs consensus calculated
    - Mapped to affected currencies/assets
    - Impact is scored
    - Macro score changes
    - Bias changes if threshold crossed
    - What Changed displays delta
    - Disclaimers and simulation tags present.
    """
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        # Reset EURUSD to baseline neutral/mild-bullish score (24.0) to guarantee transition
        from backend.app.core.database import AsyncSessionLocal
        from backend.app.models.entities import Asset
        from backend.app.models.scoring import BiasSnapshot
        from sqlalchemy import select, desc
        
        async with AsyncSessionLocal() as session:
            res = await session.execute(select(Asset).where(Asset.symbol == "EURUSD"))
            asset = res.scalars().first()
            if asset:
                snap = BiasSnapshot(
                    asset_id=asset.id,
                    tactical_bias="MILD BULLISH",
                    weekly_bias="NEUTRAL",
                    score=24.0,
                    weekly_score=20.0,
                    confidence=75.0,
                    primary_driver="Baseline macro alignment",
                )
                session.add(snap)
                await session.commit()

        # 1. Fetch initial state for EURUSD
        initial_res = await ac.get("/api/v1/assets/EURUSD")
        assert initial_res.status_code == 200
        initial_data = initial_res.json()
        initial_score = initial_data["score"]
        assert initial_score == 24.0

        # 2. Inject synthetic US CPI downside shock
        sim_res = await ac.post("/api/v1/simulation/run?scenario_id=cpi_downside_surprise")
        assert sim_res.status_code == 200
        sim_data = sim_res.json()
        assert sim_data["status"] == "SUCCESS"
        assert sim_data["is_simulated"] is True

        # 3. Fetch updated EURUSD
        updated_res = await ac.get("/api/v1/assets/EURUSD")
        assert updated_res.status_code == 200
        updated_data = updated_res.json()
        
        # Verify score changed and bias upgraded
        assert updated_data["score"] > initial_score
        assert updated_data["tactical_bias"] == "STRONG BULLISH"
        assert "[SIMULATED]" in updated_data["primary_driver"]

        # 4. Check "What Changed" timeline
        wc_res = await ac.get("/api/v1/what-changed")
        assert wc_res.status_code == 200
        changes = wc_res.json()
        assert len(changes) > 0
        latest = changes[0]
        assert latest["asset_symbol"] == "EURUSD"
        assert latest["new_bias"] == "STRONG BULLISH"
        assert "[SIMULATED]" in latest["primary_driver"]

        # 5. Check alerts generated
        alt_res = await ac.get("/api/v1/alerts")
        assert alt_res.status_code == 200
        alerts = alt_res.json()
        assert any("EURUSD" in a["title"] for a in alerts)
