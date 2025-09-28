import { NextResponse, type NextRequest } from "next/server";
import { getSupabaseAdminClient } from "@/lib/supabase";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { customAlphabet } from "nanoid";

const nanoid = customAlphabet("0123456789abcdefghijklmnopqrstuvwxyz", 12);

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

export async function GET(req: NextRequest) {
  const supabase = await getSupabaseServerClient();
  
  // Get current user
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Get projects that the user owns (RLS will automatically filter)
  const { data, error } = await supabase
    .from("projects")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  
  return NextResponse.json({ projects: data ?? [] });
}

export async function POST(req: NextRequest) {
  const supabase = await getSupabaseServerClient();
  const body = await req.json().catch(() => ({}));

  // Get current user
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const creatorId = user.id;

  // Generate unique project name
  let projectName = body?.name || "Untitled Project";
  
  // If no name provided, generate a unique default name
  if (!body?.name) {
    let counter = 1;
    let baseName = "Untitled Project";
    
    // Check for existing projects with similar names
    while (true) {
      const { data: existingProjects } = await supabase
        .from("projects")
        .select("name")
        .eq("creator_id", creatorId)
        .ilike("name", counter === 1 ? baseName : `${baseName} ${counter}`);
      
      if (!existingProjects || existingProjects.length === 0) {
        projectName = counter === 1 ? baseName : `${baseName} ${counter}`;
        break;
      }
      counter++;
    }
  }

  const shareToken = nanoid();
  const defaultSettings = {
    default_columns: 3,
    allow_viewer_control: true,
    background_color: "#ffffff",
  };

  // Use admin client for project creation (bypasses RLS for initial creation)
  const adminSupabase = getSupabaseAdminClient();
  const { data: project, error } = await adminSupabase
    .from("projects")
    .insert([
      {
        name: projectName,
        creator_id: creatorId,
        share_token: shareToken,
        is_shared: false,
        shared_at: null,
        settings: defaultSettings,
      },
    ])
    .select("*")
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Create default page for the project
  const { error: pageError } = await adminSupabase
    .from("pages")
    .insert([
      {
        project_id: project.id,
        name: "Page 01",
        position: 0,
      },
    ]);

  if (pageError) {
    // If page creation fails, we should probably delete the project or log the error
    console.error("Failed to create default page:", pageError);
    // For now, we'll continue and return the project anyway
  }

  return NextResponse.json({ project }, { status: 201 });
}


