import { NextResponse, type NextRequest } from "next/server";
import { getSupabaseAdminClient } from "@/lib/supabase";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = getSupabaseAdminClient();
  const { id } = await params;

  const { data, error } = await supabase
    .from("projects")
    .select("*")
    .eq("id", id)
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ project: data });
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = getSupabaseAdminClient();
  const { id } = await params;
  const body = await req.json().catch(() => null);
  if (!body || typeof body.name !== "string" || !body.name.trim()) {
    return NextResponse.json({ error: "Invalid name" }, { status: 400 });
  }

  const { data, error } = await supabase
    .from("projects")
    .update({ name: body.name.trim() })
    .eq("id", id)
    .select("*")
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ project: data });
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = getSupabaseAdminClient();
  const { id } = await params;

  // Check if project exists
  const { data: project, error: fetchError } = await supabase
    .from("projects")
    .select("id")
    .eq("id", id)
    .single();

  if (fetchError || !project) {
    return NextResponse.json({ error: "Project not found" }, { status: 404 });
  }

  // Delete the project (pages and artifacts will be deleted automatically due to CASCADE)
  const { error } = await supabase
    .from("projects")
    .delete()
    .eq("id", id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}


