"use client";

/**
 * Test if migration files are accessible
 */
export async function testMigrationFiles() {
  const testFiles = [
    '/_migration/Cloud_SQL_Export_2025-11-26 (09_50_04).sql',
    '/_migration/shopify-studio-media/cm7thki660000s60hlrru9mhx/bd6d30ffe70301d84f9abebfe4f806f3'
  ];

  const results = [];

  for (const file of testFiles) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);
      
      const response = await fetch(file, { 
        signal: controller.signal,
        method: 'HEAD' // Just check if file exists
      });
      
      clearTimeout(timeoutId);
      
      results.push({
        file,
        accessible: response.ok,
        status: response.status,
        size: response.headers.get('content-length'),
        type: response.headers.get('content-type')
      });
    } catch (error: any) {
      results.push({
        file,
        accessible: false,
        error: error.message
      });
    }
  }

  return results;
}

