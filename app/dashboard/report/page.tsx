"use client"

import { useState } from "react"
import Image from "next/image"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import * as z from "zod"
import { Button } from "@/components/ui/button"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Switch } from "@/components/ui/switch"
import { Camera, Upload } from "lucide-react"
import { toast } from "@/components/ui/use-toast"
import { supabase } from "@/lib/supabaseClient"

// ✅ Validation schema
const formSchema = z.object({
  title: z.string().min(5, { message: "Title must be at least 5 characters." }),
  description: z.string().min(20, { message: "Description must be at least 20 characters." }),
  category: z.string({ required_error: "Please select a category." }),
  location: z.string().min(3, { message: "Location must be at least 3 characters." }),
  useCurrentLocation: z.boolean().default(false),
  priority: z.string().default("medium"),
})

export default function ReportIssuePage() {
  const [isLoading, setIsLoading] = useState(false)
  const [capturedImages, setCapturedImages] = useState<{ file: File; preview: string }[]>([])

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: "",
      description: "",
      category: "",
      location: "",
      useCurrentLocation: false,
      priority: "medium",
    },
  })

  // 📸 Handle image upload
  const handleImageAdd = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      const newImage = { file, preview: URL.createObjectURL(file) }
      setCapturedImages((prev) => [...prev, newImage])
      toast({ title: "Image Added", description: "Your photo has been attached." })
    }
    e.target.value = ""
  }

  // 📍 Use Current Location (with reverse geocoding)
  const handleUseCurrentLocation = (checked: boolean) => {
    form.setValue("useCurrentLocation", checked)
    if (checked && navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        async (pos) => {
          try {
            const lat = pos.coords.latitude
            const lng = pos.coords.longitude
            const res = await fetch(`https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json`)
            const data = await res.json()
            const address = data.display_name || `Lat: ${lat}, Lng: ${lng}`
            form.setValue("location", address)
            toast({ title: "Location Captured", description: address })
          } catch (err) {
            toast({ title: "Error", description: "Failed to fetch location name.", variant: "destructive" })
          }
        },
        () => toast({ title: "Error", description: "Failed to fetch location.", variant: "destructive" })
      )
    } else {
      form.setValue("location", "")
    }
  }

  // 🚀 Submit
  async function onSubmit(values: z.infer<typeof formSchema>) {
    if (capturedImages.length === 0) {
      toast({ title: "No Image", description: "Attach at least one picture.", variant: "destructive" })
      return
    }

    setIsLoading(true)
    try {
      // Upload images
      const uploadedImageUrls: string[] = []
      for (const img of capturedImages) {
        const fileExt = img.file.name.split(".").pop()
        const fileName = `issues/${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`
        const { error: uploadError } = await supabase.storage.from("issues").upload(fileName, img.file)
        if (uploadError) throw uploadError
        const { data } = supabase.storage.from("issues").getPublicUrl(fileName)
        uploadedImageUrls.push(data.publicUrl)
      }

      // Get logged-in user
      const { data: userData, error: userError } = await supabase.auth.getUser()
      if (userError || !userData?.user) {
        toast({ title: "Auth Error", description: "Login required.", variant: "destructive" })
        setIsLoading(false)
        return
      }

      // Call API route (server inserts using Service Role)
      const res = await fetch("/api/issues", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...values,
          images: uploadedImageUrls,
          user_id: userData.user.id,
        }),
      })

      const result = await res.json()
      if (!res.ok) throw new Error(result.error)

      toast({ title: "Success", description: "Issue reported successfully." })
      form.reset()
      setCapturedImages([])
    } catch (err: any) {
      toast({ title: "Error", description: err.message || "Something went wrong.", variant: "destructive" })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold tracking-tight">Report an Issue</h1>
        <p className="text-muted-foreground">Fill out the details below to report an issue in your community.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>New Issue Report</CardTitle>
          <CardDescription>Provide as much detail as possible for a faster resolution.</CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
              {/* Title */}
              <FormField control={form.control} name="title" render={({ field }) => (
                <FormItem>
                  <FormLabel>Issue Title</FormLabel>
                  <FormControl><Input placeholder="e.g., Large Pothole on Palm Beach Road" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )}/>

              {/* Description */}
              <FormField control={form.control} name="description" render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl><Textarea placeholder="Describe the issue..." className="min-h-[120px]" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )}/>

              {/* Category */}
              <FormField control={form.control} name="category" render={({ field }) => (
                <FormItem>
                  <FormLabel>Category</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl><SelectTrigger><SelectValue placeholder="Select a category" /></SelectTrigger></FormControl>
                    <SelectContent>
                      <SelectItem value="roads">Roads & Potholes</SelectItem>
                      <SelectItem value="water">Water Supply</SelectItem>
                      <SelectItem value="electricity">Electricity</SelectItem>
                      <SelectItem value="garbage">Garbage Collection</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}/>

              {/* Location */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <FormLabel>Location</FormLabel>
                  <div className="flex items-center space-x-2">
                    <Switch checked={form.watch("useCurrentLocation")} onCheckedChange={handleUseCurrentLocation} id="use-current-location"/>
                    <label htmlFor="use-current-location" className="text-sm font-medium">Use current location</label>
                  </div>
                </div>
                <FormField control={form.control} name="location" render={({ field }) => (
                  <FormItem>
                    <FormControl><Input placeholder="e.g., Near Inorbit Mall, Vashi" {...field} disabled={form.watch("useCurrentLocation")} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )}/>
              </div>

              {/* Images */}
              <div className="space-y-2">
                <FormLabel>Images</FormLabel>
                <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
                  {capturedImages.map((img, i) => (
                    <div key={i} className="relative aspect-square overflow-hidden rounded-md border">
                      <Image src={img.preview} alt={`Preview ${i + 1}`} fill className="object-cover" onLoad={() => URL.revokeObjectURL(img.preview)} />
                    </div>
                  ))}
                  {/* Camera */}
                  <label htmlFor="image-capture" className="flex aspect-square cursor-pointer flex-col items-center justify-center gap-1 rounded-md border-2 border-dashed bg-muted hover:bg-muted/80">
                    <Camera className="h-8 w-8 text-muted-foreground" />
                    <span className="text-xs font-semibold text-muted-foreground">Take Picture</span>
                  </label>
                  <input id="image-capture" type="file" accept="image/*" capture="environment" onChange={handleImageAdd} className="hidden" />

                  {/* Upload */}
                  <label htmlFor="image-upload" className="flex aspect-square cursor-pointer flex-col items-center justify-center gap-1 rounded-md border-2 border-dashed bg-muted hover:bg-muted/80">
                    <Upload className="h-8 w-8 text-muted-foreground" />
                    <span className="text-xs font-semibold text-muted-foreground">Upload File</span>
                  </label>
                  <input id="image-upload" type="file" accept="image/*" onChange={handleImageAdd} className="hidden" />
                </div>
              </div>

              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? "Submitting..." : "Submit Report"}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  )
}
