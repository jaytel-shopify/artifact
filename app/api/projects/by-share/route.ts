import { NextResponse, type NextRequest } from "next/server";
import { getSupabaseAdminClient } from "@/lib/supabase";

export async function GET(req: NextRequest) {
  const supabase = getSupabaseAdminClient();
  const { searchParams } = new URL(req.url);
  const token = searchParams.get("token");
  if (!token) {
    return NextResponse.json({ error: "Missing token" }, { status: 400 });
  }

  const { data, error } = await supabase
    .from("projects")
    .select("*")
    .eq("share_token", token)
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 404 });
  }

  return NextResponse.json({ project: data });
}


