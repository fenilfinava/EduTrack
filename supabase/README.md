# Supabase Database Setup

## Running the Migration

### Option 1: Supabase Dashboard (Recommended for now)
1. Go to your Supabase project dashboard
2. Navigate to **SQL Editor**
3. Copy the contents of `001_initial_schema.sql`
4. Paste and run the SQL

### Option 2: Supabase CLI (Local Development)
```bash
# Install Supabase CLI
npm install -g supabase

# Initialize Supabase in your project
supabase init

# Link to your Supabase project
supabase link --project-ref your-project-ref

# Push migrations
supabase db push
```

## Tables Created

- **profiles** - User profiles (extends auth.users)
- **projects** - Project information
- **project_members** - Project team members
- **milestones** - Project milestones
- **tasks** - Tasks and subtasks
- **comments** - Task comments
- **github_commits** - Synced GitHub commits
- **github_pull_requests** - Synced GitHub PRs

## RLS (Row Level Security) Policies

### Students
- ✅ View projects they're members of
- ✅ View and update their assigned tasks
- ✅ Create comments on accessible tasks

### Mentors
- ✅ View all projects
- ✅ Create new projects
- ✅ Create milestones and tasks
- ✅ Manage project members

### Admins
- ✅ Full access to all resources
- ✅ Delete projects and tasks
- ✅ Update user roles

## Testing the Schema

After running the migration, test with:

```sql
-- Check tables
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public';

-- Verify RLS is enabled
SELECT tablename, rowsecurity FROM pg_tables 
WHERE schemaname = 'public';
```
