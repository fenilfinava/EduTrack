-- Migration 003: Fix Visibility and RLS
-- Run this in Supabase SQL Editor

-- ============================================
-- 1. FIX COMMENTS RLS
-- ============================================

-- Drop existing restrictive policies
DROP POLICY IF EXISTS "Users can view comments on accessible tasks" ON comments;
DROP POLICY IF EXISTS "Users can create comments on accessible tasks" ON comments;

-- Create new comprehensive read policy
CREATE POLICY "Users can view comments on accessible tasks" ON comments FOR SELECT USING (
  -- 1. Admin can see all
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  OR
  -- 2. Project Member can see
  EXISTS (
    SELECT 1 FROM tasks t
    JOIN project_members pm ON pm.project_id = t.project_id
    WHERE t.id = comments.task_id AND pm.user_id = auth.uid()
  )
  OR
  -- 3. Mentor of the Team assigned to the Project can see
  EXISTS (
    SELECT 1 FROM tasks t
    JOIN projects p ON p.id = t.project_id
    JOIN teams tm ON tm.id = p.team_id
    WHERE t.id = comments.task_id AND tm.mentor_id = auth.uid()
  )
);

-- Create new comprehensive insert policy
CREATE POLICY "Users can create comments on accessible tasks" ON comments FOR INSERT WITH CHECK (
  -- 1. Admin can create
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  OR
  -- 2. Project Member can create
  EXISTS (
    SELECT 1 FROM tasks t
    JOIN project_members pm ON pm.project_id = t.project_id
    WHERE t.id = comments.task_id AND pm.user_id = auth.uid()
  )
  OR
  -- 3. Mentor of the Team assigned to the Project can create
  EXISTS (
    SELECT 1 FROM tasks t
    JOIN projects p ON p.id = t.project_id
    JOIN teams tm ON tm.id = p.team_id
    WHERE t.id = comments.task_id AND tm.mentor_id = auth.uid()
  )
);

-- ============================================
-- 2. FIX PROJECTS RLS (Restrict Mentors)
-- ============================================

-- Drop permissive policy
DROP POLICY IF EXISTS "Users can view projects they're members of" ON projects;

-- Create strict policy
CREATE POLICY "Strict Project Visibility" ON projects FOR SELECT USING (
  -- 1. Admin can see all
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  OR
  -- 2. Direct Member can see
  EXISTS (SELECT 1 FROM project_members WHERE project_id = id AND user_id = auth.uid())
  OR
  -- 3. Mentor of the Team assigned to the Project can see
  (team_id IS NOT NULL AND EXISTS (
    SELECT 1 FROM teams WHERE id = projects.team_id AND mentor_id = auth.uid()
  ))
  OR
  -- 4. Creator can see
  created_by = auth.uid()
);

-- ============================================
-- 3. FIX TEAMS RLS (Restrict Mentors)
-- ============================================

ALTER TABLE teams ENABLE ROW LEVEL SECURITY;

-- Drop generic policies if they exist (schema 001 didn't explicitly set them, effectively private or open depending on defaults, assuming we need to set them now)
DROP POLICY IF EXISTS "Admins can view all teams" ON teams;
DROP POLICY IF EXISTS "Mentors can view their own teams" ON teams;
DROP POLICY IF EXISTS "Students can view their teams" ON teams;

CREATE POLICY "Team Visibility" ON teams FOR SELECT USING (
  -- 1. Admin can see all
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  OR
  -- 2. Mentor can see OWN teams
  mentor_id = auth.uid()
  OR
  -- 3. Student can see teams they are MEMBER of
  EXISTS (SELECT 1 FROM team_members WHERE team_id = teams.id AND user_id = auth.uid())
);

-- ============================================
-- 4. FIX MILESTONES RLS (Inherit Project Access)
-- ============================================

DROP POLICY IF EXISTS "Users can view milestones of their projects" ON milestones;

CREATE POLICY "Users can view milestones of their projects" ON milestones FOR SELECT USING (
  -- Check if user can view the parent project (reusing logic or simplified)
  -- 1. Admin
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  OR
  -- 2. Project Member
  EXISTS (SELECT 1 FROM project_members WHERE project_id = milestones.project_id AND user_id = auth.uid())
  OR
  -- 3. Mentor of Project's Team
  EXISTS (
    SELECT 1 FROM projects p
    JOIN teams t ON t.id = p.team_id
    WHERE p.id = milestones.project_id AND t.mentor_id = auth.uid()
  )
);

-- ============================================
-- 5. FIX TASKS RLS (Inherit Project Access)
-- ============================================

DROP POLICY IF EXISTS "Users can view tasks of their projects" ON tasks;

CREATE POLICY "Users can view tasks of their projects" ON tasks FOR SELECT USING (
    -- 1. Admin
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  OR
  -- 2. Project Member
  EXISTS (SELECT 1 FROM project_members WHERE project_id = tasks.project_id AND user_id = auth.uid())
  OR
  -- 3. Mentor of Project's Team
  EXISTS (
    SELECT 1 FROM projects p
    JOIN teams t ON t.id = p.team_id
    WHERE p.id = tasks.project_id AND t.mentor_id = auth.uid()
  )
);
