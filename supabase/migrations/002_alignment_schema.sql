-- Migration 002: Strict Alignment Updates
-- Run this in Supabase SQL Editor

-- 1. Add is_active to profiles
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;

-- 2. Create Audit Logs Table
CREATE TABLE IF NOT EXISTS audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
    action TEXT NOT NULL,
    entity_type TEXT NOT NULL,
    entity_id UUID,
    details JSONB DEFAULT '{}'::jsonb,
    ip_address TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Create Evaluations Table
CREATE TABLE IF NOT EXISTS evaluations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    student_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    mentor_id UUID NOT NULL REFERENCES profiles(id) ON DELETE SET NULL,
    project_id UUID REFERENCES projects(id) ON DELETE SET NULL,
    score INTEGER CHECK (score BETWEEN 0 AND 100),
    criteria JSONB DEFAULT '{}'::jsonb, -- Store detailed breakdown e.g. {"quality": 4, "timeliness": 5}
    comments TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(student_id, project_id, mentor_id) -- Prevent duplicate evaluations for same project context
);

-- 4. RLS for Audit Logs
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view all audit logs" ON audit_logs FOR SELECT USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);

CREATE POLICY "System can insert audit logs" ON audit_logs FOR INSERT WITH CHECK (true);

-- 5. RLS for Evaluations
ALTER TABLE evaluations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Mentors can create evaluations" ON evaluations FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'mentor')
);

CREATE POLICY "Mentors can view their own evaluations" ON evaluations FOR SELECT USING (
    mentor_id = auth.uid() OR
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);

CREATE POLICY "Students can view their own evaluations" ON evaluations FOR SELECT USING (
    student_id = auth.uid()
);

CREATE POLICY "Mentors can update their own evaluations" ON evaluations FOR UPDATE USING (
    mentor_id = auth.uid()
);

-- 6. Indexes
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON audit_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_evaluations_student_id ON evaluations(student_id);
CREATE INDEX IF NOT EXISTS idx_evaluations_project_id ON evaluations(project_id);
