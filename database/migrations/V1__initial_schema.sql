-- ==========================================================
-- HireAI Migration V1: Initial Core Schema
-- Description: Core tables for Users, Profiles, Jobs, Applications & Explainable Matching
-- ==========================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. USERS TABLE
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(50) NOT NULL CHECK (role IN ('candidate', 'hr')),
    full_name VARCHAR(255) NOT NULL,
    avatar_url TEXT DEFAULT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 2. CANDIDATES TABLE
CREATE TABLE IF NOT EXISTS candidates (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    phone VARCHAR(50),
    location VARCHAR(255),
    current_title VARCHAR(255),
    years_of_experience NUMERIC(4, 1) DEFAULT 0.0,
    education VARCHAR(255),
    resume_url TEXT,
    resume_filename VARCHAR(255),
    resume_status VARCHAR(50) DEFAULT 'unprocessed' CHECK (resume_status IN ('unprocessed', 'processing', 'processed', 'failed')),
    resume_parsed_at TIMESTAMP WITH TIME ZONE,
    parsed_skills JSONB DEFAULT '[]'::jsonb,
    parsed_data JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 3. HR USERS TABLE
CREATE TABLE IF NOT EXISTS hr_users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    company_name VARCHAR(255) DEFAULT 'TechCorp Inc.',
    department VARCHAR(255) DEFAULT 'Talent Acquisition',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 4. JOBS TABLE
CREATE TABLE IF NOT EXISTS jobs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    hr_id UUID REFERENCES hr_users(id) ON DELETE SET NULL,
    title VARCHAR(255) NOT NULL,
    company VARCHAR(255) NOT NULL DEFAULT 'TechCorp Inc.',
    location VARCHAR(255) NOT NULL,
    min_experience NUMERIC(4, 1) NOT NULL DEFAULT 0.0,
    max_experience NUMERIC(4, 1),
    min_salary NUMERIC(12, 2) DEFAULT 0.0,
    max_salary NUMERIC(12, 2) DEFAULT 0.0,
    education_required VARCHAR(255) DEFAULT 'Any Graduate',
    certifications_preferred JSONB DEFAULT '[]'::jsonb,
    description TEXT,
    status VARCHAR(50) DEFAULT 'active' CHECK (status IN ('active', 'closed', 'draft')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 5. JOB REQUIREMENTS TABLE
CREATE TABLE IF NOT EXISTS job_requirements (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    job_id UUID NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
    required_skills JSONB NOT NULL DEFAULT '[]'::jsonb,
    preferred_skills JSONB DEFAULT '[]'::jsonb,
    min_experience_years NUMERIC(4, 1) DEFAULT 0.0,
    education_level VARCHAR(255) DEFAULT 'Any Graduate',
    certification_list JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 6. CANDIDATE SKILLS TABLE
CREATE TABLE IF NOT EXISTS candidate_skills (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    candidate_id UUID NOT NULL REFERENCES candidates(id) ON DELETE CASCADE,
    skill_name VARCHAR(100) NOT NULL,
    proficiency VARCHAR(50) DEFAULT 'Intermediate',
    verified BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 7. APPLICATIONS TABLE
CREATE TABLE IF NOT EXISTS applications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    job_id UUID NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
    candidate_id UUID NOT NULL REFERENCES candidates(id) ON DELETE CASCADE,
    status VARCHAR(50) DEFAULT 'applied' CHECK (status IN ('applied', 'under_review', 'shortlisted', 'rejected', 'hired')),
    applied_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT unique_job_candidate_app UNIQUE (job_id, candidate_id)
);

-- 8. MATCHING RESULTS TABLE
CREATE TABLE IF NOT EXISTS matching_results (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    application_id UUID REFERENCES applications(id) ON DELETE CASCADE,
    job_id UUID NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
    candidate_id UUID NOT NULL REFERENCES candidates(id) ON DELETE CASCADE,
    score NUMERIC(5, 2) NOT NULL,
    skill_match_score NUMERIC(5, 2) NOT NULL,
    experience_match_score NUMERIC(5, 2) NOT NULL,
    education_match_score NUMERIC(5, 2) NOT NULL,
    additional_score NUMERIC(5, 2) NOT NULL,
    rank INT DEFAULT 1,
    matched_skills JSONB DEFAULT '[]'::jsonb,
    missing_skills JSONB DEFAULT '[]'::jsonb,
    explanation JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
