import io
import re
from pathlib import Path
from typing import Dict, Any, List, Optional, Union
import PyPDF2
from docx import Document

# Comprehensive curated skill dictionary for deterministic rule-based knowledge representation
KNOWN_SKILLS = [
    # Programming & Scripting Languages
    "Python", "Java", "JavaScript", "TypeScript", "C++", "C#", "C", "Go", "Rust", "Ruby", "PHP", "Kotlin", "Swift", "Scala", "R", "Dart", "Solidity", "Bash", "Shell Scripting", "PowerShell", "Assembly",
    
    # Cybersecurity, InfoSec & Networking
    "Cybersecurity", "Network Security", "Information Security", "Ethical Hacking", "Penetration Testing", "SOC", "SIEM", "Firewall", "Vulnerability Assessment", "Wireshark", "Nmap", "Metasploit", "Splunk", "Incident Response", "Digital Forensics", "OWASP", "Burp Suite", "Kali Linux", "Cryptography", "TCP/IP", "DNS", "VPN", "CompTIA Security+", "CEH", "CISSP", "IAM", "Cloud Security", "Endpoint Security", "Malware Analysis", "IDS/IPS", "Network Analysis",

    # Frontend Technologies & Frameworks
    "FastAPI", "Django", "Flask", "React", "React.js", "Vue", "Vue.js", "Angular", "Node.js", "Express", "Spring", "Spring Boot",
    "Next.js", "Nuxt.js", "Svelte", "Redux", "TailwindCSS", "Bootstrap", "HTML", "CSS", "HTML/CSS", "GraphQL", "REST APIs", "gRPC", "Webpack", "Vite",
    
    # Databases, Caching & Data Stores
    "SQL", "PostgreSQL", "MySQL", "MongoDB", "Redis", "SQLite", "Oracle", "Cassandra", "DynamoDB", "Elasticsearch", "Supabase", "Firebase", "Neo4j",
    
    # Cloud, DevOps, OS & Infrastructure
    "AWS", "Azure", "GCP", "Google Cloud", "Docker", "Kubernetes", "Git", "GitHub", "GitLab", "CI/CD", "Terraform", "Linux", "Ubuntu", "CentOS",
    "Jira", "Jenkins", "Kafka", "RabbitMQ", "Microservices", "Serverless", "Nginx", "Ansible",
    
    # AI / Machine Learning / Data Science
    "Machine Learning", "Deep Learning", "TensorFlow", "PyTorch", "Scikit-learn", "Pandas", "NumPy", "OpenCV", "NLP", "LLM", "Data Analysis",
    
    # Testing & Mobile
    "PyTest", "Jest", "Cypress", "Selenium", "Flutter", "React Native", "Android", "iOS"
]

EDUCATION_PATTERNS = [
    (r"\b(Ph\.?D|Doctor of Philosophy|Doctorate)\b", "Ph.D"),
    (r"\b(M\.?Tech|Master of Technology)\b", "M.Tech"),
    (r"\b(M\.?S|Master of Science)\b", "M.S."),
    (r"\b(M\.?C\.?A|Master of Computer Applications)\b", "MCA"),
    (r"\b(M\.?B\.?A|Master of Business Administration)\b", "MBA"),
    (r"\b(B\.?Tech|Bachelor of Technology)\b", "B.Tech"),
    (r"\b(B\.?E\.?|Bachelor of Engineering)\b", "B.E."),
    (r"\b(B\.?C\.?A|Bachelor of Computer Applications)\b", "BCA"),
    (r"\b(B\.?Sc|Bachelor of Science)\b", "B.Sc"),
    (r"\b(Bachelor(?:'s)? Degree|Master(?:'s)? Degree)\b", "Graduate Degree")
]

class ResumeParser:
    """
    Deterministic rule-based document parser.
    Extracts text and structured metadata from PDF and DOCX in-memory or from file paths.
    Requires ZERO local disk storage.
    """

    @classmethod
    def extract_text(cls, source: Union[Path, bytes, io.BytesIO], filename: str = "resume.pdf") -> str:
        """Extract raw text from PDF or DOCX directly from memory buffer or path."""
        ext = Path(filename).suffix.lower()
        text = ""

        # Normalize to stream
        if isinstance(source, (bytes, bytearray)):
            stream = io.BytesIO(source)
        elif isinstance(source, (Path, str)):
            p = Path(source)
            if not p.exists():
                return ""
            stream = open(p, "rb")
            ext = p.suffix.lower()
        else:
            stream = source

        if ext == ".pdf":
            try:
                reader = PyPDF2.PdfReader(stream)
                for page in reader.pages:
                    extracted = page.extract_text()
                    if extracted:
                        text += extracted + "\n"
            except Exception:
                pass
        elif ext in [".docx", ".doc"]:
            try:
                doc = Document(stream)
                for paragraph in doc.paragraphs:
                    text += paragraph.text + "\n"
                for table in doc.tables:
                    for row in table.rows:
                        for cell in row.cells:
                            text += cell.text + " "
                        text += "\n"
            except Exception:
                pass

        if hasattr(stream, "seek"):
            stream.seek(0)

        return text.strip()

    @classmethod
    def extract_email(cls, text: str) -> Optional[str]:
        """Extract email address using regex."""
        email_pattern = r'[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+'
        match = re.search(email_pattern, text)
        return match.group(0) if match else None

    @classmethod
    def extract_phone(cls, text: str) -> Optional[str]:
        """Extract phone number using regex."""
        phone_pattern = r'(?:(?:\+|0{0,2})91(\s*[\-]\s*)?|[0]?)?[6789]\d{9}|(?:\+?1\s*(?:[.-]\s*)?)?(?:\(\s*([2-9]1[02-9]|[2-9][02-8]1|[2-9][02-8][02-9])\s*\)|([2-9]1[02-9]|[2-9][02-8]1|[2-9][02-8][02-9]))\s*(?:[.-]\s*)?([2-9]1[02-9]|[2-9][02-8]1|[2-9][02-8][02-9])\s*(?:[.-]\s*)?([2-9]1[02-9]|[2-9][02-9]1|[2-9][02-9]{2})\s*(?:[.-]\s*)?([0-9]{4})'
        match = re.search(phone_pattern, text)
        if match:
            clean = re.sub(r'[^\d+]', '', match.group(0))
            return clean if len(clean) >= 10 else match.group(0).strip()
        return None

    @classmethod
    def extract_name(cls, text: str, email: Optional[str] = None) -> Optional[str]:
        """Extract candidate name heuristic from top non-empty lines."""
        lines = [line.strip() for line in text.splitlines() if line.strip()]
        for line in lines[:5]:
            if "@" in line or "http" in line or "www" in line or "resume" in line.lower() or "curriculum" in line.lower():
                continue
            words = line.split()
            if 1 < len(words) <= 4 and all(w.isalpha() or w in ['.', ','] for w in words):
                return line.title()
        
        if email:
            prefix = email.split('@')[0]
            name_parts = re.split(r'[._-]', prefix)
            if all(p.isalpha() for p in name_parts) and len(name_parts) >= 2:
                return " ".join(p.capitalize() for p in name_parts)
        return "Candidate Profile"

    @classmethod
    def extract_skills(cls, text: str) -> List[str]:
        """Deterministic skill extraction matching against known skill vocabulary."""
        found_skills = set()
        for skill in KNOWN_SKILLS:
            escaped_skill = re.escape(skill)
            pattern = rf'(?i)(?:\b|(?<=[^a-zA-Z0-9]))' + escaped_skill + rf'(?:\b|(?=[^a-zA-Z0-9]))'
            if re.search(pattern, text):
                found_skills.add(skill)

        return sorted(list(found_skills))

    @classmethod
    def extract_education(cls, text: str) -> str:
        """Extract education credentials using hierarchical pattern checks."""
        for pattern, edu_title in EDUCATION_PATTERNS:
            if re.search(pattern, text, re.IGNORECASE):
                if re.search(r'Computer\s*Science|Information\s*Technology|Cyber|Security|ECE|CSE|IT|Mechanical|Electrical', text, re.IGNORECASE):
                    return f"{edu_title} in Computer Science / IT / Security"
                return edu_title
        return "B.Tech / Graduate"

    @classmethod
    def extract_current_title(cls, text: str) -> str:
        """Accurately identify professional or student/intern role from resume text."""
        t_lower = text.lower()
        if "cyber" in t_lower or "security" in t_lower or "penetration" in t_lower or "soc" in t_lower:
            if "intern" in t_lower or "student" in t_lower or "trainee" in t_lower:
                return "Cybersecurity Intern"
            return "Cybersecurity & InfoSec Analyst"
        
        if "intern" in t_lower or "student" in t_lower or "undergraduate" in t_lower or "fresher" in t_lower:
            if "data" in t_lower or "ai" in t_lower or "ml" in t_lower:
                return "Data Science & AI Intern"
            if "web" in t_lower or "frontend" in t_lower or "react" in t_lower:
                return "Web Development Intern"
            return "Software Engineering Intern"

        if "full stack" in t_lower or "fullstack" in t_lower:
            return "Full Stack Developer"
        if "devops" in t_lower or "cloud" in t_lower or "kubernetes" in t_lower or "terraform" in t_lower:
            return "DevOps & Cloud Engineer"
        if "data" in t_lower and ("machine learning" in t_lower or "ai" in t_lower):
            return "AI / Machine Learning Engineer"
        if "python" in t_lower or "django" in t_lower or "fastapi" in t_lower:
            return "Backend Python Developer"
        if "react" in t_lower or "frontend" in t_lower:
            return "Frontend React Developer"
        if "java" in t_lower or "spring" in t_lower:
            return "Java Software Engineer"

        return "Software Developer"

    @classmethod
    def extract_experience_years(cls, text: str) -> float:
        """Rule-based heuristic extraction of work experience in years."""
        t_lower = text.lower()
        exp_patterns = [
            r'(\d+(?:\.\d+)?)\+?\s*(?:years|yrs)(?:\s+of)?\s+experience',
            r'experience\s*:\s*(\d+(?:\.\d+)?)\+?\s*(?:years|yrs)',
            r'total\s+experience\s*:\s*(\d+(?:\.\d+)?)\s*(?:years|yrs)'
        ]
        for pat in exp_patterns:
            match = re.search(pat, text, re.IGNORECASE)
            if match:
                try:
                    return float(match.group(1))
                except ValueError:
                    pass

        year_ranges = re.findall(r'(20\d\d)\s*(?:-|to|–)\s*(20\d\d|present|current)', text, re.IGNORECASE)
        total_calculated = 0.0
        current_year = 2026
        for start, end in year_ranges:
            s = int(start)
            e = current_year if end.lower() in ['present', 'current'] else int(end)
            if 0 <= (e - s) <= 15:
                total_calculated += (e - s)
        
        # Student / Intern check
        if re.search(r'\b(student|intern|internship|trainee|undergraduate|fresher|pursuing)\b', t_lower):
            if total_calculated > 0:
                return round(min(total_calculated, 1.5), 1)
            return 0.0

        if total_calculated > 0:
            return round(min(total_calculated, 20.0), 1)

        return 0.0

    @classmethod
    def parse_bytes(cls, file_bytes: bytes, filename: str) -> Dict[str, Any]:
        """Perform in-memory parsing from raw bytes without writing to disk."""
        raw_text = cls.extract_text(file_bytes, filename=filename)
        email = cls.extract_email(raw_text)
        phone = cls.extract_phone(raw_text)
        name = cls.extract_name(raw_text, email)
        skills = cls.extract_skills(raw_text)
        education = cls.extract_education(raw_text)
        experience_years = cls.extract_experience_years(raw_text)
        current_title = cls.extract_current_title(raw_text)

        return {
            "name": name,
            "email": email,
            "phone": phone,
            "skills": skills,
            "education": education,
            "years_of_experience": experience_years,
            "current_title": current_title,
            "extracted_text_preview": raw_text[:500] if raw_text else "",
            "filename": filename,
            "status": "processed"
        }

    @classmethod
    def parse_file(cls, file_path: Path) -> Dict[str, Any]:
        """Perform file parsing pipeline from path (backward compatibility)."""
        raw_text = cls.extract_text(file_path, filename=file_path.name)
        email = cls.extract_email(raw_text)
        phone = cls.extract_phone(raw_text)
        name = cls.extract_name(raw_text, email)
        skills = cls.extract_skills(raw_text)
        education = cls.extract_education(raw_text)
        experience_years = cls.extract_experience_years(raw_text)
        current_title = cls.extract_current_title(raw_text)

        return {
            "name": name,
            "email": email,
            "phone": phone,
            "skills": skills,
            "education": education,
            "years_of_experience": experience_years,
            "current_title": current_title,
            "extracted_text_preview": raw_text[:500] if raw_text else "",
            "filename": file_path.name,
            "status": "processed"
        }
