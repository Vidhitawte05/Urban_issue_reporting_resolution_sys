import { supabase } from "@/lib/supabaseClient"

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { title, description, location, category, priority, images } = body

    if (!images || images.length === 0) {
      return new Response(JSON.stringify({ error: "No images provided" }), { status: 400 })
    }

    // Step 1: Send first image to ML API
    const imageBlob = await fetch(images[0]).then(r => r.blob())
    const fd = new FormData()
    fd.append("file", imageBlob)
    const mlRes = await fetch("http://127.0.0.1:8000/predict", {
      method: "POST",
      body: fd,
    })
    const mlResult = await mlRes.json()

    if (!mlResult.pothole_detected) {
      return new Response(JSON.stringify({ error: "No pothole detected in the image." }), { status: 400 })
    }

    // Step 2: Insert into Supabase
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