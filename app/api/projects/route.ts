import { NextResponse, type NextRequest } from "next/server";
import { getSupabaseAdminClient } from "@/lib/supabase";
import { customAlphabet } from "nanoid";
import { randomUUID } from "crypto";

const nanoid = customAlphabet("0123456789abcdefghijklmnopqrstuvwxyz", 12);

export async function GET(req: NextRequest) {
  const supabase = getSupabaseAdminClient();
  const { searchParams } = new URL(req.url);
  const creatorId = searchParams.get("creator_id");

  let query = supabase.from("projects").select("*").order("created_at", { ascending: false });
  if (creatorId) {
    query = query.eq("creator_id", creatorId);
  }

  const { data, error } = await query;
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ projects: data ?? [] });
}

export async function POST(req: NextRequest) {
  const supabase = getSupabaseAdminClient();
  const body = await req.json().catch(() => null);
  if (!body || typeof body.name !== "string") {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }

  const providedCreator: unknown = body.creator_id;
  const creatorId =
    typeof providedCreator === "string" && /^[0-9a-fA-F-]{36}$/.test(providedCreator)
      ? providedCreator
      : randomUUID();

  const shareToken = nanoid();
  const defaultSettings = {
    default_columns: 3,
    allow_viewer_control: true,
    background_color: "#ffffff",
  };

  // Create project
  const { data: project, error } = await supabase
    .from("projects")
    .insert([
      {
        name: body.name,
        creator_id: creatorId,
        share_token: shareToken,
        settings: defaultSettings,
      },
    ])
    .select("*")
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Create default page for the project
  const { error: pageError } = await supabase
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


