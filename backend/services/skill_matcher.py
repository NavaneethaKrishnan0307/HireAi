from typing import List, Dict, Any, Set

class SkillMatcher:
    """
    Deterministic rule-based skill comparison and taxonomy matching engine.
    """

    # Skill alias normalization mapping (e.g. JS -> JavaScript, Postgres -> PostgreSQL)
    SKILL_ALIASES = {
        "js": "javascript",
        "react.js": "react",
        "reactjs": "react",
        "node": "node.js",
        "nodejs": "node.js",
        "postgres": "postgresql",
        "psql": "postgresql",
        "py": "python",
        "aws cloud": "aws",
        "amazon web services": "aws",
        "k8s": "kubernetes",
        "spring boot": "spring",
        "golang": "go"
    }

    @classmethod
    def normalize_skill(cls, skill: str) -> str:
        """Normalize a skill string for accurate comparison."""
        cleaned = skill.strip().lower()
        return cls.SKILL_ALIASES.get(cleaned, cleaned)

    @classmethod
    def match_skills(
        cls,
        candidate_skills: List[str],
        required_skills: List[str],
        preferred_skills: Optional[List[str]] = None
    ) -> Dict[str, Any]:
        """
        Compare candidate skills with required and preferred job skills.
        Returns:
            score: percentage (0-100)
            matched_skills: list of matched required skills
            missing_skills: list of missing required skills
            matched_preferred: list of matched preferred skills
            explanation: human-readable explanation
        """
        if preferred_skills is None:
            preferred_skills = []

        cand_norm_map = {cls.normalize_skill(s): s for s in candidate_skills}
        cand_norm_set = set(cand_norm_map.keys())

        matched_req = []
        missing_req = []

        for req in required_skills:
            norm_req = cls.normalize_skill(req)
            if norm_req in cand_norm_set:
                matched_req.append(req)
            else:
                missing_req.append(req)

        matched_pref = []
        for pref in preferred_skills:
            norm_pref = cls.normalize_skill(pref)
            if norm_pref in cand_norm_set:
                matched_pref.append(pref)

        total_req = len(required_skills)
        if total_req == 0:
            skill_score = 100.0
            explanation = "No specific skills required."
        else:
            base_ratio = len(matched_req) / total_req
            # Bonus for preferred skills (up to 10% boost capped at 100%)
            pref_bonus = (len(matched_pref) / max(len(preferred_skills), 1)) * 0.1 if preferred_skills else 0.0
            skill_score = round(min((base_ratio * 0.9 + pref_bonus * 1.0) * 100.0 if preferred_skills else base_ratio * 100.0, 100.0), 1)
            explanation = f"{len(matched_req)} of {total_req} required skills matched ({len(matched_pref)} preferred skills matched)"

        return {
            "score": skill_score,
            "matched_skills": matched_req,
            "missing_skills": missing_req,
            "matched_preferred": matched_pref,
            "explanation": explanation
        }
