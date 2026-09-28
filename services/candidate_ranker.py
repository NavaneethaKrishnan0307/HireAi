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
        Returns explainable score breakdown, strict domain misalignment penalties, and decision log.
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

        # 5. Strict Core Skill Gating & Domain Alignment Check
        is_domain_mismatch = False
        domain_status = "Direct Domain Fit"
        domain_warning = None

        total_req = len(job_req_skills)
        matched_req_count = len(skill_res["matched_skills"])

        if total_req >= 2 and matched_req_count == 0:
            is_domain_mismatch = True
            domain_status = "Critical Domain Mismatch"
            domain_warning = f"0 of {total_req} required technical skills matched (Candidate domain differs from role requirements)."
            raw_composite = (skill_score * weights["skills"]) + (exp_score * weights["experience"]) + (edu_score * weights["education"]) + (cert_score * weights["additional"])
            overall_score = round(min(raw_composite * 0.15, 12.0), 1)
        elif total_req >= 3 and matched_req_count == 1:
            is_domain_mismatch = True
            domain_status = "High Skill Gap"
            domain_warning = f"Only 1 of {total_req} required skills matched."
            raw_composite = (skill_score * weights["skills"]) + (exp_score * weights["experience"]) + (edu_score * weights["education"]) + (cert_score * weights["additional"])
            overall_score = round(min(raw_composite * 0.45, 30.0), 1)
        else:
            overall_score = round(
                (skill_score * weights["skills"]) +
                (exp_score * weights["experience"]) +
                (edu_score * weights["education"]) +
                (cert_score * weights["additional"]),
                1
            )

        # Assemble list of human-readable explainable statements
        explanations = []
        if domain_warning:
            explanations.append(f"⚠️ {domain_warning}")

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

        match_payload = {
            "overall_score": overall_score,
            "skill_score": skill_score,
            "experience_score": exp_score,
            "education_score": edu_score,
            "certifications_score": cert_score,
            "matched_skills": skill_res["matched_skills"],
            "missing_skills": skill_res["missing_skills"],
            "preferred_matches": skill_res["matched_preferred"],
            "applied_weights": weights,
            "is_domain_mismatch": is_domain_mismatch,
            "domain_status": domain_status,
            "domain_warning": domain_warning,
            "skill_gap_advice": skill_gap_advice,
            "explanations": explanations,
            "rule_results": {
                "skill_rule": skill_res,
                "experience_rule": exp_res,
                "education_rule": edu_res,
                "certifications_rule": cert_res
            }
        }

        # Attach Explainable AI mathematical proof trace and production rule-based interview questions
        match_payload["proof_trace"] = RuleEngine.generate_proof_trace(candidate_data, job_data, match_payload)
        match_payload["interview_questions"] = RuleEngine.generate_interview_questions(candidate_data, job_data)

        return match_payload

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

    @classmethod
    def generate_resume_audit_report(
        cls,
        candidate_data: Dict[str, Any],
        jobs_list: Optional[List[Dict[str, Any]]] = None
    ) -> Dict[str, Any]:
        """
        Generate a comprehensive, enterprise-grade AI Resume Audit & Report.
        Evaluates ATS compliance, document authenticity verification, identity match verification,
        multi-domain skill taxonomy breakdown (Cybersecurity, Languages, Frameworks, Cloud & DevOps, AI/Data),
        experience maturity, strengths, weaknesses, and cross-job fit matrix across the open platform.
        """
        import re
        from backend.services.resume_parser import ResumeParser

        skills = candidate_data.get("parsed_skills", []) or []
        experience = float(candidate_data.get("years_of_experience", 0.0) or 0.0)
        education = str(candidate_data.get("education", "") or "Undergraduate")
        current_title = str(candidate_data.get("current_title", "") or "")
        phone = candidate_data.get("phone", "")
        email = candidate_data.get("email", "")
        full_name = candidate_data.get("full_name") or candidate_data.get("name") or "Candidate"

        parsed_data = candidate_data.get("parsed_data") or {}
        resume_name = parsed_data.get("name") or candidate_data.get("resume_name")
        raw_text = candidate_data.get("raw_text") or parsed_data.get("raw_text") or ""
        doc_validation = parsed_data.get("document_validation") or {}

        if raw_text and not doc_validation:
            doc_validation = ResumeParser.validate_resume_document(raw_text)
            if not resume_name:
                resume_name = ResumeParser.extract_name(raw_text, email)

        # 1. Identity & Profile Consistency Check
        profile_name = full_name
        name_mismatch = False
        identity_status = "VERIFIED_AUTHENTIC"
        identity_discrepancy = None

        if resume_name and profile_name:
            norm_res = re.sub(r'[^\w\s]', '', resume_name).lower().strip()
            norm_prof = re.sub(r'[^\w\s]', '', profile_name).lower().strip()
            
            res_tokens = set(norm_res.split())
            prof_tokens = set(norm_prof.split())

            is_placeholder_prof = norm_prof in ["candidate", "candidate profile", "user", ""]
            is_placeholder_res = norm_res in ["candidate", "candidate profile", "resume", ""]

            if not is_placeholder_prof and not is_placeholder_res:
                if not (res_tokens & prof_tokens):
                    name_mismatch = True
                    identity_status = "DISCREPANCY_DETECTED"
                    identity_discrepancy = f"Resume document belongs to '{resume_name}', which does not match your registered profile name '{profile_name}'."

        # 2. Document Authenticity Validation
        is_valid_doc = doc_validation.get("is_valid", True)
        if not is_valid_doc:
            identity_status = "INVALID_NON_RESUME_DOCUMENT"

        # 3. Categorized Skill Taxonomy (Multi-Domain)
        cyber_skills = [s for s in skills if s in [
            "Cybersecurity", "Network Security", "Information Security", "Ethical Hacking", 
            "Penetration Testing", "SOC", "SIEM", "Firewall", "Vulnerability Assessment", 
            "Wireshark", "Nmap", "Metasploit", "Splunk", "Incident Response", "Digital Forensics", 
            "OWASP", "Burp Suite", "Kali Linux", "Cryptography", "TCP/IP", "DNS", "VPN", 
            "CompTIA Security+", "CEH", "CISSP", "IAM", "Cloud Security", "Endpoint Security", 
            "Malware Analysis", "IDS/IPS", "Network Analysis"
        ]]
        
        languages = [s for s in skills if s in [
            "Python", "Java", "JavaScript", "TypeScript", "C++", "C#", "C", "Go", "Rust", 
            "Ruby", "PHP", "Kotlin", "Swift", "Scala", "R", "Dart", "Solidity", "Bash", 
            "Shell Scripting", "PowerShell", "Assembly"
        ]]
        
        frameworks = [s for s in skills if s in [
            "FastAPI", "Django", "Flask", "React", "React.js", "Vue", "Vue.js", "Angular", 
            "Node.js", "Express", "Spring", "Spring Boot", "Next.js", "Nuxt.js", "Svelte", 
            "Redux", "TailwindCSS", "Bootstrap", "HTML", "CSS", "HTML/CSS", "GraphQL", 
            "REST APIs", "gRPC", "Webpack", "Vite"
        ]]
        
        databases_cloud = [s for s in skills if s in [
            "SQL", "PostgreSQL", "MySQL", "MongoDB", "Redis", "SQLite", "Oracle", "Cassandra", 
            "DynamoDB", "Elasticsearch", "Supabase", "Firebase", "Neo4j", "AWS", "Azure", "GCP", 
            "Google Cloud", "Docker", "Kubernetes", "Git", "GitHub", "GitLab", "CI/CD", 
            "Terraform", "Linux", "Ubuntu", "CentOS", "Jira", "Jenkins", "Kafka", "RabbitMQ", 
            "Microservices", "Serverless", "Nginx", "Ansible"
        ]]
        
        ai_data = [s for s in skills if s in [
            "Machine Learning", "Deep Learning", "TensorFlow", "PyTorch", "Scikit-learn", 
            "Pandas", "NumPy", "OpenCV", "NLP", "LLM", "Data Analysis"
        ]]
        
        categorized_all = set(cyber_skills + languages + frameworks + databases_cloud + ai_data)
        other_skills = [s for s in skills if s not in categorized_all]

        # Check if candidate is a student / intern or cybersecurity profile
        is_intern_or_student = (
            "intern" in current_title.lower() or 
            "student" in current_title.lower() or 
            "trainee" in current_title.lower() or 
            experience < 1.0
        )
        is_cyber = bool(cyber_skills) or "cyber" in current_title.lower() or "security" in current_title.lower()

        # 4. ATS Multi-Pillar Scoring Methodology
        line_analysis = parsed_data.get("line_analysis") or []
        if not line_analysis and raw_text:
            line_analysis = ResumeParser.analyze_resume_lines(raw_text)

        word_count = doc_validation.get("word_count") or (len(raw_text.split()) if raw_text else 150)
        detected_sections = doc_validation.get("detected_sections", [])

        # Pillar 1: Format & Parsability (0-100)
        p_format = 30 + (len(detected_sections) * 15)
        if email and "@" in email:
            p_format += 5
        if phone and len(phone) >= 8:
            p_format += 5
        p_format = min(100, max(20, p_format))

        # Pillar 2: Technical Keyword Density (0-100)
        p_keywords = 25 + (len(skills) * 8)
        categories_represented = sum([
            bool(cyber_skills), bool(languages), bool(frameworks),
            bool(databases_cloud), bool(ai_data)
        ])
        if categories_represented >= 2:
            p_keywords += 10
        if categories_represented >= 3:
            p_keywords += 10
        p_keywords = min(100, max(20, p_keywords))

        # Pillar 3: Action & Measurable Impact (0-100)
        metric_lines_count = sum(1 for l in line_analysis if l.get("has_metric"))
        action_verbs_count = sum(1 for l in line_analysis if l.get("action_verb"))
        passive_lines_count = sum(1 for l in line_analysis if l.get("passive_phrase"))
        total_content_lines = sum(1 for l in line_analysis if l.get("category") != "SECTION_HEADER")
        
        if total_content_lines > 0:
            impact_ratio = (action_verbs_count * 1.2 + metric_lines_count * 2.0) / max(1, total_content_lines)
            p_impact = int(min(100, max(25, 30 + (impact_ratio * 50) - (passive_lines_count * 5))))
        else:
            p_impact = 50 if len(skills) >= 4 else 35

        # Pillar 4: Brevity & Readability Index (0-100)
        if 250 <= word_count <= 750:
            p_readability = 95
        elif 150 <= word_count <= 1100:
            p_readability = 80
        elif 80 <= word_count <= 1500:
            p_readability = 65
        else:
            p_readability = 40

        # Pillar 5: Authenticity & Identity Integrity (0-100)
        p_auth = doc_validation.get("authenticity_score", 85)
        if name_mismatch:
            p_auth = max(20, p_auth - 30)
        if not is_valid_doc:
            p_auth = min(25, p_auth)
        p_auth = min(100, max(15, p_auth))

        ats_pillars = {
            "format_parsability": p_format,
            "keyword_density": p_keywords,
            "action_impact": p_impact,
            "brevity_readability": p_readability,
            "authenticity_integrity": p_auth
        }

        if not is_valid_doc:
            ats_score = min(25, doc_validation.get("authenticity_score", 20))
        else:
            ats_score = int(
                (p_format * 0.20) +
                (p_keywords * 0.25) +
                (p_impact * 0.20) +
                (p_readability * 0.15) +
                (p_auth * 0.20)
            )
            ats_score = min(100, max(25, ats_score))

        # 5. Seniority & Domain Classification
        if current_title:
            seniority = current_title
        elif is_cyber and is_intern_or_student:
            seniority = "Cybersecurity Intern / Student"
        elif is_cyber:
            seniority = "Cybersecurity Analyst / Specialist"
        elif is_intern_or_student:
            seniority = "Intern / Entry-Level Student"
        elif experience >= 6.0:
            seniority = "Senior / Lead Engineer"
        elif experience >= 3.0:
            seniority = "Mid-Senior Professional"
        else:
            seniority = "Associate / Junior Developer"

        # 6. Strengths & Opportunities
        strengths = []
        if cyber_skills:
            top_cyber = cyber_skills[:4]
            strengths.append(f"Dedicated InfoSec & Cybersecurity toolkit ({', '.join(top_cyber)})")
        if len(languages) >= 2:
            strengths.append(f"Polyglot programming versatility ({', '.join(languages[:3])})")
        elif languages:
            strengths.append(f"Solid foundation in core language: {languages[0]}")
        
        if frameworks:
            strengths.append(f"Modern framework competency ({', '.join(frameworks[:3])})")
        if databases_cloud:
            strengths.append(f"Infrastructure, OS, and Data readiness ({', '.join(databases_cloud[:3])})")
        if ai_data:
            strengths.append(f"Data Science & AI capability ({', '.join(ai_data[:3])})")
        if metric_lines_count >= 2:
            strengths.append(f"Strong quantification of impact with {metric_lines_count} measurable metric statements")
        if experience >= 2.0:
            strengths.append(f"Demonstrated production experience of {experience} years")
        elif is_intern_or_student and (cyber_skills or skills):
            strengths.append("Strong academic and practical project focus tailored for internship/entry roles")

        if not strengths:
            strengths.append("Foundational technical interest and transferable capabilities")

        weaknesses = []
        if not is_valid_doc:
            weaknesses.append(f"Document Structure Warning: {doc_validation.get('reason', 'Missing standard resume sections')}")

        if name_mismatch:
            weaknesses.append(f"Identity Discrepancy: Profile name is '{profile_name}' but resume header states '{resume_name}'. Update profile to verify authenticity.")

        if passive_lines_count >= 1:
            weaknesses.append(f"Detected {passive_lines_count} passive phrasing instances ('responsible for', 'worked on') - replace with strong action verbs")

        if metric_lines_count == 0:
            weaknesses.append("Zero quantifiable metrics detected; add measurable metrics (e.g. % improvement, latency reduction, user count)")

        if is_cyber:
            if not any(s in cyber_skills for s in ["SIEM", "SOC", "Splunk"]):
                weaknesses.append("Missing enterprise SIEM/SOC monitoring keywords (e.g., Splunk, Elastic SIEM)")
            if not any(s in cyber_skills for s in ["Wireshark", "Nmap", "TCP/IP"]):
                weaknesses.append("Network protocol analysis tools (Wireshark, Nmap) should be explicitly highlighted")
            if not databases_cloud and not any(s in skills for s in ["Linux", "Kali Linux"]):
                weaknesses.append("Add Linux / Kali Linux system administration tools to your profile")
        else:
            if not databases_cloud:
                weaknesses.append("Missing cloud/DevOps keywords (e.g. Docker, AWS, Git) required by top employers")
            if not frameworks:
                weaknesses.append("No modern application framework detected on resume")

        if len(skills) < 4:
            weaknesses.append("Skill density is low; expand your technical vocabulary with tools and protocols you know")
        if not is_intern_or_student and experience < 1.0:
            weaknesses.append("Limited commercial experience listed; highlight open-source contributions or live client projects")

        if not weaknesses:
            weaknesses.append("Continue maintaining updated project artifacts and latest security/dev tool versions")

        # 7. Actionable Roadmap
        recommendations = []
        if is_cyber or is_intern_or_student:
            recommendations.append("Document hands-on lab environments, CTF write-ups (TryHackMe / HackTheBox), or GitHub security tools")
            recommendations.append("Highlight industry standard certifications (e.g. CompTIA Security+, CEH, or AWS Cloud Practitioner)")
            recommendations.append("Quantify vulnerability assessment outcomes (e.g., 'Audited 15+ network endpoints detecting 8 CVE vulnerabilities')")
        else:
            recommendations.append("Quantify project achievements with measurable metrics (e.g. 'Improved query latency by 35%')")
            recommendations.append("Add high-demand cloud technologies (Docker, AWS, Git) to improve ATS ranking for engineering roles")
            recommendations.append("Ensure certifications and latest technical tools are prominently listed in a dedicated skills section")

        if passive_lines_count >= 1:
            recommendations.append("Review Line-by-Line Inspection below and convert passive phrases into action-oriented statements")

        # 8. Job-Specific Fit Matrix across Open Platform with Strict Domain Analysis
        job_matrix = []
        if jobs_list:
            for job in jobs_list:
                eval_res = cls.calculate_candidate_match(candidate_data, job)
                job_matrix.append({
                    "job_id": job.get("id"),
                    "title": job.get("title", "Software Engineer"),
                    "company": job.get("company", "TechCorp"),
                    "location": job.get("location", "Remote"),
                    "domain": job.get("department", "Engineering"),
                    "match_score": eval_res["overall_score"],
                    "matched_skills": eval_res["matched_skills"],
                    "missing_skills": eval_res["missing_skills"],
                    "is_domain_mismatch": eval_res.get("is_domain_mismatch", False),
                    "domain_status": eval_res.get("domain_status", "Direct Domain Fit"),
                    "domain_warning": eval_res.get("domain_warning"),
                    "skill_gap_advice": eval_res["skill_gap_advice"],
                    "proof_trace": eval_res.get("proof_trace"),
                    "interview_questions": eval_res.get("interview_questions")
                })
            job_matrix.sort(key=lambda x: x["match_score"], reverse=True)

        return {
            "candidate_name": full_name,
            "resume_name": resume_name or full_name,
            "email": email,
            "phone": phone,
            "ats_health_score": ats_score,
            "ats_pillars": ats_pillars,
            "line_analysis": line_analysis,
            "line_metrics_summary": {
                "total_lines": len(line_analysis),
                "metric_lines": metric_lines_count,
                "action_verbs": action_verbs_count,
                "passive_phrases": passive_lines_count
            },
            "seniority_level": seniority,
            "total_skills_count": len(skills),
            "authenticity_verification": {
                "is_valid_resume": is_valid_doc,
                "identity_status": identity_status,
                "name_mismatch": name_mismatch,
                "resume_name": resume_name,
                "profile_name": profile_name,
                "identity_discrepancy": identity_discrepancy,
                "document_validation": doc_validation
            },
            "skill_taxonomy": {
                "cybersecurity_and_networking": cyber_skills,
                "languages": languages,
                "frameworks": frameworks,
                "databases_and_cloud": databases_cloud,
                "ai_and_data": ai_data,
                "other_tools": other_skills
            },
            "experience_years": experience,
            "education": education,
            "strengths": strengths,
            "weaknesses": weaknesses,
            "recommendations": recommendations,
            "job_matrix": job_matrix
        }
