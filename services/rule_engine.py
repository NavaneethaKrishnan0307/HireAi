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

    @classmethod
    def generate_interview_questions(
        cls,
        candidate_data: Dict[str, Any],
        job_data: Dict[str, Any],
        missing_skills: Optional[List[str]] = None
    ) -> List[Dict[str, Any]]:
        """
        Pure Classical Expert System: Production Rule-Based Interview Question Generator.
        Rules trigger on:
          - Missing critical skills (Gap verification)
          - Matched primary domain tools (Technical depth)
          - Experience maturity level (System architecture vs Problem solving)
          - Project metric claims (Authenticity verification)
        """
        cand_skills = candidate_data.get("parsed_skills", []) or []
        cand_exp = float(candidate_data.get("years_of_experience", 0.0) or 0.0)
        req_skills = job_data.get("required_skills", []) or []
        job_title = job_data.get("title", "Engineering Role")
        
        matched_skills = [s for s in req_skills if any(s.lower() == cs.lower() for cs in cand_skills)]
        missing_skills = missing_skills if missing_skills is not None else [s for s in req_skills if not any(s.lower() == cs.lower() for cs in cand_skills)]

        questions = []

        # Rule 1: Technical Depth on Core Matched Skill
        if matched_skills:
            primary_skill = matched_skills[0]
            questions.append({
                "category": "TECHNICAL_CORE",
                "badge": "Core Competency",
                "badge_color": "blue",
                "target_skill": primary_skill,
                "question": f"Can you detail your production experience with {primary_skill}? What were the key architectural trade-offs or performance considerations in your recent implementation?",
                "interviewer_rubric": f"Look for deep understanding of {primary_skill} best practices, concurrency, memory management, or error handling rather than just syntax knowledge."
            })

        # Rule 2: Skill Gap & Adaptability (Missing Skill)
        if missing_skills:
            gap_skill = missing_skills[0]
            questions.append({
                "category": "SKILL_GAP_TRANSITION",
                "badge": "Gap Bridge",
                "badge_color": "amber",
                "target_skill": gap_skill,
                "question": f"This position requires proficiency in {gap_skill}. How would you leverage your background in {', '.join(cand_skills[:2]) if cand_skills else 'software development'} to quickly bridge this gap and contribute to production code?",
                "interviewer_rubric": f"Assess candidate's ability to learn {gap_skill} quickly and apply foundational engineering concepts across frameworks."
            })

        # Rule 3: Experience Level & System Scaling Scenario
        if cand_exp >= 3.0:
            questions.append({
                "category": "ARCHITECTURE_SCALE",
                "badge": "System Design",
                "badge_color": "purple",
                "target_skill": "Distributed Systems & Scalability",
                "question": f"For a system handling high request throughput in {job_title}, how would you architect for zero-downtime deployments, caching, and database query optimization?",
                "interviewer_rubric": "Evaluate trade-offs between horizontal vs vertical scaling, caching layers (e.g. Redis), and database indexing strategies."
            })
        else:
            questions.append({
                "category": "PROBLEM_SOLVING",
                "badge": "Debugging & Foundations",
                "badge_color": "green",
                "target_skill": "Root Cause Analysis",
                "question": "Walk us through the most complex bug or performance bottleneck you encountered in a recent project. What was your step-by-step debugging methodology?",
                "interviewer_rubric": "Look for systematic isolation of root causes (logs, profiling, unit test reproduction) rather than trial-and-error guessing."
            })

        # Rule 4: Quantifiable Metric & Authenticity Validation
        questions.append({
            "category": "METRIC_VERIFICATION",
            "badge": "Impact Verification",
            "badge_color": "emerald",
            "target_skill": "Project Ownership",
            "question": "Choose a prominent achievement from your resume where you improved efficiency or solved a key problem. How did you measure success before and after your intervention?",
            "interviewer_rubric": "Verify that candidate genuinely understands the metrics (latency, percentage improvement, throughput) stated on their resume."
        })

        # Rule 5: Teamwork & Behavioral Delivery
        questions.append({
            "category": "BEHAVIORAL_DELIVERY",
            "badge": "Collaboration",
            "badge_color": "slate",
            "target_skill": "Agile Delivery",
            "question": "Describe a scenario where project specifications changed unexpectedly midway through development. How did you realign your priorities and communicate with stakeholders?",
            "interviewer_rubric": "Assess agility, constructive communication, and commitment to delivery without creating friction."
        })

        return questions

    @classmethod
    def generate_proof_trace(
        cls,
        candidate_data: Dict[str, Any],
        job_data: Dict[str, Any],
        match_result: Dict[str, Any]
    ) -> Dict[str, Any]:
        """
        Pure Classical Explainable AI: Construct deterministic proof tree and logical derivation trace.
        """
        weights = match_result.get("applied_weights", {})
        w_skill = weights.get("skills", 0.50)
        w_exp = weights.get("experience", 0.25)
        w_edu = weights.get("education", 0.15)
        w_cert = weights.get("additional", 0.10)

        skill_score = match_result.get("skill_score", 0.0)
        exp_score = match_result.get("experience_score", 0.0)
        edu_score = match_result.get("education_score", 0.0)
        cert_score = match_result.get("certifications_score", 0.0)
        overall_score = match_result.get("overall_score", 0.0)

        nodes = [
            {
                "step": 1,
                "name": "Feature Extraction Vector",
                "logic": f"Candidate(Skills={len(candidate_data.get('parsed_skills', []))}, Exp={candidate_data.get('years_of_experience', 0)} yrs, Edu='{candidate_data.get('education', 'Graduate')}')",
                "status": "PASS"
            },
            {
                "step": 2,
                "name": "Skill Rule Evaluation",
                "logic": f"S_skill = ({len(match_result.get('matched_skills', []))} matched / {max(1, len(job_data.get('required_skills', [])))} required) * 100 = {skill_score}%",
                "status": "PASS" if skill_score >= 50 else "WARNING"
            },
            {
                "step": 3,
                "name": "Experience Constraint Rule",
                "logic": f"S_exp = evaluate_experience({candidate_data.get('years_of_experience', 0)} yrs, min_required={job_data.get('min_experience', 0)} yrs) = {exp_score}%",
                "status": "PASS" if exp_score >= 70 else "WARNING"
            },
            {
                "step": 4,
                "name": "Education Hierarchy Check",
                "logic": f"S_edu = evaluate_education('{candidate_data.get('education', '')}', required='{job_data.get('education_required', '')}') = {edu_score}%",
                "status": "PASS"
            },
            {
                "step": 5,
                "name": "Domain Alignment Constraint Check",
                "logic": f"DomainMismatch = {match_result.get('is_domain_mismatch', False)} -> Verdict: '{match_result.get('domain_status', 'Direct Domain Fit')}'",
                "status": "FAIL" if match_result.get("is_domain_mismatch") else "PASS"
            },
            {
                "step": 6,
                "name": "Multi-Criteria Composite Utility Function",
                "logic": f"Overall = ({w_skill} * {skill_score}) + ({w_exp} * {exp_score}) + ({w_edu} * {edu_score}) + ({w_cert} * {cert_score}) = {overall_score}%",
                "status": "FINAL_RESULT"
            }
        ]

        return {
            "mathematical_formula": "Utility(C, J) = w_skill*S_skill + w_exp*S_exp + w_edu*S_edu + w_cert*S_cert",
            "composite_score": overall_score,
            "derivation_steps": nodes,
            "decision_verdict": match_result.get("domain_status", "Compatible")
        }

    @classmethod
    def transform_to_star_bullets(cls, raw_bullet: str) -> Dict[str, Any]:
        """
        Pure Classical FOAI: Context-Free Grammar (CFG) & Production Rule STAR Transformer.
        Converts passive/weak bullet points into high-impact STAR power templates:
        Production Rule: STAR_Bullet -> [Action_Verb] + [Task_Scope/System] + [Method/Tech] + [Quantifiable_Metric]
        """
        clean_text = raw_bullet.strip().lstrip("•-* \t")
        if not clean_text:
            clean_text = "worked on software application features"

        # Detect passive patterns
        passive_triggers = [
            "worked on", "responsible for", "helped with", "handled", 
            "assisted with", "did", "made", "fixed", "participated in",
            "supported", "involved in", "tasks included"
        ]
        
        detected_passive = None
        lower_text = clean_text.lower()
        for trigger in passive_triggers:
            if lower_text.startswith(trigger):
                detected_passive = trigger
                break
        
        # Extract core subject / scope
        core_scope = clean_text
        if detected_passive:
            core_scope = clean_text[len(detected_passive):].strip().lstrip("the ").lstrip("a ").lstrip("with ").lstrip("of ")
        
        if not core_scope:
            core_scope = "backend microservices and cloud infrastructure"

        # Generate 3 deterministic CFG STAR variations
        variations = [
            {
                "archetype": "Performance & Efficiency Boost",
                "action_verb": "Architected & Optimized",
                "star_bullet": f"Architected and optimized {core_scope}, slashing operational latency by 35% and improving system throughput across 50,000+ daily user requests.",
                "situation_task": f"High latency and scaling bottlenecks in {core_scope}",
                "action": f"Architected modular optimizations and streamlined data pipelines",
                "metric_result": "35% latency reduction, 50,000+ daily throughput"
            },
            {
                "archetype": "Scale & High Reliability",
                "action_verb": "Engineered & Deployed",
                "star_bullet": f"Engineered robust, automated pipelines for {core_scope}, achieving 99.9% uptime and eliminating manual deployment errors by 40%.",
                "situation_task": f"Production reliability and error mitigation in {core_scope}",
                "action": f"Implemented fault-tolerant automation and regression validation suites",
                "metric_result": "99.9% service uptime, 40% error reduction"
            },
            {
                "archetype": "Delivery & Product Impact",
                "action_verb": "Spearheaded & Delivered",
                "star_bullet": f"Spearheaded end-to-end delivery of {core_scope}, accelerating release cycles by 2.5x and supporting 10,000+ active enterprise users.",
                "situation_task": f"Business requirements for scalable {core_scope}",
                "action": f"Led cross-functional design and standardized CI/CD delivery",
                "metric_result": "2.5x faster delivery, 10,000+ active enterprise users"
            }
        ]

        return {
            "original_bullet": raw_bullet,
            "detected_passive_pattern": detected_passive or "Standard line",
            "extracted_task_scope": core_scope,
            "cfg_production_rule": "STAR -> [Action_Verb] + [System_Scope] + [Engineered_Method] + [Quantifiable_Result_Metric]",
            "variations": variations
        }
