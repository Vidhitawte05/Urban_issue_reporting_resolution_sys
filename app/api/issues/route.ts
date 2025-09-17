import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY! // ✅ bypasses RLS
)

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { title, description, category, location, priority, images, user_id } = body

    const { error } = await supabaseAdmin.from("issues").insert([
      {
        title,
        description,
        category,
        location,
        priority,
        images,
        user_id,
        status: "pending", // default
      },
    ])

    if (error) {
      console.error("Insert error:", error.message)
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    return NextResponse.json({ success: true })
  } catch (err: any) {
    console.error("API error:", err.message)
    return NextResponse.json({ error: "Server error" }, { status: 500 })
  }
}

export async function GET() {
  try {
    const { data, error } = await supabaseAdmin.from("issues").select("*").order("created_at", { ascending: false })

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    return NextResponse.json(data)
  } catch (err: any) {
    return NextResponse.json({ error: "Server error" }, { status: 500 })
  }
}
