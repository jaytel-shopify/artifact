import { NextResponse, type NextRequest } from "next/server";
import { getSupabaseAdminClient } from "@/lib/supabase";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; pageId: string }> }
) {
  const { pageId } = await params;
  const supabase = getSupabaseAdminClient();

  const { data, error } = await supabase
    .from("pages")
    .select("*")
    .eq("id", pageId)
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ page: data });
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; pageId: string }> }
) {
  const { pageId } = await params;
  const supabase = getSupabaseAdminClient();
  
  const body = await req.json().catch(() => null);
  if (!body) {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }

  const updateData: any = {};
  if (typeof body.name === "string") updateData.name = body.name;
  if (typeof body.position === "number") updateData.position = body.position;

  const { data, error } = await supabase
    .from("pages")
    .update(updateData)
    .eq("id", pageId)
    .select("*")
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ page: data });
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; pageId: string }> }
) {
  const { id: projectId, pageId } = await params;
  const supabase = getSupabaseAdminClient();

  // Check if this is the last page in the project
  const { data: pages } = await supabase
    .from("pages")
    .select("id")
    .eq("project_id", projectId);

  if (!pages || pages.length <= 1) {
    return NextResponse.json(
      { error: "Cannot delete the last page" },
      { status: 400 }
    );
  }

  // Delete the page (artifacts will be cascade deleted)
  const { error } = await supabase
    .from("pages")
    .delete()
    .eq("id", pageId);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
