import pytest
from pathlib import Path
from backend.services.resume_parser import ResumeParser

def test_resume_parser_heuristics():
    sample_text = """
    John Doe
    john.doe@example.com
    +91 9876543210
    Bangalore, India

    SUMMARY
    Senior Software Engineer with 4.5 years of experience in developing distributed microservices.

    SKILLS
    Python, FastAPI, SQL, PostgreSQL, Docker, AWS, React, Git, Redis

    EDUCATION
    B.Tech in Computer Science, 2020
    """

    email = ResumeParser.extract_email(sample_text)
    assert email == "john.doe@example.com"

    phone = ResumeParser.extract_phone(sample_text)
    assert phone is not None
    assert "9876543210" in phone

    skills = ResumeParser.extract_skills(sample_text)
    assert "Python" in skills
    assert "FastAPI" in skills
    assert "SQL" in skills
    assert "Docker" in skills
    assert "AWS" in skills

    edu = ResumeParser.extract_education(sample_text)
    assert "B.Tech" in edu

    exp = ResumeParser.extract_experience_years(sample_text)
    assert exp == 4.5

def test_cybersecurity_intern_resume_parsing_and_audit():
    from backend.services.candidate_ranker import CandidateRanker

    cyber_resume = """
    Aravind Kumar
    aravind.cyber@gmail.com
    +91 9123456780
    Chennai, India

    OBJECTIVE
    Passionate Cybersecurity Student seeking an InfoSec / Cybersecurity Intern role.

    TECHNICAL SKILLS
    Network Security, Wireshark, Nmap, Metasploit, Burp Suite, Kali Linux, Python, Linux, Cryptography, OWASP

    PROJECTS & LABS
    - Performed Vulnerability Assessment using Nmap & Metasploit
    - Captured and analyzed packet traffic using Wireshark
    - Web penetration testing on OWASP Top 10 vulnerabilities

    EDUCATION
    B.Tech in Information Technology / Cybersecurity, Expected 2026
    """

    email = ResumeParser.extract_email(cyber_resume)
    assert email == "aravind.cyber@gmail.com"

    skills = ResumeParser.extract_skills(cyber_resume)
    assert "Wireshark" in skills
    assert "Nmap" in skills
    assert "Metasploit" in skills
    assert "Burp Suite" in skills
    assert "Kali Linux" in skills
    assert "Python" in skills
    assert "OWASP" in skills

    title = ResumeParser.extract_current_title(cyber_resume)
    assert "Cybersecurity Intern" in title

    exp = ResumeParser.extract_experience_years(cyber_resume)
    assert exp <= 0.5

    # Run resume audit report generator
    report = CandidateRanker.generate_resume_audit_report({
        "full_name": "Aravind Kumar",
        "email": email,
        "phone": "9123456780",
        "current_title": title,
        "parsed_skills": skills,
        "years_of_experience": exp,
        "education": "B.Tech in Information Technology"
    }, jobs_list=[])

    assert report["ats_health_score"] >= 65
    assert "Cybersecurity Intern" in report["seniority_level"]
    assert len(report["skill_taxonomy"]["cybersecurity_and_networking"]) >= 4
    assert any("toolkit" in s.lower() or "cybersecurity" in s.lower() for s in report["strengths"])

def test_resume_authenticity_and_identity_mismatch():
    from backend.services.candidate_ranker import CandidateRanker

    # Test 1: Non-resume text validation
    non_resume_text = "Grocery shopping list: 1L Milk, 12 Eggs, Sliced Bread, Apples, Bananas."
    val_res = ResumeParser.validate_resume_document(non_resume_text)
    assert val_res["is_valid"] is False
    assert "INVALID" in val_res["verdict"]

    # Test 2: Name extraction for "Surves"
    surves_resume = """
    SURVES
    surves.infosec@gmail.com
    +91 9887766554

    PROFILE
    Cybersecurity fresher with hands-on networking and Wireshark analysis experience.

    TECHNICAL SKILLS
    Wireshark, Nmap, Metasploit, Kali Linux, Python, Linux

    EDUCATION
    B.E. in Computer Science, 2026
    """
    extracted_name = ResumeParser.extract_name(surves_resume)
    assert extracted_name == "Surves"

    # Test 3: Registered Profile is "Joe" but Resume uploaded belongs to "Surves"
    audit_report = CandidateRanker.generate_resume_audit_report({
        "full_name": "Joe Candidate",
        "email": "joe@example.com",
        "phone": "9887766554",
        "parsed_skills": ["Wireshark", "Nmap", "Metasploit", "Kali Linux", "Python", "Linux"],
        "years_of_experience": 0.0,
        "education": "B.E. in Computer Science",
        "raw_text": surves_resume,
        "parsed_data": {
            "name": "Surves",
            "skills": ["Wireshark", "Nmap", "Metasploit", "Kali Linux", "Python", "Linux"]
        }
    }, jobs_list=[])

    auth_check = audit_report["authenticity_verification"]
    assert auth_check["name_mismatch"] is True
    assert auth_check["identity_status"] == "DISCREPANCY_DETECTED"
    assert "Surves" in auth_check["identity_discrepancy"]
    assert "Joe" in auth_check["identity_discrepancy"]
    assert audit_report["ats_pillars"]["authenticity_integrity"] == 25
    assert audit_report["ats_health_score"] <= 45

    # Test 4: Registered Profile is "Ram" and Resume uploaded belongs to "Surves"
    ram_report = CandidateRanker.generate_resume_audit_report({
        "full_name": "Ram",
        "email": "ram@example.com",
        "phone": "9887766554",
        "parsed_skills": ["Python", "FastAPI", "PostgreSQL"],
        "years_of_experience": 2.0,
        "education": "B.Tech in Computer Science",
        "raw_text": surves_resume,
        "parsed_data": {
            "resume_name": "Surves",
            "name": "Surves",
            "skills": ["Python", "FastAPI", "PostgreSQL"]
        }
    }, jobs_list=[])

    assert ram_report["authenticity_verification"]["name_mismatch"] is True
    assert ram_report["ats_pillars"]["authenticity_integrity"] == 25
    assert ram_report["ats_health_score"] <= 45
    assert "Surves" in ram_report["authenticity_verification"]["identity_discrepancy"]
    assert "Ram" in ram_report["authenticity_verification"]["identity_discrepancy"]

def test_strict_domain_misalignment_penalty():
    from backend.services.candidate_ranker import CandidateRanker

    # Candidate has Cyber Intern skills only
    cyber_candidate = {
        "full_name": "Surves",
        "parsed_skills": ["Wireshark", "Nmap", "Metasploit", "Kali Linux", "Linux"],
        "years_of_experience": 0.0,
        "education": "B.Tech in Information Technology"
    }

    # Job is for a Senior Python Developer
    python_dev_job = {
        "id": "job-python-101",
        "title": "Senior Python Backend Developer",
        "company": "TechCorp",
        "required_skills": ["Python", "FastAPI", "Django", "PostgreSQL", "Docker", "AWS"],
        "min_experience": 3.0,
        "education_required": "B.Tech"
    }

    match_result = CandidateRanker.calculate_candidate_match(cyber_candidate, python_dev_job)
    
    # Must strictly detect Domain Mismatch and assign low score (< 15%)
    assert match_result["is_domain_mismatch"] is True
    assert match_result["overall_score"] <= 15.0
    assert len(match_result["matched_skills"]) == 0
    assert "Critical Domain Mismatch" in match_result["domain_status"]

