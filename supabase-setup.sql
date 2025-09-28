-- Artifact App - Complete Database Schema
-- Run this in Supabase SQL Editor

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Projects Table
CREATE TABLE projects (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) NOT NULL,
  creator_id UUID NOT NULL,
  share_token VARCHAR(12) UNIQUE NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  settings JSONB DEFAULT '{
    "default_columns": 3,
    "allow_viewer_control": true,
    "background_color": "#ffffff"
  }'
);

-- 2. Pages Table (new page system)
CREATE TABLE pages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL DEFAULT 'Untitled Page',
  position INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(project_id, position)
);

-- 3. Artifacts Table (updated with page_id)
CREATE TABLE artifacts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  page_id UUID REFERENCES pages(id) ON DELETE CASCADE NOT NULL,
  type VARCHAR(20) CHECK (type IN ('figma', 'url', 'image', 'video', 'pdf')),
  source_url TEXT NOT NULL,
  file_path TEXT, -- For uploaded files
  position INTEGER NOT NULL,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- 4. Project Access Table (for future user management)
CREATE TABLE project_access (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  user_id UUID,
  role VARCHAR(20) CHECK (role IN ('owner', 'presenter', 'viewer')),
  created_at TIMESTAMP DEFAULT NOW()
);

-- 5. Create Indexes for Performance
CREATE INDEX idx_projects_share_token ON projects(share_token);
CREATE INDEX idx_projects_creator ON projects(creator_id);

CREATE INDEX idx_pages_project_position ON pages(project_id, position);

CREATE INDEX idx_artifacts_project_position ON artifacts(project_id, position);
CREATE INDEX idx_artifacts_page_position ON artifacts(page_id, position);

CREATE INDEX idx_project_access_project ON project_access(project_id);
CREATE INDEX idx_project_access_user ON project_access(user_id);

-- 6. Create Storage Bucket for Artifacts
INSERT INTO storage.buckets (id, name, public) VALUES ('artifacts', 'artifacts', true);

-- 7. Storage Policy - Allow public read access
CREATE POLICY "Public read access" ON storage.objects FOR SELECT USING (bucket_id = 'artifacts');

-- 8. Storage Policy - Allow authenticated insert/update/delete
CREATE POLICY "Authenticated users can upload" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'artifacts');
CREATE POLICY "Authenticated users can update" ON storage.objects FOR UPDATE USING (bucket_id = 'artifacts');
CREATE POLICY "Authenticated users can delete" ON storage.objects FOR DELETE USING (bucket_id = 'artifacts');

-- 9. Row Level Security Policies (optional - currently disabled for development)
-- Uncomment these when you want to add user authentication:

-- ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE pages ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE artifacts ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE project_access ENABLE ROW LEVEL SECURITY;

-- CREATE POLICY "Projects are viewable by everyone" ON projects FOR SELECT USING (true);
-- CREATE POLICY "Pages are viewable by everyone" ON pages FOR SELECT USING (true);  
-- CREATE POLICY "Artifacts are viewable by everyone" ON artifacts FOR SELECT USING (true);

-- 10. Triggers for Updated At Timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_projects_updated_at 
  BEFORE UPDATE ON projects 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_pages_updated_at 
  BEFORE UPDATE ON pages 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_artifacts_updated_at 
  BEFORE UPDATE ON artifacts 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 11. Sample Data for Testing (optional)
INSERT INTO projects (name, creator_id, share_token) VALUES 
('Sample Project', uuid_generate_v4(), 'sample123456');

-- Get the project ID for sample data
INSERT INTO pages (project_id, name, position) 
SELECT id, 'Page 01', 0 FROM projects WHERE share_token = 'sample123456';

-- Add some sample artifacts (you can remove this if you don't want sample data)
INSERT INTO artifacts (project_id, page_id, type, source_url, position) 
SELECT 
  p.id, 
  pg.id, 
  'url',
  'https://figma.com',
  0
FROM projects p 
JOIN pages pg ON pg.project_id = p.id 
WHERE p.share_token = 'sample123456';

-- Verification Queries (run these to check everything was created correctly)
SELECT 'Tables created:' as status;
SELECT schemaname, tablename FROM pg_tables WHERE tablename IN ('projects', 'pages', 'artifacts', 'project_access');

SELECT 'Sample data:' as status;
SELECT p.name as project_name, pg.name as page_name, a.type as artifact_type, a.source_url 
FROM projects p
LEFT JOIN pages pg ON pg.project_id = p.id
LEFT JOIN artifacts a ON a.page_id = pg.id
WHERE p.share_token = 'sample123456';
