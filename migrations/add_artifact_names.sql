-- Migration: Add name/title field to artifacts table
-- This allows users to set custom names for their artifacts

-- Add name column to artifacts table
ALTER TABLE artifacts 
ADD COLUMN name VARCHAR(255);

-- Set default names for existing artifacts
-- For files: extract filename from file_path if available
-- For URLs: extract domain from source_url
UPDATE artifacts 
SET name = CASE 
  WHEN file_path IS NOT NULL AND file_path != '' THEN 
    -- Extract filename from path (after last slash and before last dot for extension)
    COALESCE(
      NULLIF(
        REGEXP_REPLACE(
          SPLIT_PART(file_path, '/', -1), -- Get filename part
          '\.[^.]*$', -- Remove file extension
          ''
        ), 
        ''
      ),
      SPLIT_PART(file_path, '/', -1) -- Fallback to full filename with extension
    )
  WHEN type = 'url' THEN 
    -- Extract domain from URL
    REGEXP_REPLACE(source_url, '^https?://(?:www\.)?([^/]+).*', '\1')
  ELSE 
    -- Fallback for other types
    CONCAT(UPPER(type), ' Artifact')
END
WHERE name IS NULL;

-- Make name NOT NULL with default for future inserts
ALTER TABLE artifacts ALTER COLUMN name SET DEFAULT 'Untitled';
ALTER TABLE artifacts ALTER COLUMN name SET NOT NULL;

-- Verification query
SELECT 
  id, 
  type, 
  name, 
  CASE 
    WHEN file_path IS NOT NULL THEN file_path 
    ELSE source_url 
  END as source
FROM artifacts 
ORDER BY created_at DESC 
LIMIT 10;
