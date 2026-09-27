from typing import Dict, Any, List

class RuleEngine:
    """
    Explainable first-principles rule evaluation engine.
    Evaluates individual hiring criteria constraints and provides detailed step-by-step proofs.
    """

    @classmethod
    def evaluate_experience(cls, candidate_exp: float, required_exp: float) -> Dict[str, Any]:
        """
        Rule: Candidate experience vs Job minimum experience requirement.
        """
        if required_exp <= 0:
            return {
                "satisfied": True,
                "score": 100.0,
                "reason": "Entry-level position. No minimum experience required.",
                "explanation": "✓ Experience requirement satisfied (Entry level)"
            }

        if candidate_exp >= required_exp:
            ratio = min(candidate_exp / required_exp, 1.5)
            score = 100.0
            diff = candidate_exp - required_exp
            reason = f"Candidate has {candidate_exp} years vs required {required_exp} years (+{diff:.1f} yrs extra)."
            symbol = "✓"
        else:
            ratio = candidate_exp / required_exp
            score = round(ratio * 100.0, 1)
            diff = required_exp - candidate_exp
            reason = f"Candidate has {candidate_exp} years vs required {required_exp} years ({diff:.1f} yrs short)."
            symbol = "✗"

        return {
            "satisfied": candidate_exp >= required_exp,
            "score": score,
            "reason": reason,
            "explanation": f"{symbol} Experience requirement: {candidate_exp} yrs (Required: {required_exp} yrs)"
        }

    @classmethod
    def evaluate_education(cls, candidate_edu: str, required_edu: str) -> Dict[str, Any]:
        """
        Rule: Candidate education qualification vs required education level.
        """
        if not required_edu or required_edu.lower() in ["any graduate", "any", "not specified"]:
            return {
                "satisfied": True,
                "score": 100.0,
                "reason": "Any graduate degree is accepted.",
                "explanation": "✓ Education requirement satisfied (Any Graduate)"
            }

        candidate_lower = (candidate_edu or "").lower()
        required_lower = required_edu.lower()

        # Check degree level hierarchy: Ph.D > Master/M.Tech/MCA/MBA > Bachelor/B.Tech/B.E.
        high_degrees = ["ph.d", "doctorate", "master", "m.tech", "mca", "ms", "mba"]
        bachelor_degrees = ["b.tech", "b.e", "bachelor", "bca", "b.sc", "graduate"]

        is_high_candidate = any(d in candidate_lower for d in high_degrees)
        is_bachelor_candidate = any(d in candidate_lower for d in bachelor_degrees)
        
        req_is_high = any(d in required_lower for d in high_degrees)

        if is_high_candidate:
            satisfied = True
            score = 100.0
        elif is_bachelor_candidate:
            if req_is_high:
                satisfied = False
                score = 75.0
            else:
                satisfied = True
                score = 100.0
        else:
            satisfied = len(candidate_lower) > 0
            score = 80.0 if satisfied else 50.0

        symbol = "✓" if satisfied else "✗"
        return {
            "satisfied": satisfied,
            "score": score,
            "reason": f"Candidate: '{candidate_edu or 'Not provided'}' vs Required: '{required_edu}'",
            "explanation": f"{symbol} Education criteria satisfied ({candidate_edu or 'Graduated'})"
        }

    @classmethod
    def evaluate_certifications(cls, candidate_skills: List[str], preferred_certs: List[str]) -> Dict[str, Any]:
        """
        Rule: Match preferred or required professional certifications.
        """
        if not preferred_certs:
            return {
                "satisfied": True,
                "score": 100.0,
                "matched_certs": [],
                "explanation": "✓ Certifications: Optional criteria satisfied"
            }

        cand_text = " ".join(candidate_skills).lower()
        matched = []
        for cert in preferred_certs:
            if cert.lower() in cand_text or any(part.lower() in cand_text for part in cert.split()):
                matched.append(cert)

        if len(matched) == len(preferred_certs):
            score = 100.0
            symbol = "✓"
        elif len(matched) > 0:
            score = round((len(matched) / len(preferred_certs)) * 100.0, 1)
            symbol = "✓"
        else:
            score = 50.0
            symbol = "ℹ"

        return {
            "satisfied": len(matched) > 0,
            "score": score,
            "matched_certs": matched,
            "explanation": f"{symbol} Certifications: {len(matched)} of {len(preferred_certs)} matched ({', '.join(matched) if matched else 'None'})"
        }
