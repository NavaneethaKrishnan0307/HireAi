import pytest
from backend.services.skill_matcher import SkillMatcher
from backend.services.rule_engine import RuleEngine
from backend.services.candidate_ranker import CandidateRanker

def test_skill_matcher_exact_and_missing():
    candidate_skills = ["Python", "FastAPI", "SQL", "Git"]
    required_skills = ["Python", "SQL", "Docker"]
    preferred_skills = ["FastAPI"]

    res = SkillMatcher.match_skills(candidate_skills, required_skills, preferred_skills)
    assert "Python" in res["matched_skills"]
    assert "SQL" in res["matched_skills"]
    assert "Docker" in res["missing_skills"]
    assert "FastAPI" in res["matched_preferred"]
    assert res["score"] > 60

def test_rule_engine_experience():
    # Candidate with 4.5 years vs required 3.0 years
    sat = RuleEngine.evaluate_experience(4.5, 3.0)
    assert sat["satisfied"] is True
    assert sat["score"] == 100.0
    assert "✓" in sat["explanation"]

    # Candidate with 1.5 years vs required 3.0 years
    short = RuleEngine.evaluate_experience(1.5, 3.0)
    assert short["satisfied"] is False
    assert short["score"] == 50.0
    assert "✗" in short["explanation"]

def test_candidate_ranking_and_explanation():
    job = {
        "title": "Senior Python Developer",
        "required_skills": ["Python", "SQL", "AWS"],
        "preferred_skills": ["FastAPI", "Docker"],
        "min_experience": 3.0,
        "education_required": "B.Tech in Computer Science",
        "certifications_preferred": ["AWS"]
    }

    rahul = {
        "id": "1",
        "full_name": "Rahul Sharma",
        "parsed_skills": ["Python", "SQL", "AWS", "FastAPI", "Docker"],
        "years_of_experience": 4.5,
        "education": "B.Tech in Computer Science"
    }

    priya = {
        "id": "2",
        "full_name": "Priya Nair",
        "parsed_skills": ["Python", "Django", "SQL"],
        "years_of_experience": 3.8,
        "education": "B.E. in Information Technology"
    }

    match_rahul = CandidateRanker.calculate_candidate_match(rahul, job)
    assert match_rahul["overall_score"] >= 90
    assert len(match_rahul["explanations"]) >= 3

    ranked = CandidateRanker.rank_candidates([priya, rahul], job)
    assert ranked[0]["full_name"] == "Rahul Sharma"
    assert ranked[0]["rank"] == 1
    assert ranked[1]["rank"] == 2
