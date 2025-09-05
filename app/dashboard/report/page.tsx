"use client"

import { useState } from "react"
import Image from "next/image"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import * as z from "zod"
import { Button } from "@/components/ui/button"
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Switch } from "@/components/ui/switch"
import { Camera, MapPin, Upload } from "lucide-react"
import { toast } from "@/components/ui/use-toast"

// Define the structure and validation for the form
const formSchema = z.object({
  title: z.string().min(5, {
    message: "Title must be at least 5 characters.",
  }),
  description: z.string().min(20, {
    message: "Description must be at least 20 characters.",
  }),
  category: z.string({
    required_error: "Please select a category.",
  }),
  location: z.string().min(5, {
    message: "Location must be at least 5 characters.",
  }),
  useCurrentLocation: z.boolean().default(false),
  priority: z.string().default("medium"),
})

export default function ReportIssuePage() {
  const [isLoading, setIsLoading] = useState(false)
  // State to manage captured/uploaded images (the file object and its preview URL)
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

  // This single handler works for both camera and file upload
  const handleImageAdd = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      const newImage = {
        file,
        preview: URL.createObjectURL(file),
      }
      setCapturedImages((prevImages) => [...prevImages, newImage])
      toast({
        title: "Image Added",
        description: "Your photo has been attached to the report.",
      })
    }
    // Reset the input value to allow selecting the same file again if needed
    e.target.value = ""
  }
  
  // Handles using the device's current location
  const handleUseCurrentLocation = (checked: boolean) => {
    form.setValue("useCurrentLocation", checked)
    if (checked) {
      // In a real app, this would use navigator.geolocation to get coordinates
      form.setValue("location", "Current Location: Near Vashi Station, Navi Mumbai")
      toast({
        title: "Location Captured",
        description: "Your current location has been set.",
      })
    } else {
      form.setValue("location", "")
    }
  }

  // Handles the final form submission
  async function onSubmit(values: z.infer<typeof formSchema>) {
    if (capturedImages.length === 0) {
      toast({
        title: "No Image Attached",
        description: "Please take or upload at least one picture of the issue.",
        variant: "destructive",
      })
      return
    }

    setIsLoading(true)

    const formData = new FormData()
    formData.append("title", values.title)
    formData.append("description", values.description)
    formData.append("category", values.category)
    formData.append("location", values.location)
    formData.append("priority", values.priority)
    
    capturedImages.forEach(img => {
        formData.append("images", img.file)
    })

    console.log("Form Submitted:", {
        ...values,
        images: capturedImages.map(img => img.file.name)
    })

    await new Promise((resolve) => setTimeout(resolve, 1500))

    toast({
      title: "Issue Reported Successfully",
      description: "Your report is now pending AI analysis and moderation.",
    })

    form.reset()
    setCapturedImages([])
    setIsLoading(false)
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
              {/* Text Fields: Title, Description, Category */}
              <FormField control={form.control} name="title" render={({ field }) => (
                <FormItem>
                  <FormLabel>Issue Title</FormLabel>
                  <FormControl><Input placeholder="e.g., Large Pothole on Palm Beach Road" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )}/>
              
              <FormField control={form.control} name="description" render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl><Textarea placeholder="Describe the issue in detail..." className="min-h-[120px]" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )}/>

              <FormField control={form.control} name="category" render={({ field }) => (
                <FormItem>
                  <FormLabel>Category</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger><SelectValue placeholder="Select a category" /></SelectTrigger>
                    </FormControl>
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

              {/* Location Input */}
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
                    <FormControl>
                      <div className="flex gap-2">
                        <Input placeholder="e.g., Near Inorbit Mall, Vashi" {...field} disabled={form.watch("useCurrentLocation")} />
                        <Button type="button" variant="outline" size="icon" disabled={form.watch("useCurrentLocation")}><MapPin className="h-4 w-4" /></Button>
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}/>
              </div>

              {/* Image Capture and Upload Section */}
              <div className="space-y-2">
                <FormLabel>Images</FormLabel>
                <FormDescription>Take or upload photos of the issue.</FormDescription>
                <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
                  {capturedImages.map((image, index) => (
                    <div key={index} className="relative aspect-square overflow-hidden rounded-md border">
                      <Image src={image.preview} alt={`Preview ${index + 1}`} fill className="object-cover" onLoad={() => URL.revokeObjectURL(image.preview)} />
                    </div>
                  ))}
                  {/* "Take a Picture" button */}
                  <label htmlFor="image-capture" className="flex aspect-square cursor-pointer flex-col items-center justify-center gap-1 rounded-md border-2 border-dashed bg-muted hover:bg-muted/80">
                    <Camera className="h-8 w-8 text-muted-foreground" />
                    <span className="text-xs font-semibold text-muted-foreground">Take a Picture</span>
                  </label>
                  <input id="image-capture" type="file" accept="image/*" capture="environment" onChange={handleImageAdd} className="hidden" />
                  
                  {/* "Upload" button */}
                  <label htmlFor="image-upload" className="flex aspect-square cursor-pointer flex-col items-center justify-center gap-1 rounded-md border-2 border-dashed bg-muted hover:bg-muted/80">
                    <Upload className="h-8 w-8 text-muted-foreground" />
                    <span className="text-xs font-semibold text-muted-foreground">Upload File</span>
                  </label>
                  <input id="image-upload" type="file" accept="image/*" onChange={handleImageAdd} className="hidden" />
                </div>
              </div>

              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? "Submitting Report..." : "Submit Report"}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  )
}