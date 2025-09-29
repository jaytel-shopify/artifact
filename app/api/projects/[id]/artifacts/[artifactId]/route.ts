import { NextResponse, type NextRequest } from "next/server";
import { getSupabaseAdminClient } from "@/lib/supabase";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; artifactId: string }> }
) {
  const supabase = getSupabaseAdminClient();
  const { id: projectId, artifactId } = await params;
  const body = await req.json().catch(() => null);
  
  if (!body) {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  // Validate that we have something to update
  const allowedFields = ['name', 'metadata'];
  const updates = Object.keys(body)
    .filter(key => allowedFields.includes(key))
    .reduce((obj, key) => {
      obj[key] = body[key];
      return obj;
    }, {} as Record<string, unknown>);

  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ error: "No valid fields to update" }, { status: 400 });
  }

  // Verify the artifact belongs to the specified project
  const { data: artifact, error: fetchError } = await supabase
    .from("artifacts")
    .select("id, project_id")
    .eq("id", artifactId)
    .eq("project_id", projectId)
    .single();

  if (fetchError || !artifact) {
    return NextResponse.json({ error: "Artifact not found" }, { status: 404 });
  }

  // Update the artifact
  const { data, error } = await supabase
    .from("artifacts")
    .update(updates)
    .eq("id", artifactId)
    .select("*")
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ artifact: data });
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string; artifactId: string }> }
) {
  const supabase = getSupabaseAdminClient();
  const { id: projectId, artifactId } = await params;

  // Verify the artifact belongs to the specified project
  const { data: artifact, error: fetchError } = await supabase
    .from("artifacts")
    .select("id, project_id")
    .eq("id", artifactId)
    .eq("project_id", projectId)
    .single();

  if (fetchError || !artifact) {
    return NextResponse.json({ error: "Artifact not found" }, { status: 404 });
  }

  // Delete the artifact
  const { error } = await supabase
    .from("artifacts")
    .delete()
    .eq("id", artifactId);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}