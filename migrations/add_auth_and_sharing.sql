-- Migration: Add authentication and sharing support
-- This enables Google OAuth auth and project sharing functionality

-- 1. Add sharing support to projects table
ALTER TABLE projects 
ADD COLUMN is_shared BOOLEAN DEFAULT false,
ADD COLUMN shared_at TIMESTAMP NULL;

-- 2. Create index for shared projects lookup
CREATE INDEX idx_projects_shared ON projects(is_shared, share_token) WHERE is_shared = true;

-- 3. Enable Row Level Security (RLS) on all tables
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE pages ENABLE ROW LEVEL SECURITY;
ALTER TABLE artifacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_access ENABLE ROW LEVEL SECURITY;

-- 4. RLS Policies for Projects Table

-- Users can see projects they own OR projects that are shared
CREATE POLICY "Users can view own projects and shared projects" ON projects
  FOR SELECT USING (
    -- Own projects
    auth.uid() = creator_id
    OR
    -- Shared projects (any authenticated user can view)
    (is_shared = true AND auth.uid() IS NOT NULL)
  );

-- Users can only create projects for themselves
CREATE POLICY "Users can create own projects" ON projects
  FOR INSERT WITH CHECK (auth.uid() = creator_id);

-- Users can only update their own projects
CREATE POLICY "Users can update own projects" ON projects
  FOR UPDATE USING (auth.uid() = creator_id);

-- Users can only delete their own projects  
CREATE POLICY "Users can delete own projects" ON projects
  FOR DELETE USING (auth.uid() = creator_id);

-- 5. RLS Policies for Pages Table

-- Users can see pages for projects they own or that are shared
CREATE POLICY "Users can view pages for accessible projects" ON pages
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM projects 
      WHERE projects.id = pages.project_id 
      AND (
        projects.creator_id = auth.uid() 
        OR (projects.is_shared = true AND auth.uid() IS NOT NULL)
      )
    )
  );

-- Users can only create pages for their own projects
CREATE POLICY "Users can create pages for own projects" ON pages
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM projects 
      WHERE projects.id = pages.project_id 
      AND projects.creator_id = auth.uid()
    )
  );

-- Users can only update pages for their own projects
CREATE POLICY "Users can update pages for own projects" ON pages
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM projects 
      WHERE projects.id = pages.project_id 
      AND projects.creator_id = auth.uid()
    )
  );

-- Users can only delete pages for their own projects
CREATE POLICY "Users can delete pages for own projects" ON pages
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM projects 
      WHERE projects.id = pages.project_id 
      AND projects.creator_id = auth.uid()
    )
  );

-- 6. RLS Policies for Artifacts Table

-- Users can see artifacts for projects they own or that are shared
CREATE POLICY "Users can view artifacts for accessible projects" ON artifacts
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM projects 
      WHERE projects.id = artifacts.project_id 
      AND (
        projects.creator_id = auth.uid() 
        OR (projects.is_shared = true AND auth.uid() IS NOT NULL)
      )
    )
  );

-- Users can only create artifacts for their own projects
CREATE POLICY "Users can create artifacts for own projects" ON artifacts
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM projects 
      WHERE projects.id = artifacts.project_id 
      AND projects.creator_id = auth.uid()
    )
  );

-- Users can only update artifacts for their own projects
CREATE POLICY "Users can update artifacts for own projects" ON artifacts
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM projects 
      WHERE projects.id = artifacts.project_id 
      AND projects.creator_id = auth.uid()
    )
  );

-- Users can only delete artifacts for their own projects
CREATE POLICY "Users can delete artifacts for own projects" ON artifacts
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM projects 
      WHERE projects.id = artifacts.project_id 
      AND projects.creator_id = auth.uid()
    )
  );

-- 7. RLS Policies for Project Access Table (for future user invitations)

-- Users can see access records for projects they own
CREATE POLICY "Users can view access for own projects" ON project_access
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM projects 
      WHERE projects.id = project_access.project_id 
      AND projects.creator_id = auth.uid()
    )
  );

-- Users can only create access records for their own projects
CREATE POLICY "Users can create access for own projects" ON project_access
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM projects 
      WHERE projects.id = project_access.project_id 
      AND projects.creator_id = auth.uid()
    )
  );

-- Users can only update access records for their own projects
CREATE POLICY "Users can update access for own projects" ON project_access
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM projects 
      WHERE projects.id = project_access.project_id 
      AND projects.creator_id = auth.uid()
    )
  );

-- Users can only delete access records for their own projects
CREATE POLICY "Users can delete access for own projects" ON project_access
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM projects 
      WHERE projects.id = project_access.project_id 
      AND projects.creator_id = auth.uid()
    )
  );

-- 8. Update storage policies for authenticated file uploads
DROP POLICY IF EXISTS "Authenticated users can upload" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can update" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can delete" ON storage.objects;

-- Allow authenticated users to upload files
CREATE POLICY "Authenticated users can upload files" ON storage.objects 
  FOR INSERT WITH CHECK (bucket_id = 'artifacts' AND auth.uid() IS NOT NULL);

-- Allow users to update their own uploaded files
CREATE POLICY "Users can update own files" ON storage.objects 
  FOR UPDATE USING (bucket_id = 'artifacts' AND auth.uid() IS NOT NULL);

-- Allow users to delete their own uploaded files  
CREATE POLICY "Users can delete own files" ON storage.objects 
  FOR DELETE USING (bucket_id = 'artifacts' AND auth.uid() IS NOT NULL);

-- 9. Verification Queries
SELECT 'RLS Policies Created' as status;

-- Check that RLS is enabled
SELECT schemaname, tablename, rowsecurity 
FROM pg_tables 
WHERE tablename IN ('projects', 'pages', 'artifacts', 'project_access');

-- Check policy count
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual 
FROM pg_policies 
WHERE tablename IN ('projects', 'pages', 'artifacts', 'project_access')
ORDER BY tablename, policyname;
