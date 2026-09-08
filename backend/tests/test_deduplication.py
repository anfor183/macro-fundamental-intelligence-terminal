"""Unit tests for content hashing and event clustering deduplication."""

from backend.app.processing.deduplicator import generate_content_hash, generate_cluster_id, normalize_text


def test_normalized_text_strips_punctuation_and_casing():
    t1 = "Fed signals: rates MAY remain high in 2026!"
    t2 = "fed signals rates may remain high in 2026"
    assert normalize_text(t1) == normalize_text(t2)


def test_identical_hash_for_minor_variations():
    h1 = generate_content_hash(
        title="U.S. CPI cools to 2.9% YoY",
        summary="Inflation cooled in January as energy and goods prices softened."
    )
    h2 = generate_content_hash(
        title="U.S. CPI cools to 2.9% YoY!",
        summary="Inflation cooled in January as energy and goods prices softened."
    )
    assert h1 == h2


def test_cluster_id_groups_syndicated_reporting():
    """Verify that multiple publishers reporting the same Fed rate event share the same cluster ID."""
    c1 = generate_cluster_id("Federal Reserve holds interest rates steady at 4.50%", "monetary_policy", "2026-09-08")
    c2 = generate_cluster_id("Fed maintains policy rate at 4.5% in September meeting", "monetary_policy", "2026-09-08")
    c3 = generate_cluster_id("Powell and FOMC hold rates unchanged", "monetary_policy", "2026-09-08")
    
    assert c1 == c2 == c3
