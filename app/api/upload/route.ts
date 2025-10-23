import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"

export async function POST(req: Request) {
  try {
    const formData = await req.formData()
    const file = formData.get("file") as File

    if (!file) throw new Error("No file provided")

    const fileBuffer = Buffer.from(await file.arrayBuffer())
    const fileName = `${Date.now()}-${file.name}`

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

    const { data, error } = await supabase.storage
      .from("issue")
      .upload(fileName, fileBuffer, { contentType: file.type })

    if (error) throw error

    const { data: publicUrlData } = supabase.storage
      .from("issue")
      .getPublicUrl(fileName)

    return Response.json({ url: publicUrlData.publicUrl })
  } catch (err: any) {
    return Response.json({ error: err.message }, { status: 400 })
  }
}
