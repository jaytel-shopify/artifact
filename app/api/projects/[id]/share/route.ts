import { NextResponse, type NextRequest } from "next/server";
import { getSupabaseAdminClient } from "@/lib/supabase";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

// Get authenticated Supabase client for server-side requests
async function getSupabaseServerClient() {
  const cookieStore = await cookies();
  
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value;
        },
      },
    }
  );
}

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = await getSupabaseServerClient();
  
  // Get current user
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Verify user owns this project
  const { data: project, error: projectError } = await supabase
    .from("projects")
    .select("id, creator_id, is_shared")
    .eq("id", id)
    .eq("creator_id", user.id)
    .single();

  if (projectError || !project) {
    return NextResponse.json({ error: "Project not found or access denied" }, { status: 404 });
  }

  // Toggle sharing status
  const newIsShared = !project.is_shared;
  const adminSupabase = getSupabaseAdminClient();
  
  const { data: updatedProject, error: updateError } = await adminSupabase
    .from("projects")
    .update({
      is_shared: newIsShared,
      shared_at: newIsShared ? new Date().toISOString() : null,
    })
    .eq("id", id)
    .select("*")
    .single();

  if (updateError) {
    return NextResponse.json({ error: updateError.message }, { status: 500 });
  }

  return NextResponse.json({
    project: updatedProject,
    message: newIsShared ? "Project is now shared publicly" : "Project is now private",
  });
}

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = await getSupabaseServerClient();
  
  // Get current user
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Get project sharing status (user must own project to see sharing status)
  const { data: project, error: projectError } = await supabase
    .from("projects")
    .select("id, name, share_token, is_shared, shared_at")
    .eq("id", id)
    .eq("creator_id", user.id)
    .single();

  if (projectError || !project) {
    return NextResponse.json({ error: "Project not found or access denied" }, { status: 404 });
  }

  const shareUrl = project.is_shared 
    ? `${process.env.NEXT_PUBLIC_APP_URL}/presentation/${project.share_token}`
    : null;

  return NextResponse.json({
    project: {
      ...project,
      share_url: shareUrl,
    },
  });
}
