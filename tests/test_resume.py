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

