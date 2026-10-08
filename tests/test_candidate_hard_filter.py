import pytest
from backend.api.hr import search_candidates
from backend.models.job import JobSearchQuery

def test_hard_filter_experience_3_to_5():
    """Verify that only candidates strictly within 3.0 to 5.0 years experience are returned."""
    mock_hr_user = {"sub": "f0eebc99-9c0b-4ef8-bb6d-6bb9bd380a01", "role": "hr"}
    query = JobSearchQuery(
        min_experience=3.0,
        max_experience=5.0
    )
    res = search_candidates(query=query, user=mock_hr_user)
    results = res["results"]
    assert len(results) > 0, "Expected at least 1 candidate matching 3-5 years"
    for cand in results:
        exp = float(cand.get("years_of_experience") or 0.0)
        assert 3.0 <= exp <= 5.0, f"Candidate {cand.get('id')} with {exp} years violated 3-5 exp filter"

def test_hard_filter_experience_and_education():
    """Verify compound filtering: experience 3-5 AND education B.Tech/B.E."""
    mock_hr_user = {"sub": "f0eebc99-9c0b-4ef8-bb6d-6bb9bd380a01", "role": "hr"}
    query = JobSearchQuery(
        min_experience=3.0,
        max_experience=5.0,
        education="B.Tech/B.E."
    )
    res = search_candidates(query=query, user=mock_hr_user)
    results = res["results"]
    assert len(results) >= 2, "Expected matching candidates with 3-5 years and B.Tech/B.E."
    for cand in results:
        exp = float(cand.get("years_of_experience") or 0.0)
        assert 3.0 <= exp <= 5.0
        edu = (cand.get("education") or "").lower()
        assert any(term in edu for term in ["b.tech", "b.e", "btech", "be"])

def test_hard_filter_location():
    """Verify location strictly excludes candidates outside Chennai."""
    mock_hr_user = {"sub": "f0eebc99-9c0b-4ef8-bb6d-6bb9bd380a01", "role": "hr"}
    query = JobSearchQuery(
        location="Chennai",
        min_experience=3.0,
        max_experience=5.0
    )
    res = search_candidates(query=query, user=mock_hr_user)
    results = res["results"]
    assert len(results) >= 1
    for cand in results:
        loc = (cand.get("location") or "").lower()
        assert "chennai" in loc, f"Candidate location '{loc}' violated Chennai filter"

def test_hard_filter_nonexistent_criteria_returns_empty():
    """Verify that impossible criteria returns 0 candidates instead of all candidates."""
    mock_hr_user = {"sub": "f0eebc99-9c0b-4ef8-bb6d-6bb9bd380a01", "role": "hr"}
    query = JobSearchQuery(
        skills="NonExistentSkillXYZ123",
        min_experience=15.0
    )
    res = search_candidates(query=query, user=mock_hr_user)
    assert res["total_results"] == 0
    assert len(res["results"]) == 0
