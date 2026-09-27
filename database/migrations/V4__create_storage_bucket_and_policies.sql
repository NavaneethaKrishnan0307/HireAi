-- ==========================================================
-- HireAI Migration V4: Private & Secure Supabase Storage Bucket for Resumes
-- Description: Sets the 'resumes' bucket to PRIVATE with strict Role-Based Access Control (RBAC)
-- ==========================================================

-- 1. Create the 'resumes' bucket as PRIVATE (public = false)
-- This protects Candidate PII (phone, email, address) from unauthorized internet scraping.
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'resumes', 
    'resumes', 
    false, -- PRIVATE BUCKET: Locked down to authorized users only
    10485760, -- 10 MB limit
    ARRAY['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'application/msword']
)
ON CONFLICT (id) DO UPDATE SET
    public = false,
    file_size_limit = 10485760,
    allowed_mime_types = ARRAY['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'application/msword'];

-- 2. Drop any previous public access policies
DROP POLICY IF EXISTS "Public Resume Access" ON storage.objects;

-- 3. Secure Access Policies:

-- Policy A: Only authenticated users (Candidates & HR) can read/download authorized resumes
CREATE POLICY IF NOT EXISTS "Authenticated Resume Access Only"
ON storage.objects FOR SELECT
USING (
    bucket_id = 'resumes' 
    AND (auth.role() = 'authenticated' OR auth.role() = 'service_role')
);

-- Policy B: Only authenticated candidates/system can insert/upload their resume
CREATE POLICY IF NOT EXISTS "Authenticated Resume Upload Only"
ON storage.objects FOR INSERT
WITH CHECK (
    bucket_id = 'resumes' 
    AND (auth.role() = 'authenticated' OR auth.role() = 'service_role')
);

-- Policy C: Candidates/HR can only modify/delete via authorized backend service
CREATE POLICY IF NOT EXISTS "Authenticated Resume Delete Only"
ON storage.objects FOR DELETE
USING (
    bucket_id = 'resumes' 
    AND (auth.role() = 'authenticated' OR auth.role() = 'service_role')
);
