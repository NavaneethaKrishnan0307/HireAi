-- ==========================================================
-- HiringAI Supabase Row Level Security (RLS) Policies
-- ==========================================================

-- Enable Row Level Security on all core tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE candidates ENABLE ROW LEVEL SECURITY;
ALTER TABLE hr_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE job_requirements ENABLE ROW LEVEL SECURITY;
ALTER TABLE candidate_skills ENABLE ROW LEVEL SECURITY;
ALTER TABLE applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE matching_results ENABLE ROW LEVEL SECURITY;

-- Note: Since FastAPI acts as the secure backend proxy using the Supabase Service Role / Backend key,
-- these policies secure direct client access while backend service operations operate with explicit validation.

-- 1. JOBS: Active jobs are viewable by anyone authenticated
CREATE POLICY "Public or Authenticated users can view active jobs" 
ON jobs FOR SELECT 
USING (status = 'active');

-- 2. HR users can manage their own jobs
CREATE POLICY "HR users can manage their own jobs" 
ON jobs FOR ALL 
USING (auth.uid() = (SELECT user_id FROM hr_users WHERE hr_users.id = jobs.hr_id));

-- 3. CANDIDATES: Candidates can read & edit their own profile
CREATE POLICY "Candidates can view their own profile" 
ON candidates FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Candidates can update their own profile" 
ON candidates FOR UPDATE 
USING (auth.uid() = user_id);

-- 4. APPLICATIONS: Candidates can view their submitted applications
CREATE POLICY "Candidates can view their applications" 
ON applications FOR SELECT 
USING (auth.uid() = (SELECT user_id FROM candidates WHERE candidates.id = applications.candidate_id));

-- 5. HR can view applications for their jobs
CREATE POLICY "HR can view applications for their posted jobs" 
ON applications FOR SELECT 
USING (EXISTS (
    SELECT 1 FROM jobs 
    JOIN hr_users ON jobs.hr_id = hr_users.id 
    WHERE jobs.id = applications.job_id 
    AND hr_users.user_id = auth.uid()
));

-- 6. MATCHING RESULTS: HR can view matching results for their jobs
CREATE POLICY "HR can view match results for their jobs" 
ON matching_results FOR SELECT 
USING (EXISTS (
    SELECT 1 FROM jobs 
    JOIN hr_users ON jobs.hr_id = hr_users.id 
    WHERE jobs.id = matching_results.job_id 
    AND hr_users.user_id = auth.uid()
));
