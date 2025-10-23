import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const cookieStore = cookies()

    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name) {
            return cookieStore.get(name)?.value
          },
        },
      }
    )

    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return Response.json({ error: "Auth required" }, { status: 401 })
    }

    const { title, description, location, category, priority, images } = body

    const { data, error } = await supabase.from("issues").insert([
      {
        title,
        description,
        location,
        category,
        priority,
        before_images: images,
        user_id: user.id,
        status: "pending",
      },
    ])

    if (error) throw error

    return Response.json({ success: true, data })
  } catch (error: any) {
    return Response.json({ error: error.message }, { status: 400 })
  }
}
