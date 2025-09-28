import { NextResponse, type NextRequest } from "next/server";
import { getSupabaseAdminClient } from "@/lib/supabase";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: projectId } = await params;
  const supabase = getSupabaseAdminClient();

  const { data, error } = await supabase
    .from("pages")
    .select("*")
    .eq("project_id", projectId)
    .order("position", { ascending: true });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ pages: data ?? [] });
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: projectId } = await params;
  const supabase = getSupabaseAdminClient();
  
  const body = await req.json().catch(() => null);
  if (!body || typeof body.name !== "string") {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }

  // Get the next position
  const { data: lastPage } = await supabase
    .from("pages")
    .select("position")
    .eq("project_id", projectId)
    .order("position", { ascending: false })
    .limit(1)
    .single();

  const nextPosition = lastPage ? lastPage.position + 1 : 0;

  const { data, error } = await supabase
    .from("pages")
    .insert([
      {
        project_id: projectId,
        name: body.name,
        position: nextPosition,
      },
    ])
    .select("*")
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ page: data }, { status: 201 });
}
