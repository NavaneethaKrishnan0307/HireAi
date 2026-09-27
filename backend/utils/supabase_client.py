import logging
import uuid
from typing import Any, Dict, List, Optional
from config import settings

logger = logging.getLogger(__name__)

# Fallback in-memory database storage for development/demo mode when real key is not yet set
class MockQueryBuilder:
    def __init__(self, table_name: str, store: Dict[str, List[Dict[str, Any]]]):
        self.table_name = table_name
        self.store = store
        self._filters = []
        self._order_field = None
        self._order_desc = False
        self._action = "select"
        self._payload = None

    def select(self, columns: str = "*"):
        self._action = "select"
        return self

    def insert(self, data: Any):
        self._action = "insert"
        self._payload = data if isinstance(data, list) else [data]
        return self

    def update(self, data: Dict[str, Any]):
        self._action = "update"
        self._payload = data
        return self

    def delete(self):
        self._action = "delete"
        return self

    def eq(self, column: str, value: Any):
        self._filters.append((column, "eq", str(value)))
        return self

    def neq(self, column: str, value: Any):
        self._filters.append((column, "neq", str(value)))
        return self

    def in_(self, column: str, values: List[Any]):
        self._filters.append((column, "in", [str(v) for v in values]))
        return self

    def order(self, column: str, desc: bool = False):
        self._order_field = column
        self._order_desc = desc
        return self

    def execute(self):
        table_rows = self.store.setdefault(self.table_name, [])
        
        if self._action == "insert":
            inserted = []
            for item in self._payload:
                new_row = dict(item)
                if "id" not in new_row:
                    new_row["id"] = str(uuid.uuid4())
                table_rows.append(new_row)
                inserted.append(new_row)
            return MockResponse(data=inserted)

        # Apply filters
        matched_rows = []
        for row in table_rows:
            matches = True
            for col, op, val in self._filters:
                row_val = str(row.get(col, ""))
                if op == "eq" and row_val != val:
                    matches = False
                    break
                elif op == "neq" and row_val == val:
                    matches = False
                    break
                elif op == "in" and row_val not in val:
                    matches = False
                    break
            if matches:
                matched_rows.append(row)

        if self._action == "update":
            for row in matched_rows:
                row.update(self._payload)
            return MockResponse(data=matched_rows)

        if self._action == "delete":
            for row in matched_rows:
                if row in table_rows:
                    table_rows.remove(row)
            return MockResponse(data=matched_rows)

        # Select action
        result = list(matched_rows)
        if self._order_field:
            result.sort(key=lambda x: x.get(self._order_field, 0), reverse=self._order_desc)

        return MockResponse(data=result)


class MockResponse:
    def __init__(self, data: Any):
        self.data = data


class MockSupabaseClient:
    def __init__(self):
        self.store: Dict[str, List[Dict[str, Any]]] = {}
        self._seed_sample_data()

    def table(self, table_name: str):
        return MockQueryBuilder(table_name, self.store)

    def _seed_sample_data(self):
        # Seed realistic users
        self.store["users"] = [
            {
                "id": "a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11",
                "email": "hr@techcorp.com",
                "password_hash": "$2b$12$K.zT7rZfN7bS09h7Z8q2UOn5Kmsr5tGk8RkH0O1F8e.xT9i1s4YWW",
                "role": "hr",
                "full_name": "Sarah Jenkins",
                "avatar_url": "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80"
            },
            {
                "id": "b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a22",
                "email": "rahul.sharma@email.com",
                "password_hash": "$2b$12$K.zT7rZfN7bS09h7Z8q2UOn5Kmsr5tGk8RkH0O1F8e.xT9i1s4YWW",
                "role": "candidate",
                "full_name": "Rahul Sharma",
                "avatar_url": "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80"
            },
            {
                "id": "c0eebc99-9c0b-4ef8-bb6d-6bb9bd380a33",
                "email": "priya.nair@email.com",
                "password_hash": "$2b$12$K.zT7rZfN7bS09h7Z8q2UOn5Kmsr5tGk8RkH0O1F8e.xT9i1s4YWW",
                "role": "candidate",
                "full_name": "Priya Nair",
                "avatar_url": "https://images.unsplash.com/photo-1580489944761-15a19d654956?w=150&auto=format&fit=crop&q=80"
            },
            {
                "id": "d0eebc99-9c0b-4ef8-bb6d-6bb9bd380a44",
                "email": "arjun.verma@email.com",
                "password_hash": "$2b$12$K.zT7rZfN7bS09h7Z8q2UOn5Kmsr5tGk8RkH0O1F8e.xT9i1s4YWW",
                "role": "candidate",
                "full_name": "Arjun Verma",
                "avatar_url": "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80"
            },
            {
                "id": "e0eebc99-9c0b-4ef8-bb6d-6bb9bd380a55",
                "email": "candidate@demo.com",
                "password_hash": "$2b$12$K.zT7rZfN7bS09h7Z8q2UOn5Kmsr5tGk8RkH0O1F8e.xT9i1s4YWW",
                "role": "candidate",
                "full_name": "John Doe",
                "avatar_url": "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80"
            },
            {
                "id": "9655cd40-8424-4204-94ba-77a433bfe923",
                "email": "joe@example.com",
                "password_hash": "$2b$12$K.zT7rZfN7bS09h7Z8q2UOn5Kmsr5tGk8RkH0O1F8e.xT9i1s4YWW",
                "role": "candidate",
                "full_name": "Joe",
                "avatar_url": "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80"
            }
        ]

        self.store["hr_users"] = [
            {
                "id": "f0eebc99-9c0b-4ef8-bb6d-6bb9bd380a01",
                "user_id": "a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11",
                "company_name": "TechCorp Solutions",
                "department": "Engineering Recruitment"
            }
        ]

        self.store["candidates"] = [
            {
                "id": "11111111-1111-1111-1111-111111111111",
                "user_id": "b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a22",
                "phone": "+91 9876543210",
                "location": "Bangalore",
                "current_title": "Senior Python Developer",
                "years_of_experience": 4.5,
                "education": "B.Tech in Computer Science",
                "resume_filename": "Rahul_Sharma_Resume.pdf",
                "resume_status": "processed",
                "resume_url": "/uploads/resumes/Rahul_Sharma_Resume.pdf",
                "parsed_skills": ["Python", "SQL", "AWS", "FastAPI", "Docker", "PostgreSQL", "Git"]
            },
            {
                "id": "22222222-2222-2222-2222-222222222222",
                "user_id": "c0eebc99-9c0b-4ef8-bb6d-6bb9bd380a33",
                "phone": "+91 9876543211",
                "location": "Chennai",
                "current_title": "Backend Engineer",
                "years_of_experience": 3.8,
                "education": "B.E. in Information Technology",
                "resume_filename": "Priya_Nair_Resume.pdf",
                "resume_status": "processed",
                "resume_url": "/uploads/resumes/Priya_Nair_Resume.pdf",
                "parsed_skills": ["Python", "Django", "SQL", "REST APIs", "Redis", "HTML/CSS"]
            },
            {
                "id": "33333333-3333-3333-3333-333333333333",
                "user_id": "d0eebc99-9c0b-4ef8-bb6d-6bb9bd380a44",
                "phone": "+91 9876543212",
                "location": "Hyderabad",
                "current_title": "Full Stack Developer",
                "years_of_experience": 5.2,
                "education": "MCA (Master of Computer Applications)",
                "resume_filename": "Arjun_Verma_Resume.pdf",
                "resume_status": "processed",
                "resume_url": "/uploads/resumes/Arjun_Verma_Resume.pdf",
                "parsed_skills": ["Java", "Spring", "SQL", "React", "JavaScript", "Microservices"]
            },
            {
                "id": "44444444-4444-4444-4444-444444444444",
                "user_id": "e0eebc99-9c0b-4ef8-bb6d-6bb9bd380a55",
                "phone": "+91 9876543213",
                "location": "Bangalore",
                "current_title": "Software Engineer",
                "years_of_experience": 2.0,
                "education": "B.Tech in Computer Science",
                "resume_filename": "John_Doe_Resume.pdf",
                "resume_status": "processed",
                "resume_url": "/uploads/resumes/John_Doe_Resume.pdf",
                "parsed_skills": ["Python", "SQL", "FastAPI", "React", "Git"]
            },
            {
                "id": "8f53fa1e-997e-4959-bde1-f84b718296b8",
                "user_id": "9655cd40-8424-4204-94ba-77a433bfe923",
                "phone": "+91 9876543299",
                "location": "Bangalore",
                "current_title": "Cybersecurity Intern",
                "years_of_experience": 0.5,
                "education": "B.Tech in Information Security",
                "resume_filename": "Joe_Resume.pdf",
                "resume_status": "processed",
                "resume_url": "/uploads/resumes/Joe_Resume.pdf",
                "parsed_skills": ["Cybersecurity", "Network Security", "Wireshark", "Nmap", "Linux"]
            }
        ]

        self.store["jobs"] = [
            {
                "id": "55555555-5555-5555-5555-555555555551",
                "hr_id": "f0eebc99-9c0b-4ef8-bb6d-6bb9bd380a01",
                "title": "Senior Python Developer",
                "company": "TechCorp Solutions",
                "location": "Bangalore",
                "min_experience": 3.0,
                "max_experience": 7.0,
                "min_salary": 1200000.00,
                "max_salary": 2000000.00,
                "education_required": "B.E./B.Tech in CSE or equivalent",
                "certifications_preferred": ["AWS Certified Developer"],
                "description": "Looking for an experienced Python developer with strong SQL, API, and cloud expertise.",
                "status": "active"
            },
            {
                "id": "55555555-5555-5555-5555-555555555552",
                "hr_id": "f0eebc99-9c0b-4ef8-bb6d-6bb9bd380a01",
                "title": "Full Stack Engineer (Python & React)",
                "company": "TechCorp Solutions",
                "location": "Chennai",
                "min_experience": 2.0,
                "max_experience": 5.0,
                "min_salary": 900000.00,
                "max_salary": 1500000.00,
                "education_required": "Bachelor Degree in Engineering or CS",
                "certifications_preferred": [],
                "description": "Develop scalable web applications utilizing Python FastAPI backend and modern React frontend.",
                "status": "active"
            },
            {
                "id": "55555555-5555-5555-5555-555555555553",
                "hr_id": "f0eebc99-9c0b-4ef8-bb6d-6bb9bd380a01",
                "title": "Java Spring Boot Architect",
                "company": "TechCorp Solutions",
                "location": "Hyderabad",
                "min_experience": 4.0,
                "max_experience": 8.0,
                "min_salary": 1500000.00,
                "max_salary": 2500000.00,
                "education_required": "B.Tech/MCA",
                "certifications_preferred": ["Oracle Java Certified"],
                "description": "Architect high-throughput microservices using Java Spring Boot and enterprise relational databases.",
                "status": "active"
            }
        ]

        self.store["job_requirements"] = [
            {
                "id": "req-1",
                "job_id": "55555555-5555-5555-5555-555555555551",
                "required_skills": ["Python", "SQL", "AWS"],
                "preferred_skills": ["Docker", "FastAPI", "PostgreSQL"],
                "min_experience_years": 3.0,
                "education_level": "B.Tech/B.E.",
                "certification_list": ["AWS"]
            },
            {
                "id": "req-2",
                "job_id": "55555555-5555-5555-5555-555555555552",
                "required_skills": ["Python", "React", "SQL"],
                "preferred_skills": ["FastAPI", "TailwindCSS", "Git"],
                "min_experience_years": 2.0,
                "education_level": "B.Tech/B.E./B.Sc CS",
                "certification_list": []
            },
            {
                "id": "req-3",
                "job_id": "55555555-5555-5555-5555-555555555553",
                "required_skills": ["Java", "Spring", "SQL"],
                "preferred_skills": ["Microservices", "Docker", "Kubernetes"],
                "min_experience_years": 4.0,
                "education_level": "B.Tech/MCA",
                "certification_list": ["Java"]
            }
        ]

        self.store["applications"] = [
            {
                "id": "66666666-6666-6666-6666-666666666661",
                "job_id": "55555555-5555-5555-5555-555555555551",
                "candidate_id": "11111111-1111-1111-1111-111111111111",
                "status": "shortlisted",
                "applied_at": "2025-07-19T10:00:00Z"
            },
            {
                "id": "66666666-6666-6666-6666-666666666662",
                "job_id": "55555555-5555-5555-5555-555555555551",
                "candidate_id": "22222222-2222-2222-2222-222222222222",
                "status": "under_review",
                "applied_at": "2025-07-20T11:30:00Z"
            },
            {
                "id": "66666666-6666-6666-6666-666666666663",
                "job_id": "55555555-5555-5555-5555-555555555551",
                "candidate_id": "33333333-3333-3333-3333-333333333333",
                "status": "applied",
                "applied_at": "2025-07-21T09:15:00Z"
            },
            {
                "id": "66666666-6666-6666-6666-666666666664",
                "job_id": "55555555-5555-5555-5555-555555555552",
                "candidate_id": "44444444-4444-4444-4444-444444444444",
                "status": "applied",
                "applied_at": "2025-07-22T14:45:00Z"
            }
        ]


_client_instance = None

def get_supabase():
    """
    Initialize or return the cached Supabase client.
    If valid credentials are provided, connects to real Supabase.
    Otherwise, gracefully utilizes the local structured database adapter.
    """
    global _client_instance
    if _client_instance is not None:
        return _client_instance

    if settings.is_supabase_configured():
        try:
            from supabase import create_client
            _client_instance = create_client(settings.SUPABASE_URL, settings.SUPABASE_KEY)
            logger.info("Connected to Supabase PostgreSQL at %s", settings.SUPABASE_URL)
            return _client_instance
        except Exception as e:
            logger.error("Failed to initialize Supabase client: %s. Falling back to local store.", e)

    # Use local structured store if credentials are not yet configured
    logger.info("Running with local database adapter (Supabase secret key pending in .env).")
    _client_instance = MockSupabaseClient()
    return _client_instance
