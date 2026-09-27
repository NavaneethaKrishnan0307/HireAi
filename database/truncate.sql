-- ==========================================================
-- HiringAI Truncate Script (Clear all Candidate & HR data)
-- ==========================================================

-- Disable foreign key checks / truncate with cascade
TRUNCATE TABLE matching_results CASCADE;
TRUNCATE TABLE applications CASCADE;
TRUNCATE TABLE candidate_skills CASCADE;
TRUNCATE TABLE job_requirements CASCADE;
TRUNCATE TABLE jobs CASCADE;
TRUNCATE TABLE candidates CASCADE;
TRUNCATE TABLE hr_users CASCADE;
TRUNCATE TABLE users CASCADE;

-- Confirmation
SELECT 'All Candidate and HR tables have been successfully truncated.' AS status;
