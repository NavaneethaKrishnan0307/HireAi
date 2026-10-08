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

POWER_ACTION_VERBS = [
    "architected", "engineered", "developed", "designed", "implemented", "optimized",
    "spearheaded", "orchestrated", "deployed", "automated", "audited", "secured",
    "configured", "refactored", "built", "accelerated", "enhanced", "resolved",
    "integrated", "executed", "analyzed", "reduced", "increased", "boosted",
    "scaled", "streamlined", "created", "administered", "investigated", "mitigated"
]

PASSIVE_WEAK_PHRASES = [
    "worked on", "responsible for", "helped with", "assisted in", "participated in",
    "involved in", "handled", "tasked with", "was part of", "did some", "familiar with",
    "learning about"
]

class ResumeParser:
    """
    Deterministic rule-based document parser and line-by-line inspection engine.
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
        phone_pattern = r'(?:(?:\+|0{0,2})91(\s*[\-]\s*)?|[0]?)?[6789]\d{9}|(?:\+?1\s*(?:[.-]\s*)?)?(?:\(\s*([2-9]1[02-9]|[2-9][02-8]1|[2-9][02-8][02-9])\s*\)|([2-9]1[02-9]|[2-9][02-8]1|[2-9][02-8][02-9]))\s*(?:[.-]\s*)?([2-9]1[02-9]|[2-9][02-8]1|[2-9][02-8][02-9])\s*(?:[.-]\s*)?([2-9]1[02-9]|[2-9][02-8]1|[2-9][02-9]{2})\s*(?:[.-]\s*)?([0-9]{4})'
        match = re.search(phone_pattern, text)
        if match:
            clean = re.sub(r'[^\d+]', '', match.group(0))
            return clean if len(clean) >= 10 else match.group(0).strip()
        return None

    @classmethod
    def extract_name(cls, text: str, email: Optional[str] = None) -> Optional[str]:
        """Extract candidate name heuristic from top non-empty lines."""
        lines = [line.strip() for line in text.splitlines() if line.strip()]
        reserved_keywords = {
            "resume", "curriculum", "vitae", "cv", "profile", "summary", "objective",
            "contact", "skills", "experience", "education", "projects", "certifications",
            "email", "phone", "address", "page", "internship", "declaration", "about", "me"
        }
        for line in lines[:8]:
            clean_line = re.sub(r'[^\w\s\.\-]', '', line).strip()
            if not clean_line:
                continue
            if "@" in line or "http" in line or "www" in line or "github" in line.lower() or "linkedin" in line.lower():
                continue
            words = clean_line.split()
            if 1 <= len(words) <= 4:
                if any(w.lower() in reserved_keywords for w in words):
                    continue
                if all(re.sub(r'[\.\-]', '', w).isalpha() for w in words):
                    return clean_line.title()
        
        if email:
            prefix = email.split('@')[0]
            name_parts = re.split(r'[._-]', prefix)
            filtered = [p for p in name_parts if p.isalpha() and len(p) > 1 and not p.isdigit()]
            if filtered:
                return " ".join(p.capitalize() for p in filtered)
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
    def extract_location(cls, text: str) -> Optional[str]:
        """Extract candidate location from resume text."""
        if not text:
            return None
        loc_patterns = [
            (r"\b(Bangalore|Bengaluru)\b", "Bangalore, India"),
            (r"\b(Chennai|Madras)\b", "Chennai, India"),
            (r"\b(Hyderabad|Secunderabad)\b", "Hyderabad, India"),
            (r"\b(Delhi|New Delhi|Delhi\s*/\s*NCR|Noida|Gurgaon|Gurugram)\b", "Delhi / NCR, India"),
            (r"\b(Mumbai|Bombay)\b", "Mumbai, India"),
            (r"\b(Pune)\b", "Pune, India"),
            (r"\b(Kolkata|Calcutta)\b", "Kolkata, India"),
            (r"\b(Kochi|Cochin|Trivandrum|Thiruvananthapuram)\b", "Kochi, India"),
            (r"\b(San Francisco)\b", "San Francisco, United States"),
            (r"\b(New York)\b", "New York, United States"),
            (r"\b(London)\b", "London, United Kingdom"),
            (r"\b(Singapore)\b", "Singapore, Singapore"),
            (r"\b(Dubai)\b", "Dubai, United Arab Emirates")
        ]
        for pat, loc_name in loc_patterns:
            if re.search(pat, text, re.IGNORECASE):
                return loc_name
        return None

    @classmethod
    def infer_skills_from_role(cls, role_or_title: str) -> List[str]:
        """Intelligently infer relevant skills based on professional role or target title."""
        if not role_or_title:
            return ["Python", "SQL", "Git", "REST APIs", "Problem Solving"]
        t = role_or_title.lower()
        if any(k in t for k in ["cyber", "security", "infosec", "soc", "penetration", "ethical"]):
            return ["Cybersecurity", "Network Security", "Linux", "Python", "Wireshark", "Firewall", "Vulnerability Assessment", "Git"]
        if any(k in t for k in ["python", "backend", "django", "fastapi"]):
            return ["Python", "FastAPI", "SQL", "PostgreSQL", "Docker", "Git", "REST APIs", "AWS"]
        if any(k in t for k in ["react", "frontend", "front-end", "ui", "web"]):
            return ["React", "JavaScript", "TypeScript", "HTML", "CSS", "TailwindCSS", "Git", "REST APIs"]
        if any(k in t for k in ["cloud", "devops", "sre", "infrastructure", "platform", "kubernetes"]):
            return ["AWS", "Docker", "Kubernetes", "Linux", "Terraform", "CI/CD", "Python", "Git"]
        if any(k in t for k in ["data", "machine learning", "ai", "ml", "deep learning"]):
            return ["Python", "Machine Learning", "SQL", "Pandas", "NumPy", "Docker", "Git"]
        if any(k in t for k in ["java", "spring"]):
            return ["Java", "Spring Boot", "SQL", "Microservices", "Docker", "Git", "REST APIs"]
        if any(k in t for k in ["full stack", "fullstack"]):
            return ["React", "Node.js", "Python", "SQL", "JavaScript", "Docker", "Git", "REST APIs"]
        return ["Python", "SQL", "Git", "REST APIs", "Problem Solving"]

    @classmethod
    def infer_education_from_role(cls, role_or_title: str) -> str:
        """Intelligently infer suitable educational qualification based on candidate role."""
        if not role_or_title:
            return "B.Tech in Computer Science"
        t = role_or_title.lower()
        if any(k in t for k in ["cyber", "security"]):
            return "B.Tech in Information Security / Computer Science"
        return "B.Tech in Computer Science"

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
    def validate_resume_document(cls, text: str) -> Dict[str, Any]:
        """
        Validate whether the uploaded document has genuine resume structure,
        or is a non-resume / invalid document.
        """
        if not text or len(text.strip()) < 30:
            return {
                "is_valid": False,
                "authenticity_score": 10,
                "verdict": "INVALID_EMPTY_OR_UNREADABLE",
                "detected_sections": [],
                "missing_sections": ["Contact", "Skills", "Experience/Projects", "Education"],
                "reason": "The uploaded document contains insufficient or unreadable text."
            }

        t_lower = text.lower()
        words = re.findall(r'\b\w+\b', text)
        word_count = len(words)

        if word_count < 20:
            return {
                "is_valid": False,
                "authenticity_score": 20,
                "verdict": "INVALID_INSUFFICIENT_CONTENT",
                "detected_sections": [],
                "missing_sections": ["Contact", "Skills", "Experience/Projects", "Education"],
                "reason": f"Document contains only {word_count} words, which is insufficient for professional evaluation."
            }

        detected_sections = []
        missing_sections = []

        # 1. Contact Section
        has_email = bool(cls.extract_email(text))
        has_phone = bool(cls.extract_phone(text))
        if has_email or has_phone or any(k in t_lower for k in ["contact", "email", "phone", "linkedin", "github", "@"]):
            detected_sections.append("Contact Information")
        else:
            missing_sections.append("Contact Information")

        # 2. Skills Section
        extracted_skills = cls.extract_skills(text)
        if len(extracted_skills) >= 1 or any(k in t_lower for k in ["skills", "technologies", "tools", "competencies", "languages"]):
            detected_sections.append("Skills & Technologies")
        else:
            missing_sections.append("Skills & Technologies")

        # 3. Experience / Projects / Internships Section
        if any(w in t_lower for w in ["experience", "project", "projects", "intern", "internship", "work history", "employment", "labs", "work experience", "responsibilities"]):
            detected_sections.append("Experience / Projects")
        else:
            missing_sections.append("Experience / Projects")

        # 4. Education / Academics Section
        if any(w in t_lower for w in ["education", "academic", "academics", "degree", "university", "college", "school", "b.tech", "b.e", "bachelor", "master", "m.tech", "mca", "b.sc", "bca"]):
            detected_sections.append("Education & Credentials")
        else:
            missing_sections.append("Education & Credentials")

        score = 25 + (len(detected_sections) * 15)
        if len(extracted_skills) >= 3:
            score += 10
        if has_email and has_phone:
            score += 5
        score = min(100, max(20, score))

        is_valid = (len(detected_sections) >= 2) and (len(extracted_skills) >= 1 or has_email or has_phone)

        if is_valid and score >= 65:
            verdict = "VERIFIED_AUTHENTIC_RESUME"
            reason = "Document passed resume structural and section validation."
        elif is_valid:
            verdict = "PARTIAL_RESUME_STRUCTURE"
            reason = "Document recognized as resume but missing some standard career sections."
        else:
            verdict = "INVALID_NON_RESUME_DOCUMENT"
            reason = "Document lacks essential resume sections (skills, experience/projects, or contact info)."

        return {
            "is_valid": is_valid,
            "authenticity_score": score,
            "verdict": verdict,
            "detected_sections": detected_sections,
            "missing_sections": missing_sections,
            "reason": reason,
            "word_count": word_count
        }

    @classmethod
    def analyze_resume_lines(cls, text: str) -> List[Dict[str, Any]]:
        """
        Perform in-depth line-by-line inspection of resume content.
        Evaluates impact, action verbs, quantifiable metrics, skills detected,
        and provides instant actionable rewrite guidance.
        """
        if not text:
            return []

        raw_lines = [l.strip() for l in text.splitlines() if l.strip()]
        analyzed_lines = []

        metric_regex = r'(\b\d+(?:\.\d+)?%|\b\d+\+|\$\d+[\d,]*|\b\d+\s*(?:ms|sec|hours|users|endpoints|servers|apis|projects|clients|cves|vulnerabilities)\b|\b\d+x\b)'

        for idx, line in enumerate(raw_lines, start=1):
            if len(line) < 4:
                continue

            l_lower = line.lower()
            
            # Check for heading
            if len(line.split()) <= 3 and any(h in l_lower for h in ["education", "experience", "projects", "skills", "summary", "objective", "certifications", "contact"]):
                analyzed_lines.append({
                    "line_number": idx,
                    "text": line,
                    "category": "SECTION_HEADER",
                    "badge": "Header",
                    "badge_color": "purple",
                    "impact_level": "NEUTRAL",
                    "action_verb": None,
                    "has_metric": False,
                    "matched_skills": [],
                    "feedback": "Standard resume section header"
                })
                continue

            # Detect metric
            metric_match = re.search(metric_regex, line, re.IGNORECASE)
            has_metric = bool(metric_match)
            metric_found = metric_match.group(0) if metric_match else None

            # Detect action verb
            action_verb_found = None
            for verb in POWER_ACTION_VERBS:
                if re.search(rf'\b{verb}\b', l_lower):
                    action_verb_found = verb.capitalize()
                    break

            # Detect passive phrase
            passive_phrase_found = None
            for phrase in PASSIVE_WEAK_PHRASES:
                if phrase in l_lower:
                    passive_phrase_found = phrase.capitalize()
                    break

            # Detect technical skills on this line
            line_skills = []
            for s in KNOWN_SKILLS:
                pattern = rf'(?i)(?:\b|(?<=[^a-zA-Z0-9]))' + re.escape(s) + rf'(?:\b|(?=[^a-zA-Z0-9]))'
                if re.search(pattern, line):
                    line_skills.append(s)

            # Determine line category & rewrite suggestion
            if has_metric and action_verb_found:
                category = "STRONG_METRIC_IMPACT"
                badge = "High Impact Result"
                badge_color = "green"
                impact_level = "HIGH"
                feedback = f"Excellent! Combines power action verb ('{action_verb_found}') with measurable metric ('{metric_found}')."
                suggestion = None
            elif action_verb_found:
                category = "ACTION_ORIENTED"
                badge = "Strong Action Verb"
                badge_color = "blue"
                impact_level = "MEDIUM"
                feedback = f"Good action verb ('{action_verb_found}'). Consider quantifying the result with a metric (e.g. % improvement or count)."
                suggestion = f"Enhance with a quantifiable metric (e.g., '{line} - resulting in ~30% improvement')."
            elif passive_phrase_found:
                category = "WEAK_PASSIVE"
                badge = "Passive / Weak Verb"
                badge_color = "red"
                impact_level = "LOW"
                feedback = f"Passive phrasing ('{passive_phrase_found}') weakens your accomplishments. Replace with an active power verb."
                suggestion = f"Replace '{passive_phrase_found}' with a power verb (e.g., 'Implemented', 'Engineered', 'Spearheaded')."
            elif line_skills:
                category = "KEYWORD_SKILL"
                badge = "Skill Keywords"
                badge_color = "cyan"
                impact_level = "MEDIUM"
                feedback = f"Contains technical keywords: {', '.join(line_skills[:3])}."
                suggestion = None
            else:
                category = "DESCRIPTIVE"
                badge = "Descriptive"
                badge_color = "gray"
                impact_level = "NEUTRAL"
                feedback = "General descriptive statement."
                suggestion = None

            analyzed_lines.append({
                "line_number": idx,
                "text": line,
                "category": category,
                "badge": badge,
                "badge_color": badge_color,
                "impact_level": impact_level,
                "action_verb": action_verb_found,
                "passive_phrase": passive_phrase_found,
                "has_metric": has_metric,
                "metric_found": metric_found,
                "matched_skills": line_skills,
                "feedback": feedback,
                "suggestion": suggestion
            })

        return analyzed_lines

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
        location = cls.extract_location(raw_text)
        doc_validation = cls.validate_resume_document(raw_text)
        line_analysis = cls.analyze_resume_lines(raw_text)

        return {
            "name": name,
            "email": email,
            "phone": phone,
            "location": location,
            "skills": skills,
            "education": education,
            "years_of_experience": experience_years,
            "current_title": current_title,
            "document_validation": doc_validation,
            "line_analysis": line_analysis,
            "raw_text": raw_text,
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
        location = cls.extract_location(raw_text)
        doc_validation = cls.validate_resume_document(raw_text)
        line_analysis = cls.analyze_resume_lines(raw_text)

        return {
            "name": name,
            "email": email,
            "phone": phone,
            "location": location,
            "skills": skills,
            "education": education,
            "years_of_experience": experience_years,
            "current_title": current_title,
            "document_validation": doc_validation,
            "line_analysis": line_analysis,
            "raw_text": raw_text,
            "extracted_text_preview": raw_text[:500] if raw_text else "",
            "filename": file_path.name,
            "status": "processed"
        }
