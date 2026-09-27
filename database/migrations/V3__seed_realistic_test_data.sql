-- ==========================================================
-- HireAI Migration V3: Seed Realistic Test Data
-- Password corresponds to bcrypt of 'Password123!'
-- ==========================================================

-- 1. Insert Users (HR & Candidates)
INSERT INTO users (id, email, password_hash, role, full_name, avatar_url)
VALUES 
    ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'hr@techcorp.com', '$2b$12$e868d4f43403b22fb4e0f.p/94iG0gQh5Vl643y9N0k8l8HjZ9i.O', 'hr', 'Sarah Jenkins (HR)', 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80'),
    ('b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a22', 'rahul.sharma@email.com', '$2b$12$e868d4f43403b22fb4e0f.p/94iG0gQh5Vl643y9N0k8l8HjZ9i.O', 'candidate', 'Rahul Sharma', 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80'),
    ('c0eebc99-9c0b-4ef8-bb6d-6bb9bd380a33', 'priya.nair@email.com', '$2b$12$e868d4f43403b22fb4e0f.p/94iG0gQh5Vl643y9N0k8l8HjZ9i.O', 'candidate', 'Priya Nair', 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=150&auto=format&fit=crop&q=80'),
    ('d0eebc99-9c0b-4ef8-bb6d-6bb9bd380a44', 'arjun.verma@email.com', '$2b$12$e868d4f43403b22fb4e0f.p/94iG0gQh5Vl643y9N0k8l8HjZ9i.O', 'candidate', 'Arjun Verma', 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80'),
    ('e0eebc99-9c0b-4ef8-bb6d-6bb9bd380a55', 'candidate@demo.com', '$2b$12$e868d4f43403b22fb4e0f.p/94iG0gQh5Vl643y9N0k8l8HjZ9i.O', 'candidate', 'John Doe', 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80')
ON CONFLICT (email) DO NOTHING;

-- 2. Insert HR Profiles
INSERT INTO hr_users (id, user_id, company_name, department)
VALUES 
    ('f0eebc99-9c0b-4ef8-bb6d-6bb9bd380a01', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'TechCorp Solutions', 'Engineering Recruitment')
ON CONFLICT DO NOTHING;

-- 3. Insert Candidate Profiles
INSERT INTO candidates (id, user_id, phone, location, current_title, years_of_experience, education, resume_filename, resume_status, parsed_skills)
VALUES 
    ('11111111-1111-1111-1111-111111111111', 'b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a22', '+91 9876543210', 'Bangalore', 'Senior Python Developer', 4.5, 'B.Tech in Computer Science', 'Rahul_Sharma_Resume.pdf', 'processed', '["Python", "SQL", "AWS", "FastAPI", "Docker", "PostgreSQL", "Git"]'::jsonb),
    ('22222222-2222-2222-2222-222222222222', 'c0eebc99-9c0b-4ef8-bb6d-6bb9bd380a33', '+91 9876543211', 'Chennai', 'Backend Engineer', 3.8, 'B.E. in Information Technology', 'Priya_Nair_Resume.pdf', 'processed', '["Python", "Django", "SQL", "REST APIs", "Redis", "HTML/CSS"]'::jsonb),
    ('33333333-3333-3333-3333-333333333333', 'd0eebc99-9c0b-4ef8-bb6d-6bb9bd380a44', '+91 9876543212', 'Hyderabad', 'Full Stack Developer', 5.2, 'MCA (Master of Computer Applications)', 'Arjun_Verma_Resume.pdf', 'processed', '["Java", "Spring", "SQL", "React", "JavaScript", "Microservices"]'::jsonb),
    ('44444444-4444-4444-4444-444444444444', 'e0eebc99-9c0b-4ef8-bb6d-6bb9bd380a55', '+91 9876543213', 'Bangalore', 'Junior Software Engineer', 2.0, 'B.Tech in Computer Science', 'John_Doe_Resume.pdf', 'processed', '["Python", "SQL", "FastAPI", "React", "Git"]'::jsonb)
ON CONFLICT DO NOTHING;

-- 4. Insert Sample Jobs
INSERT INTO jobs (id, hr_id, title, company, location, min_experience, max_experience, min_salary, max_salary, education_required, certifications_preferred, description, status)
VALUES 
    ('55555555-5555-5555-5555-555555555551', 'f0eebc99-9c0b-4ef8-bb6d-6bb9bd380a01', 'Senior Python Developer', 'TechCorp Solutions', 'Bangalore', 3.0, 7.0, 1200000.00, 2000000.00, 'B.E./B.Tech in CSE or equivalent', '["AWS Certified Developer"]'::jsonb, 'Looking for an experienced Python developer with strong SQL, API, and cloud expertise.', 'active'),
    ('55555555-5555-5555-5555-555555555552', 'f0eebc99-9c0b-4ef8-bb6d-6bb9bd380a01', 'Full Stack Engineer (Python & React)', 'TechCorp Solutions', 'Chennai', 2.0, 5.0, 900000.00, 1500000.00, 'Bachelor Degree in Engineering or CS', '[]'::jsonb, 'Develop scalable web applications utilizing Python FastAPI backend and modern React frontend.', 'active'),
    ('55555555-5555-5555-5555-555555555553', 'f0eebc99-9c0b-4ef8-bb6d-6bb9bd380a01', 'Java Spring Boot Architect', 'TechCorp Solutions', 'Hyderabad', 4.0, 8.0, 1500000.00, 2500000.00, 'B.Tech/MCA', '["Oracle Java Certified"]'::jsonb, 'Architect high-throughput microservices using Java Spring Boot and enterprise relational databases.', 'active')
ON CONFLICT DO NOTHING;

-- 5. Insert Job Requirements
INSERT INTO job_requirements (job_id, required_skills, preferred_skills, min_experience_years, education_level, certification_list)
VALUES 
    ('55555555-5555-5555-5555-555555555551', '["Python", "SQL", "AWS"]'::jsonb, '["Docker", "FastAPI", "PostgreSQL"]'::jsonb, 3.0, 'B.Tech/B.E.', '["AWS"]'::jsonb),
    ('55555555-5555-5555-5555-555555555552', '["Python", "React", "SQL"]'::jsonb, '["FastAPI", "TailwindCSS", "Git"]'::jsonb, 2.0, 'B.Tech/B.E./B.Sc CS', '[]'::jsonb),
    ('55555555-5555-5555-5555-555555555553', '["Java", "Spring", "SQL"]'::jsonb, '["Microservices", "Docker", "Kubernetes"]'::jsonb, 4.0, 'B.Tech/MCA', '["Java"]'::jsonb)
ON CONFLICT DO NOTHING;

-- 6. Insert Applications
INSERT INTO applications (id, job_id, candidate_id, status)
VALUES 
    ('66666666-6666-6666-6666-666666666661', '55555555-5555-5555-5555-555555555551', '11111111-1111-1111-1111-111111111111', 'shortlisted'),
    ('66666666-6666-6666-6666-666666666662', '55555555-5555-5555-5555-555555555551', '22222222-2222-2222-2222-222222222222', 'under_review'),
    ('66666666-6666-6666-6666-666666666663', '55555555-5555-5555-5555-555555555551', '33333333-3333-3333-3333-333333333333', 'applied'),
    ('66666666-6666-6666-6666-666666666664', '55555555-5555-5555-5555-555555555552', '44444444-4444-4444-4444-444444444444', 'applied')
ON CONFLICT DO NOTHING;
