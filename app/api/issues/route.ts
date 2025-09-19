import { supabase } from "@/lib/supabaseClient"

// ✅ NLP keyword filter for pothole-related issues
function isPotholeRelated(text: string): boolean {
  const potholeKeywords = [
    "pothole",
    "road crack",
    "damaged road",
    "hole in road",
    "broken road",
    "road damage"
  ]

  return potholeKeywords.some(keyword =>
    text.toLowerCase().includes(keyword)
  )
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { title, description, location, category, priority, images } = body

    if (!images || images.length === 0) {
      return new Response(JSON.stringify({ error: "No images provided" }), { status: 400 })
    }

    // 🔎 Step 1: NLP check for title + description
    if (!isPotholeRelated(title) || !isPotholeRelated(description)) {
      return new Response(
        JSON.stringify({
          error: "Only pothole-related issues (title & description) can be submitted."
        }),
        { status: 400 }
      )
    }

    // 🔎 Step 2: Validate first image with ML API
    const imageBlob = await fetch(images[0]).then(r => r.blob())
    const fd = new FormData()
    fd.append("file", imageBlob)

    const mlRes = await fetch("http://127.0.0.1:8000/predict", {
      method: "POST",
      body: fd,
    })

    const mlResult = await mlRes.json()

    if (!mlResult.pothole_detected) {
      return new Response(
        JSON.stringify({ error: "No pothole detected in the image." }),
        { status: 400 }
      )
    }

    // ✅ Step 3: Insert into Supabase if both checks pass
    const { data, error } = await supabase.from("issues").insert([
      { title, description, location, category, priority, images },
    ])

    if (error) {
      return new Response(JSON.stringify({ error: error.message }), { status: 500 })
    }

    return new Response(JSON.stringify({ success: true, data }), { status: 200 })
  } catch (err: any) {
    console.error("API error:", err)
    return new Response(JSON.stringify({ error: err.message || "Server error" }), { status: 500 })
  }
}
