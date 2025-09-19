import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function POST(req: Request) {
  try {
    const body = await req.json();

    // ✅ Extract token from Authorization header
    const authHeader = req.headers.get("authorization");
    const token = authHeader?.split(" ")[1];

    if (!token) {
      return NextResponse.json({ error: "Unauthorized: No token" }, { status: 401 });
    }

    // ✅ Create supabase client with token (end-user context)
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!, // service role bypasses RLS
      { global: { headers: { Authorization: `Bearer ${token}` } } }
    );

    // ✅ Verify user
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser(token);

    if (userError || !user) {
      return NextResponse.json({ error: "Unauthorized: Invalid user" }, { status: 401 });
    }

    // ✅ Insert issue
    const { error: insertError } = await supabase.from("issues").insert([
      {
        title: body.title,
        description: body.description,
        location: body.location,
        category: body.category,
        priority: body.priority,
        images: body.images,
        user_id: user.id,
        status: "pending",
      },
    ]);

    if (insertError) {
      return NextResponse.json({ error: insertError.message }, { status: 400 });
    }

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
