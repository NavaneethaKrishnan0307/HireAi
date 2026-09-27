# HiringAI – AI-Based Recruitment System

An end-to-end recruitment platform powered by **Explainable, Rule-Based AI**, deterministic multi-criteria candidate ranking, non-ML document parsing, and modern React frontends tailored specifically for Candidates and HR Recruiters.

---

## 1. Project Overview
**HiringAI** streamlines the modern hiring pipeline by matching candidates to job openings using deterministic knowledge representation and logic-driven rule engines rather than unpredictable black-box machine learning models. Every candidate score is 100% explainable, traceable, and unbiased.

---

## 2. Features
- **Candidate Portal (Resume Screener)**:
  - Drag-and-drop resume upload (PDF & DOCX).
  - Automated non-ML text and metadata extraction (Skills, Experience, Education, Contact).
  - Profile management and skill verification.
  - Job exploration with real-time match percentage calculation.
  - Application submission and live pipeline status tracking.
- **HR Recruiter Portal (HR Dashboard)**:
  - Multi-parameter **Job Find** candidate search.
  - Job posting and requirement constraint specification.
  - Deterministic candidate ranking against job openings.
  - Interactive **Explainable AI Match Breakdown** modal with granular rule proofs and criterion scores.
  - Real-time candidate shortlisting, review, and rejection.
  - Talent directory and application pipeline management.

---

## 3. Technology Stack
- **Candidate Frontend**: React 18, Vite, React Router 6, Lucide Icons, Pure CSS.
- **HR Frontend**: React 18, Vite, React Router 6, Lucide Icons, Pure CSS.
- **Backend API**: Python 3.10+, FastAPI, Uvicorn, Pydantic v2, python-dotenv, PyJWT, passlib/bcrypt.
- **Document & Resume Parser**: PyPDF2, pdfplumber, python-docx (Zero ML / Zero DL).
- **Database**: Supabase / PostgreSQL with Row-Level Security (RLS).
- **Testing**: pytest, httpx.

---

## 4. Architecture

```
Candidate React UI (Port 5173) ──┐
                                  ├──> FastAPI Backend (Port 8000) ──> Supabase PostgreSQL
HR Recruiter React UI (Port 5174)─┘
```

> **Security Guarantee**:
> - React apps **NEVER** communicate directly with Supabase using the Secret Key.
> - Only the FastAPI backend loads the Supabase Secret Key from the local `.env` file.

---

## 5. Exact Folder Structure

```
HiringAI/
├── app.py
├── config.py
├── requirements.txt
├── .env
├── .gitignore
├── README.md
│
├── database/
│   ├── schema.sql
│   ├── sample_data.sql
│   └── policies.sql
│
├── backend/
│   ├── __init__.py
│   │
│   ├── api/
│   │   ├── __init__.py
│   │   ├── auth.py
│   │   ├── candidate.py
│   │   ├── hr.py
│   │   └── jobs.py
│   │
│   ├── services/
│   │   ├── __init__.py
│   │   ├── resume_parser.py
│   │   ├── skill_matcher.py
│   │   ├── candidate_ranker.py
│   │   └── rule_engine.py
│   │
│   ├── models/
│   │   ├── __init__.py
│   │   ├── candidate.py
│   │   ├── job.py
│   │   └── application.py
│   │
│   └── utils/
│       ├── __init__.py
│       ├── supabase_client.py
│       └── file_handler.py
│
├── frontend/
│   ├── candidate/
│   │   ├── package.json
│   │   ├── vite.config.js
│   │   ├── index.html
│   │   └── src/
│   │       ├── main.jsx
│   │       ├── App.jsx
│   │       ├── App.css
│   │       ├── index.css
│   │       ├── components/
│   │       ├── pages/
│   │       └── services/
│   │
│   └── hr/
│       ├── package.json
│       ├── vite.config.js
│       ├── index.html
│       └── src/
│           ├── main.jsx
│           ├── App.jsx
│           ├── App.css
│           ├── index.css
│           ├── components/
│           ├── pages/
│           └── services/
│
├── uploads/
│   └── resumes/
│
└── tests/
    ├── test_auth.py
    ├── test_resume.py
    └── test_matching.py
```

---

## 6. Supabase Setup
1. Log in to your [Supabase Dashboard](https://supabase.com/dashboard).
2. Open your project or create a new project.

---

## 7. Supabase Project URL Configuration
The project is configured to connect to:
```
https://skfhoxfelwioqejeknbi.supabase.co
```

---

## 8. Secret Key Configuration
Obtain your Supabase **service_role** or **secret key** from `Project Settings > API > Project API keys`.

---

## 9. .env Configuration
Ensure `.env` in the root directory contains:
```env
SUPABASE_URL=https://skfhoxfelwioqejeknbi.supabase.co
SUPABASE_KEY=<YOUR_ACTUAL_SUPABASE_SECRET_KEY>

PORT=8000
HOST=0.0.0.0
JWT_SECRET=your-jwt-secret-key
```
*(Note: `.env` is listed in `.gitignore` and is never committed).*

---

## 10. Database Setup
In the Supabase SQL Editor, run the following script in order:
1. `database/schema.sql` (Creates all tables, constraints, foreign keys, and indexes).
2. `database/sample_data.sql` (Seeds initial candidates, HR users, and jobs).

---

## 11. RLS Policies
Execute `database/policies.sql` in your Supabase SQL editor to enforce Row-Level Security.

---

## 12. Backend Installation
```bash
# In project root
python -m venv venv
# On Windows:
.\venv\Scripts\activate
# On Linux/macOS:
source venv/bin/activate

pip install -r requirements.txt
```

---

## 13. Candidate React Installation
```bash
cd frontend/candidate
npm install
```

---

## 14. HR React Installation
```bash
cd frontend/hr
npm install
```

---

## 15. How to Run FastAPI Backend
```bash
# In project root
uvicorn app:app --reload --port 8000
```
API Documentation will be available at `http://localhost:8000/docs`.

---

## 16. How to Run Candidate Frontend
```bash
cd frontend/candidate
npm run dev
```
Access the Candidate Portal at `http://localhost:5173`.

---

## 17. How to Run HR Frontend
```bash
cd frontend/hr
npm run dev
```
Access the HR Dashboard at `http://localhost:5174`.

---

## 18. API Documentation
- **Authentication**:
  - `POST /api/auth/register` - Create Candidate or HR account
  - `POST /api/auth/login` - Authenticate and obtain JWT
  - `GET /api/auth/me` - Get current session info
- **Candidate Endpoints**:
  - `GET /api/candidate/profile` - Read candidate details
  - `PUT /api/candidate/profile` - Update candidate profile
  - `POST /api/candidate/resume` - Upload & parse resume document
  - `GET /api/candidate/jobs` - Browse jobs with personalized match scores
  - `POST /api/candidate/apply` - Submit job application
  - `GET /api/candidate/applications` - View applied jobs and status
- **HR Endpoints**:
  - `GET /api/hr/dashboard` - Stats, recent jobs, and top candidates
  - `POST /api/hr/search-candidates` - Multi-criteria rule search
  - `GET /api/hr/jobs` - View HR job openings
  - `POST /api/hr/jobs` - Create new job posting
  - `GET /api/hr/jobs/{job_id}/applicants` - Ranked applicant pipeline
  - `GET /api/hr/candidates` - Browse all candidates
  - `POST /api/hr/applications/{application_id}/status` - Shortlist or reject

---

## 19. Explainable AI Algorithms Used
HiringAI strictly uses **Explainable AI (XAI)** principles without black-box neural networks:
1. **Constraint Satisfaction & Knowledge Representation**: Skill taxonomies and education hierarchies.
2. **Heuristic Evaluation**: Experience ratio analysis and degree tier matching.
3. **Deterministic Multi-Criteria Scoring**:
   $$\text{Score} = (0.50 \times \text{Skill}) + (0.25 \times \text{Experience}) + (0.15 \times \text{Education}) + (0.10 \times \text{Certifications})$$

---

## 20. Resume Parsing (`backend/services/resume_parser.py`)
- Extracts raw text using PyPDF2, pdfplumber, and python-docx.
- Deterministic regex for email, phone, and experience duration calculation.
- Word boundary taxonomy matching against 40+ known technical skills.

---

## 21. Skill Matching (`backend/services/skill_matcher.py`)
- Skill alias normalization (e.g. `ReactJS` $\to$ `React`, `Postgres` $\to$ `PostgreSQL`).
- Calculates required skill coverage ratio, missing skills list, and preferred skill bonus.

---

## 22. Candidate Ranking (`backend/services/candidate_ranker.py`)
- Ranks candidate pools deterministically.
- Generates human-readable proofs (e.g. `✓ Python matched`, `✓ Experience satisfied`).

---

## 23. Rule Engine (`backend/services/rule_engine.py`)
- Explicit first-order logic rules for experience thresholds, education qualification tiers, and certification satisfaction.

---

## 24. Testing
Run the automated test suite:
```bash
pytest tests/ -v
```

---

## 25. Security & Best Practices
- Supabase secret credentials exist only in the backend environment.
- Passwords hashed with bcrypt.
- JWT tokens signed with secure server secrets.
- Resume uploads restricted to `.pdf` and `.docx` under 10MB.
