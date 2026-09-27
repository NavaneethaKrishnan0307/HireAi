-- ==========================================================
-- HireAI Migration V4: Create Supabase Storage Bucket for Resumes
-- Description: Initializes the 'resumes' storage bucket with public read and secure upload policies
-- ==========================================================

-- 1. Create the 'resumes' bucket in the storage schema if it doesn't already exist
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'resumes', 
    'resumes', 
    true, 
    10485760, -- 10 MB limit
    ARRAY['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'application/msword']
)
ON CONFLICT (id) DO UPDATE SET
    public = true,
    file_size_limit = 10485760,
    allowed_mime_types = ARRAY['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'application/msword'];

-- 2. Storage Security Policies

-- Allow public read access to uploaded resumes
CREATE POLICY IF NOT EXISTS "Public Resume Access"
ON storage.objects FOR SELECT
USING (bucket_id = 'resumes');

-- Allow authenticated users / service role to upload resumes
CREATE POLICY IF NOT EXISTS "Authenticated Resume Upload"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'resumes');

-- Allow updating own resumes
CREATE POLICY IF NOT EXISTS "Resume Update Policy"
ON storage.objects FOR UPDATE
USING (bucket_id = 'resumes');

-- Allow deleting resumes
CREATE POLICY IF NOT EXISTS "Resume Delete Policy"
ON storage.objects FOR DELETE
USING (bucket_id = 'resumes');
