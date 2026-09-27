from typing import List, Dict, Any, Optional
from backend.services.skill_matcher import SkillMatcher
from backend.services.rule_engine import RuleEngine

class CandidateRanker:
    """
    Deterministic rule-based multi-criteria candidate ranker and scoring engine.
    Weights:
        - Skill Match: 50%
        - Experience: 25%
        - Education: 15%
        - Additional/Certifications: 10%
    """

    WEIGHT_SKILLS = 0.50
    WEIGHT_EXPERIENCE = 0.25
    WEIGHT_EDUCATION = 0.15
    WEIGHT_ADDITIONAL = 0.10

    @classmethod
    def calculate_candidate_match(
        cls,
        candidate_data: Dict[str, Any],
        job_data: Dict[str, Any]
    ) -> Dict[str, Any]:
        """
        Evaluate a candidate profile against a job specification.
        Returns explainable score breakdown and decision log.
        """
        cand_skills = candidate_data.get("parsed_skills", []) or []
        cand_exp = float(candidate_data.get("years_of_experience", 0.0) or 0.0)
        cand_edu = str(candidate_data.get("education", "") or "")

        job_req_skills = job_data.get("required_skills", []) or []
        job_pref_skills = job_data.get("preferred_skills", []) or []
        job_min_exp = float(job_data.get("min_experience", 0.0) or 0.0)
        job_edu_req = str(job_data.get("education_required", "") or "")
        job_certs = job_data.get("certifications_preferred", []) or []

        # 1. Skill evaluation (50%)
        skill_res = SkillMatcher.match_skills(cand_skills, job_req_skills, job_pref_skills)
        skill_score = skill_res["score"]

        # 2. Experience evaluation (25%)
        exp_res = RuleEngine.evaluate_experience(cand_exp, job_min_exp)
        exp_score = exp_res["score"]

        # 3. Education evaluation (15%)
        edu_res = RuleEngine.evaluate_education(cand_edu, job_edu_req)
        edu_score = edu_res["score"]

        # 4. Certifications / Additional evaluation (10%)
        cert_res = RuleEngine.evaluate_certifications(cand_skills, job_certs)
        cert_score = cert_res["score"]

        # Calculate final weighted composite score
        overall_score = round(
            (skill_score * cls.WEIGHT_SKILLS) +
            (exp_score * cls.WEIGHT_EXPERIENCE) +
            (edu_score * cls.WEIGHT_EDUCATION) +
            (cert_score * cls.WEIGHT_ADDITIONAL),
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

        return {
            "overall_score": overall_score,
            "skill_score": skill_score,
            "experience_score": exp_score,
            "education_score": edu_score,
            "certifications_score": cert_score,
            "matched_skills": skill_res["matched_skills"],
            "missing_skills": skill_res["missing_skills"],
            "preferred_matches": skill_res["matched_preferred"],
            "explanations": explanations,
            "rule_results": {
                "skill_rule": skill_res,
                "experience_rule": exp_res,
                "education_rule": edu_res,
                "certifications_rule": cert_res
            }
        }

    @classmethod
    def rank_candidates(
        cls,
        candidates_list: List[Dict[str, Any]],
        job_data: Dict[str, Any]
    ) -> List[Dict[str, Any]]:
        """
        Score and rank a list of candidate records against a job opening.
        """
        ranked = []
        for cand in candidates_list:
            match_details = cls.calculate_candidate_match(cand, job_data)
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
