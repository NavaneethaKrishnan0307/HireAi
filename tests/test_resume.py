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
