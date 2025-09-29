import { NextResponse, type NextRequest } from "next/server";
import { getSupabaseAdminClient } from "@/lib/supabase";

export async function GET(req: NextRequest) {
  const supabase = getSupabaseAdminClient();

  // Get all projects
  const { data: projects, error: projectsError } = await supabase
    .from("projects")
    .select("*")
    .order('created_at', { ascending: false });

  if (projectsError) {
    return NextResponse.json({ error: projectsError.message }, { status: 500 });
  }

  // For each project, get first page and its first 3 artifacts
  const projectCovers = await Promise.all(
    (projects || []).map(async (project) => {
      // Get first page
      const { data: firstPage } = await supabase
        .from("pages")
        .select("id")
        .eq("project_id", project.id)
        .eq("position", 0)
        .single();

      let coverArtifacts = [];

      if (firstPage) {
        // Get first 3 artifacts from first page
        const { data: artifacts } = await supabase
          .from("artifacts")
          .select(`
            id,
            type,
            source_url,
            file_path,
            name,
            position,
            metadata
          `)
          .eq("page_id", firstPage.id)
          .order("position", { ascending: true })
          .limit(3);

        coverArtifacts = artifacts || [];
      }

      return {
        ...project,
        coverArtifacts
      };
    })
  );

  return NextResponse.json({ projects: projectCovers });
}
