import { NextResponse, type NextRequest } from "next/server";
import { getSupabaseAdminClient } from "@/lib/supabase";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = getSupabaseAdminClient();
  const { id } = await params;
  
  // Return all artifacts for the project across all pages
  const { data, error } = await supabase
    .from("artifacts")
    .select("*")
    .eq("project_id", id)
    .order("position", { ascending: true });
  
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ artifacts: data ?? [] });
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = getSupabaseAdminClient();
  const { id } = await params;
  const body = await req.json().catch(() => null);
  if (!body || typeof body.type !== "string") {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }
  const { type, source_url, file_path, metadata } = body as {
    type: string;
    source_url?: string;
    file_path?: string | null;
    metadata?: Record<string, unknown>;
  };
  if (!["figma", "url", "image", "video", "pdf"].includes(type)) {
    return NextResponse.json({ error: "Invalid artifact type" }, { status: 400 });
  }

  // Get the first page for this project (backward compatibility)
  const { data: firstPage, error: pageErr } = await supabase
    .from("pages")
    .select("id")
    .eq("project_id", id)
    .order("position", { ascending: true })
    .limit(1)
    .single();

  if (pageErr || !firstPage) {
    return NextResponse.json({ 
      error: "No pages found for this project. Please use the page-specific artifacts API." 
    }, { status: 400 });
  }

  // Compute next position for this page
  const { data: positions, error: posErr } = await supabase
    .from("artifacts")
    .select("position")
    .eq("page_id", firstPage.id)
    .order("position", { ascending: false })
    .limit(1);
  if (posErr) {
    return NextResponse.json({ error: posErr.message }, { status: 500 });
  }
  const currentMax = Array.isArray(positions) && positions.length > 0 ? (positions[0] as { position: number }).position ?? 0 : 0;
  const nextPosition = (Number.isFinite(currentMax) ? currentMax : 0) + 1;

  const insert = {
    project_id: id,
    page_id: firstPage.id,
    type,
    source_url: source_url ?? "",
    file_path: file_path ?? null,
    position: nextPosition,
    metadata: metadata ?? {},
  };

  const { data, error } = await supabase
    .from("artifacts")
    .insert([insert])
    .select("*")
    .single();
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ artifact: data }, { status: 201 });
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = getSupabaseAdminClient();
  const { id } = await params;
  const body = await req.json().catch(() => null);
  if (!Array.isArray(body?.order)) {
    return NextResponse.json({ error: "Invalid order payload" }, { status: 400 });
  }
  const updates: { id: string; position: number }[] = body.order.map((artifactId: string, index: number) => ({
    id: artifactId,
    position: index + 1,
  }));
  const { error } = await supabase
    .from("artifacts")
    .upsert(updates.map((u) => ({ ...u, project_id: id })), { onConflict: "id" });
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ success: true });
}


