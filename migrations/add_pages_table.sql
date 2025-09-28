-- Migration: Add pages table and update artifacts table
-- This migration adds support for pages within projects

-- Create pages table
CREATE TABLE IF NOT EXISTS pages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL DEFAULT 'Untitled Page',
  position INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(project_id, position)
);

-- Add page_id column to artifacts table
ALTER TABLE artifacts 
ADD COLUMN page_id UUID REFERENCES pages(id) ON DELETE CASCADE;

-- Create index for better performance
CREATE INDEX idx_pages_project_position ON pages(project_id, position);
CREATE INDEX idx_artifacts_page_position ON artifacts(page_id, position);

-- Migration to create a default page for existing projects
-- This will create a "Page 01" for each existing project and move all artifacts to it
INSERT INTO pages (project_id, name, position)
SELECT id, 'Page 01', 0
FROM projects
WHERE NOT EXISTS (
  SELECT 1 FROM pages WHERE pages.project_id = projects.id
);

-- Update existing artifacts to reference the first page of their project
UPDATE artifacts 
SET page_id = (
  SELECT pages.id 
  FROM pages 
  WHERE pages.project_id = artifacts.project_id 
  ORDER BY pages.position 
  LIMIT 1
)
WHERE page_id IS NULL;

-- Make page_id NOT NULL after migration
-- Note: Run this after confirming all artifacts have been migrated
-- ALTER TABLE artifacts ALTER COLUMN page_id SET NOT NULL;

-- Create trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_pages_updated_at 
  BEFORE UPDATE ON pages 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
