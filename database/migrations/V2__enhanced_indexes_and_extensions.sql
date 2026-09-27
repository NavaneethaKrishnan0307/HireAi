-- ==========================================================
-- HireAI Migration V2: Performance Indexes and Integrity Constraints
-- Description: Adds high-performance lookup indexes and JSONB indexing for skill searches
-- ==========================================================

-- Performance Indexes
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_candidates_user_id ON candidates(user_id);
CREATE INDEX IF NOT EXISTS idx_candidates_resume_status ON candidates(resume_status);
CREATE INDEX IF NOT EXISTS idx_jobs_status ON jobs(status);
CREATE INDEX IF NOT EXISTS idx_jobs_location ON jobs(location);
CREATE INDEX IF NOT EXISTS idx_jobs_hr_id ON jobs(hr_id);
CREATE INDEX IF NOT EXISTS idx_applications_job_id ON applications(job_id);
CREATE INDEX IF NOT EXISTS idx_applications_candidate_id ON applications(candidate_id);
CREATE INDEX IF NOT EXISTS idx_applications_status ON applications(status);
CREATE INDEX IF NOT EXISTS idx_matching_job_id ON matching_results(job_id);
CREATE INDEX IF NOT EXISTS idx_matching_candidate_id ON matching_results(candidate_id);
CREATE INDEX IF NOT EXISTS idx_matching_score ON matching_results(score DESC);

-- GIN Indexes for fast JSONB querying of candidate skills & job requirements
CREATE INDEX IF NOT EXISTS idx_candidates_parsed_skills ON candidates USING gin (parsed_skills);
CREATE INDEX IF NOT EXISTS idx_job_requirements_required_skills ON job_requirements USING gin (required_skills);
