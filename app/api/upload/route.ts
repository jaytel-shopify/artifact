import { NextResponse } from "next/server";
import { getSupabaseAdminClient } from "@/lib/supabase";
import { randomUUID } from "crypto";

export const runtime = "nodejs"; // required for formData streaming in Next API

const MAX_FILE_BYTES = 20 * 1024 * 1024; // 20MB
const BUCKET = "artifacts"; // public bucket to be created in Supabase

export async function POST(req: Request) {
  const supabase = getSupabaseAdminClient();
  const form = await req.formData();
  const file = form.get("file");
  const projectId = form.get("project_id");

  if (!(file instanceof File)) {
    return NextResponse.json({ error: "Missing file" }, { status: 400 });
  }
  if (typeof projectId !== "string" || projectId.length === 0) {
    return NextResponse.json({ error: "Missing project_id" }, { status: 400 });
  }
  if (file.size > MAX_FILE_BYTES) {
    return NextResponse.json({ error: "File exceeds 20MB" }, { status: 413 });
  }

  // Ensure bucket exists (idempotent)
  // Note: Admin API for buckets is via supabase-js storage admin methods
  await supabase.storage.createBucket(BUCKET, {
    public: true,
  }).catch(() => undefined);

  const ext = file.name.split(".").pop() ?? "bin";
  const path = `${projectId}/${randomUUID()}.${ext}`;
  const { data: upload, error: uploadError } = await supabase.storage
    .from(BUCKET)
    .upload(path, file, {
      contentType: file.type || undefined,
      upsert: false,
    });
  if (uploadError) {
    return NextResponse.json({ error: uploadError.message }, { status: 500 });
  }

  const { data: publicUrl } = supabase.storage.from(BUCKET).getPublicUrl(upload.path);

  return NextResponse.json({
    path: upload.path,
    publicUrl: publicUrl.publicUrl,
    mimeType: file.type,
    size: file.size,
  });
}


