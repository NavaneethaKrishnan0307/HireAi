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

    @classmethod
    def generate_resume_audit_report(
        cls,
        candidate_data: Dict[str, Any],
        jobs_list: Optional[List[Dict[str, Any]]] = None
    ) -> Dict[str, Any]:
        """
        Generate a comprehensive, enterprise-grade AI Resume Audit & Report.
        Evaluates ATS compliance, multi-domain skill taxonomy breakdown (Cybersecurity,
        Languages, Frameworks, Cloud & DevOps, AI/Data), experience maturity,
        strengths, weaknesses, and cross-job fit matrix across the open platform.
        """
        skills = candidate_data.get("parsed_skills", []) or []
        experience = float(candidate_data.get("years_of_experience", 0.0) or 0.0)
        education = str(candidate_data.get("education", "") or "Undergraduate")
        current_title = str(candidate_data.get("current_title", "") or "")
        phone = candidate_data.get("phone", "")
        email = candidate_data.get("email", "")
        full_name = candidate_data.get("full_name") or candidate_data.get("name") or "Candidate"

        # 1. Categorized Skill Taxonomy (Multi-Domain)
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

        # 2. ATS & Overall Health Scoring Formula
        ats_score = 45  # Base score for valid document parsing & structure
        if len(skills) >= 3:
            ats_score += 15
        if len(skills) >= 6:
            ats_score += 15
        if len(skills) >= 10:
            ats_score += 5
            
        if is_intern_or_student:
            if education and education != "Undergraduate":
                ats_score += 10
            else:
                ats_score += 5
            if cyber_skills or languages or frameworks:
                ats_score += 10
        else:
            if experience >= 1.0:
                ats_score += 10
            if education and education != "Undergraduate":
                ats_score += 5

        if phone and len(phone) >= 8:
            ats_score += 5
        if email and "@" in email:
            ats_score += 5
            
        ats_score = min(100, max(35, ats_score))

        # 3. Seniority & Domain Classification
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

        # 4. Strengths & Opportunities
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
        if experience >= 2.0:
            strengths.append(f"Demonstrated production experience of {experience} years")
        elif is_intern_or_student and (cyber_skills or skills):
            strengths.append("Strong academic and practical project focus tailored for internship/entry roles")

        if not strengths:
            strengths.append("Foundational technical interest and transferable capabilities")

        weaknesses = []
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

        # 5. Actionable Roadmap
        if is_cyber or is_intern_or_student:
            recommendations = [
                "Document hands-on lab environments, CTF write-ups (TryHackMe / HackTheBox), or GitHub security tools",
                "Highlight industry standard certifications (e.g. CompTIA Security+, CEH, or AWS Cloud Practitioner)",
                "Quantify vulnerability assessment and project outcomes (e.g., 'Audited 15+ network endpoints detecting 8 CVE vulnerabilities')"
            ]
        else:
            recommendations = [
                "Quantify project achievements with measurable metrics (e.g. 'Improved query latency by 35%')",
                "Add high-demand cloud technologies (Docker, AWS, Git) to improve ATS ranking for engineering roles",
                "Ensure certifications and latest technical tools are prominently listed in a dedicated skills section"
            ]

        # 6. Job-Specific Fit Matrix across Open Platform
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
                    "skill_gap_advice": eval_res["skill_gap_advice"]
                })
            job_matrix.sort(key=lambda x: x["match_score"], reverse=True)

        return {
            "candidate_name": full_name,
            "email": email,
            "phone": phone,
            "ats_health_score": ats_score,
            "seniority_level": seniority,
            "total_skills_count": len(skills),
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
