import { NextResponse, type NextRequest } from "next/server";
import { getSupabaseAdminClient } from "@/lib/supabase";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; pageId: string }> }
) {
  const { pageId } = await params;
  const supabase = getSupabaseAdminClient();

  const { data, error } = await supabase
    .from("artifacts")
    .select("*")
    .eq("page_id", pageId)
    .order("position", { ascending: true });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ artifacts: data ?? [] });
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; pageId: string }> }
) {
  const { id: projectId, pageId } = await params;
  const supabase = getSupabaseAdminClient();
  
  const body = await req.json().catch(() => null);
  if (!body || !body.type || !body.source_url) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  // Get the next position for this page
  const { data: lastArtifact } = await supabase
    .from("artifacts")
    .select("position")
    .eq("page_id", pageId)
    .order("position", { ascending: false })
    .limit(1)
    .single();

  const nextPosition = lastArtifact ? lastArtifact.position + 1 : 0;

  const { data, error } = await supabase
    .from("artifacts")
    .insert([
      {
        project_id: projectId,
        page_id: pageId,
        type: body.type,
        source_url: body.source_url,
        file_path: body.file_path || null,
        name: body.name || 'Untitled',
        position: nextPosition,
        metadata: body.metadata || {},
      },
    ])
    .select("*")
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ artifact: data }, { status: 201 });
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; pageId: string }> }
) {
  const { pageId } = await params;
  const supabase = getSupabaseAdminClient();
  
  const body = await req.json().catch(() => null);
  if (!Array.isArray(body?.order)) {
    return NextResponse.json({ error: "Invalid order payload" }, { status: 400 });
  }

  // Update artifact positions based on the new order
  const updates = body.order.map((artifactId: string, index: number) => ({
    id: artifactId,
    position: index,
  }));

  // Update each artifact's position individually
  for (const update of updates) {
    const { error } = await supabase
      .from("artifacts")
      .update({ position: update.position })
      .eq("id", update.id)
      .eq("page_id", pageId);
    
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
  }

  return NextResponse.json({ success: true });
}
