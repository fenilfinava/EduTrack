-- Enable Row Level Security (RLS) on teams and team_members tables
-- This fixes the "Unrestricted" warning in Supabase

-- 1. Enable RLS
ALTER TABLE teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE team_members ENABLE ROW LEVEL SECURITY;

-- 2. Create Policies for 'teams'
-- Allow all authenticated users to view teams (for listing/joining)
CREATE POLICY "Teams are viewable by authenticated users" 
ON teams FOR SELECT 
TO authenticated 
USING (true);

-- Allow authenticated users (Mentors/Admins) to create teams
CREATE POLICY "Authenticated users can create teams" 
ON teams FOR INSERT 
TO authenticated 
WITH CHECK (true);

-- Allow Mentors/Admins to update their own teams
CREATE POLICY "Mentors can update their own teams" 
ON teams FOR UPDATE
TO authenticated
USING (auth.uid() = mentor_id);

-- 3. Create Policies for 'team_members'
-- Allow all authenticated users to view team members
CREATE POLICY "Team members are viewable by authenticated users" 
ON team_members FOR SELECT 
TO authenticated 
USING (true);

-- Allow authenticated users to add members
CREATE POLICY "Authenticated users can add team members" 
ON team_members FOR INSERT 
TO authenticated 
WITH CHECK (true);

-- Allow Mentors/Admins to remove members
CREATE POLICY "Mentors can remove team members" 
ON team_members FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM teams 
    WHERE teams.id = team_members.team_id 
    AND teams.mentor_id = auth.uid()
  )
);
