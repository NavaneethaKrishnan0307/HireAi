from typing import List, Dict, Any, Optional
from backend.services.skill_matcher import SkillMatcher
from backend.services.rule_engine import RuleEngine

class CandidateRanker:
    """
    Deterministic rule-based multi-criteria candidate ranker and scoring engine.
    Supports default and custom dynamic weights per job requisition or recruiter query:
        - Skill Match: default 50%
        - Experience: default 25%
        - Education: default 15%
        - Additional/Certifications: default 10%
    """

    DEFAULT_WEIGHTS = {
        "skills": 0.50,
        "experience": 0.25,
        "education": 0.15,
        "additional": 0.10
    }

    @classmethod
    def normalize_weights(cls, custom_weights: Optional[Dict[str, float]] = None) -> Dict[str, float]:
        """Normalize user-defined weights so they sum precisely to 1.0."""
        if not custom_weights:
            return dict(cls.DEFAULT_WEIGHTS)
        
        w_skills = max(0.0, float(custom_weights.get("skills", cls.DEFAULT_WEIGHTS["skills"])))
        w_exp = max(0.0, float(custom_weights.get("experience", cls.DEFAULT_WEIGHTS["experience"])))
        w_edu = max(0.0, float(custom_weights.get("education", cls.DEFAULT_WEIGHTS["education"])))
        w_add = max(0.0, float(custom_weights.get("additional", cls.DEFAULT_WEIGHTS["additional"])))

        total = w_skills + w_exp + w_edu + w_add
        if total <= 0:
            return dict(cls.DEFAULT_WEIGHTS)

        return {
            "skills": round(w_skills / total, 3),
            "experience": round(w_exp / total, 3),
            "education": round(w_edu / total, 3),
            "additional": round(w_add / total, 3)
        }

    @classmethod
    def calculate_candidate_match(
        cls,
        candidate_data: Dict[str, Any],
        job_data: Dict[str, Any],
        custom_weights: Optional[Dict[str, float]] = None
    ) -> Dict[str, Any]:
        """
        Evaluate a candidate profile against a job specification with dynamic weights.
        Returns explainable score breakdown and decision log.
        """
        weights = cls.normalize_weights(custom_weights)

        cand_skills = candidate_data.get("parsed_skills", []) or []
        cand_exp = float(candidate_data.get("years_of_experience", 0.0) or 0.0)
        cand_edu = str(candidate_data.get("education", "") or "")

        job_req_skills = job_data.get("required_skills", []) or []
        job_pref_skills = job_data.get("preferred_skills", []) or []
        job_min_exp = float(job_data.get("min_experience", 0.0) or 0.0)
        job_edu_req = str(job_data.get("education_required", "") or "")
        job_certs = job_data.get("certifications_preferred", []) or []

        # 1. Skill evaluation
        skill_res = SkillMatcher.match_skills(cand_skills, job_req_skills, job_pref_skills)
        skill_score = skill_res["score"]

        # 2. Experience evaluation
        exp_res = RuleEngine.evaluate_experience(cand_exp, job_min_exp)
        exp_score = exp_res["score"]

        # 3. Education evaluation
        edu_res = RuleEngine.evaluate_education(cand_edu, job_edu_req)
        edu_score = edu_res["score"]

        # 4. Certifications / Additional evaluation
        cert_res = RuleEngine.evaluate_certifications(cand_skills, job_certs)
        cert_score = cert_res["score"]

        # Calculate final weighted composite score
        overall_score = round(
            (skill_score * weights["skills"]) +
            (exp_score * weights["experience"]) +
            (edu_score * weights["education"]) +
            (cert_score * weights["additional"]),
            1
        )

        # Assemble list of human-readable explainable statements
        explanations = []
        for s in skill_res["matched_skills"]:
            explanations.append(f"✓ {s} skill requirement matched")
        for s in skill_res["missing_skills"]:
            explanations.append(f"✗ {s} missing from profile skills")
        
        explanations.append(exp_res["explanation"])
        explanations.append(edu_res["explanation"])
        if job_certs:
            explanations.append(cert_res["explanation"])

        # Generate constructive Skill Gap Advice
        skill_gap_advice = cls.generate_skill_gap_advice(
            missing_skills=skill_res["missing_skills"],
            total_req_skills=len(job_req_skills),
            skill_weight=weights["skills"]
        )

        return {
            "overall_score": overall_score,
            "skill_score": skill_score,
            "experience_score": exp_score,
            "education_score": edu_score,
            "certifications_score": cert_score,
            "matched_skills": skill_res["matched_skills"],
            "missing_skills": skill_res["missing_skills"],
            "preferred_matches": skill_res["matched_preferred"],
            "applied_weights": weights,
            "skill_gap_advice": skill_gap_advice,
            "explanations": explanations,
            "rule_results": {
                "skill_rule": skill_res,
                "experience_rule": exp_res,
                "education_rule": edu_res,
                "certifications_rule": cert_res
            }
        }

    @classmethod
    def generate_skill_gap_advice(
        cls,
        missing_skills: List[str],
        total_req_skills: int,
        skill_weight: float
    ) -> List[Dict[str, Any]]:
        """Generate actionable advice showing score potential for missing skills."""
        if not missing_skills or total_req_skills <= 0:
            return []
        
        per_skill_gain = round((100.0 / total_req_skills) * skill_weight, 1)
        advice = []
        for skill in missing_skills:
            advice.append({
                "skill": skill,
                "potential_score_boost": per_skill_gain,
                "recommendation": f"Add or demonstrate proficiency in '{skill}' to boost overall score by ~+{per_skill_gain}%"
            })
        return advice

    @classmethod
    def rank_candidates(
        cls,
        candidates_list: List[Dict[str, Any]],
        job_data: Dict[str, Any],
        custom_weights: Optional[Dict[str, float]] = None
    ) -> List[Dict[str, Any]]:
        """
        Score and rank a list of candidate records against a job opening.
        """
        ranked = []
        for cand in candidates_list:
            match_details = cls.calculate_candidate_match(cand, job_data, custom_weights)
            item = dict(cand)
            item["match_details"] = match_details
            item["score"] = match_details["overall_score"]
            ranked.append(item)

        # Sort deterministically by overall_score descending, then by experience descending
        ranked.sort(
            key=lambda x: (x["score"], float(x.get("years_of_experience", 0))),
            reverse=True
        )

        for i, item in enumerate(ranked, start=1):
            item["rank"] = i

        return ranked
