/**
 * Utility functions for generating artifact names
 */

/**
 * Extract filename from a file path or File object
 */
export function extractFilename(input: string | File): string {
  if (input instanceof File) {
    // Remove file extension for cleaner display
    const name = input.name;
    const lastDotIndex = name.lastIndexOf('.');
    return lastDotIndex > 0 ? name.substring(0, lastDotIndex) : name;
  }
  
  // Handle file path string
  const path = input.toString();
  const filename = path.split('/').pop() || path;
  
  // Remove file extension
  const lastDotIndex = filename.lastIndexOf('.');
  return lastDotIndex > 0 ? filename.substring(0, lastDotIndex) : filename;
}

/**
 * Extract domain name from URL
 */
export function extractDomainName(url: string): string {
  try {
    const urlObj = new URL(url);
    let domain = urlObj.hostname;
    
    // Remove 'www.' prefix if present
    if (domain.startsWith('www.')) {
      domain = domain.substring(4);
    }
    
    return domain;
  } catch {
    // Fallback for invalid URLs
    const match = url.match(/^https?:\/\/(?:www\.)?([^\/]+)/);
    return match ? match[1] : 'URL';
  }
}

/**
 * Generate default name for an artifact based on its type and source
 */
export function generateArtifactName(
  type: string,
  sourceUrl: string,
  file?: File | string | null
): string {
  switch (type) {
    case 'image':
    case 'video':
    case 'pdf':
      // For files, use the filename
      if (file) {
        return extractFilename(file);
      }
      // Fallback to URL domain if no file info
      return extractDomainName(sourceUrl);
      
    case 'url':
    case 'figma':
      // For URLs, use the domain name
      return extractDomainName(sourceUrl);
      
    default:
      return `${type.charAt(0).toUpperCase() + type.slice(1)} Artifact`;
  }
}
