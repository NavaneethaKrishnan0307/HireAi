import pytest
from backend.services.rule_engine import RuleEngine
from backend.services.candidate_ranker import CandidateRanker

def test_star_bullet_transformer():
    # Test weak line transformation
    raw = "worked on backend services for payment gateway"
    res = RuleEngine.transform_to_star_bullets(raw)
    
    assert res["detected_passive_pattern"] == "worked on"
    assert "payment gateway" in res["extracted_task_scope"]
    assert len(res["variations"]) == 3
    for var in res["variations"]:
        assert "star_bullet" in var
        assert "metric_result" in var
        assert "situation_task" in var

def test_interview_question_generation():
    candidate = {
        "parsed_skills": ["Python", "Django"],
        "years_of_experience": 4.0,
        "education": "B.Tech Computer Science"
    }
    job = {
        "title": "Backend Lead",
        "required_skills": ["Python", "FastAPI", "Docker", "Kubernetes"],
        "min_experience": 3.0
    }
    missing_skills = ["FastAPI", "Docker", "Kubernetes"]
    
    questions = RuleEngine.generate_interview_questions(candidate, job, missing_skills)
    assert len(questions) == 5
    categories = [q["category"] for q in questions]
    assert "SKILL_GAP_TRANSITION" in categories
    assert "ARCHITECTURE_SCALE" in categories
    assert "BEHAVIORAL_DELIVERY" in categories
    for q in questions:
        assert "interviewer_rubric" in q
        assert len(q["interviewer_rubric"]) > 0

def test_proof_trace_derivation():
    candidate = {
        "parsed_skills": ["Python", "SQL", "Docker"],
        "years_of_experience": 3.0,
        "education": "B.Tech"
    }
    job = {
        "title": "Software Engineer",
        "required_skills": ["Python", "SQL", "AWS"],
        "min_experience": 2.0,
        "education_required": "B.Tech"
    }
    
    match_eval = CandidateRanker.calculate_candidate_match(candidate, job)
    assert "proof_trace" in match_eval
    proof = match_eval["proof_trace"]
    assert "mathematical_formula" in proof
    assert len(proof["derivation_steps"]) == 6
    assert proof["composite_score"] == match_eval["overall_score"]

def test_heuristic_simulator_delta():
    candidate = {
        "parsed_skills": ["Python"],
        "years_of_experience": 1.0,
        "education": "B.Tech"
    }
    job = {
        "title": "Senior Python Developer",
        "required_skills": ["Python", "FastAPI", "Docker", "Kubernetes"],
        "min_experience": 4.0,
        "education_required": "B.Tech"
    }
    
    base_eval = CandidateRanker.calculate_candidate_match(candidate, job)
    
    # Simulate adding FastAPI, Docker, Kubernetes and gaining 3 years experience
    hypo_cand = dict(candidate)
    hypo_cand["parsed_skills"] = ["Python", "FastAPI", "Docker", "Kubernetes"]
    hypo_cand["years_of_experience"] = 4.5
    
    hypo_eval = CandidateRanker.calculate_candidate_match(hypo_cand, job)
    delta = hypo_eval["overall_score"] - base_eval["overall_score"]
    
    assert delta > 30.0  # Significant jump after bridging all missing skills and experience gap
    assert hypo_eval["overall_score"] >= 90.0
