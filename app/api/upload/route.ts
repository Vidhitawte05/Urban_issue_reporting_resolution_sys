// app/api/upload/route.ts
import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY! // Service role → bypass RLS
);

export async function POST(req: Request) {
  const formData = await req.formData();
  const file = formData.get("file") as File;

  if (!file) {
    return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
  }

  const ext = file.name.split(".").pop();
  const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${ext}`;

  const { error } = await supabaseAdmin.storage.from("issues").upload(fileName, file);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  const { data } = supabaseAdmin.storage.from("issues").getPublicUrl(fileName);

  return NextResponse.json({ url: data.publicUrl });
}
