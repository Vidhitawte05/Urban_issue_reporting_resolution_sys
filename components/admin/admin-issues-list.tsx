"use client"

import { useState, useEffect } from "react"
import { supabase } from "@/lib/supabaseClient"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Skeleton } from "@/components/ui/skeleton"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { MapPin, User, Calendar, Search, Eye, Edit, Wrench, AlertTriangle } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"

interface Issue {
  id: string
  title: string
  description: string
  priority: string
  status: string
  submittedBy: string
  submittedDate: string
  location: string
  contact: string
  email: string
  assignedTo: string | null
  before_images?: string[] | null
  after_images?: string[] | null
}

export function AdminIssuesList({ filter }: { filter: string }) {
  const [searchTerm, setSearchTerm] = useState("")
  const [issues, setIssues] = useState<Issue[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedIssue, setSelectedIssue] = useState<Issue | null>(null)
  const [newStatus, setNewStatus] = useState("")
  const [afterImageFile, setAfterImageFile] = useState<File | null>(null)
  const { toast } = useToast()

  // 🔹 Fetch issues from Supabase
  useEffect(() => {
    const fetchIssues = async () => {
      setLoading(true)
      const { data, error } = await supabase.from("issues").select("*").order("created_at", { ascending: false })
      if (error) setError(error.message)
      else setIssues(data || [])
      setLoading(false)
    }

    fetchIssues()
  }, [])

  // ✅ Upload after-image to Supabase Storage
  async function uploadAfterImage(issueId: string, file: File) {
    try {
      const bucket = "issues-images" // 🪣 Admin bucket name
      const ext = file.name.split(".").pop()
      const filePath = `after/${issueId}-${Date.now()}.${ext}`

      // Upload image
      const { data, error } = await supabase.storage
        .from(bucket)
        .upload(filePath, file, { upsert: true, contentType: file.type })
      if (error) throw error

      // Get public URL
      const { data: publicData } = supabase.storage.from(bucket).getPublicUrl(filePath)
      if (!publicData?.publicUrl) throw new Error("No public URL returned")

      return publicData.publicUrl
    } catch (err: any) {
      console.error("Upload failed:", err.message)
      toast({ title: "Upload failed", description: err.message, variant: "destructive" })
      return null
    }
  }

  // ✅ Update issue status + after image
  const handleUpdateIssueStatus = async (issueId: string) => {
    try {
      let afterImageUrl: string | null = null

      if (newStatus === "resolved" && afterImageFile) {
        toast({ title: "Uploading image...", description: "Please wait..." })
        afterImageUrl = await uploadAfterImage(issueId, afterImageFile)
        if (!afterImageUrl) throw new Error("Image upload failed")
      }

      const updates: any = { status: newStatus }
      if (afterImageUrl) updates.after_images = [afterImageUrl]

      const { error } = await supabase.from("issues").update(updates).eq("id", issueId)
      if (error) throw error

      toast({ title: "Success", description: "Issue updated successfully." })
      setAfterImageFile(null)
      setNewStatus("")
      setIssues((prev) => prev.map((i) => (i.id === issueId ? { ...i, ...updates } : i)))
    } catch (err: any) {
      console.error(err)
      toast({ title: "Error", description: err.message, variant: "destructive" })
    }
  }

  // ✅ File handler
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null
    setAfterImageFile(file)
  }

  const filteredIssues = issues.filter((issue) => {
    const matchesFilter =
      filter === "all" ||
      issue.status === filter ||
      (filter === "high" && issue.priority === "high")
    const matchesSearch =
      issue.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      issue.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      issue.location.toLowerCase().includes(searchTerm.toLowerCase())
    return matchesFilter && matchesSearch
  })

  // --- Loading ---
  if (loading)
    return (
      <Card>
        <CardHeader>
          <CardTitle>Loading Issues...</CardTitle>
        </CardHeader>
        <CardContent>
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-5 w-full mb-3" />
          ))}
        </CardContent>
      </Card>
    )

  // --- Error ---
  if (error)
    return (
      <Card>
        <CardHeader>
          <CardTitle>Error</CardTitle>
          <CardDescription className="text-red-500">Failed to load issues: {error}</CardDescription>
        </CardHeader>
      </Card>
    )

  // --- UI ---
  return (
    <div className="space-y-6">
      {/* 🔍 Search bar */}
      <div className="flex items-center gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search issues..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Issues</CardTitle>
          <CardDescription>
            {filter === "all" ? "All reported issues" : `Filtered by: ${filter}`}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {filteredIssues.length === 0 ? (
            <p className="text-center text-muted-foreground py-10">No issues found.</p>
          ) : (
            filteredIssues.map((issue) => (
              <div key={issue.id} className="border rounded-lg p-4 mb-3">
                <div className="flex items-center gap-3">
                  <h3 className="font-semibold text-lg">{issue.title}</h3>
                  <Badge>{issue.status}</Badge>
                  <Badge variant="secondary">{issue.priority}</Badge>
                </div>

                <p className="text-sm text-muted-foreground mb-2">{issue.description}</p>

                <div className="flex gap-3 text-xs text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <User className="w-3 h-3" /> {issue.submittedBy}
                  </div>
                  <div className="flex items-center gap-1">
                    <MapPin className="w-3 h-3" /> {issue.location}
                  </div>
                  <div className="flex items-center gap-1">
                    <Calendar className="w-3 h-3" /> {issue.submittedDate}
                  </div>
                </div>

                <div className="flex justify-end gap-2 mt-3">
                  {/* 👁 View Issue */}
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button size="sm" variant="outline" onClick={() => setSelectedIssue(issue)}>
                        <Eye className="w-4 h-4 mr-1" /> View
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                          <AlertTriangle className="w-5 h-5" />
                          Issue Details
                        </DialogTitle>
                      </DialogHeader>
                      {selectedIssue && (
                        <div className="space-y-3">
                          <p><strong>Title:</strong> {selectedIssue.title}</p>
                          <p><strong>Description:</strong> {selectedIssue.description}</p>
                          <p><strong>Status:</strong> {selectedIssue.status}</p>

                          {/* Before & After Images */}
                          {selectedIssue.before_images?.[0] && (
                            <div>
                              <p className="font-medium">Before:</p>
                              <img
                                src={selectedIssue.before_images[0]}
                                alt="Before"
                                className="rounded-lg mt-1"
                              />
                            </div>
                          )}
                          {selectedIssue.after_images?.[0] && (
                            <div>
                              <p className="font-medium mt-2">After:</p>
                              <img
                                src={selectedIssue.after_images[0]}
                                alt="After"
                                className="rounded-lg mt-1"
                              />
                            </div>
                          )}
                        </div>
                      )}
                    </DialogContent>
                  </Dialog>

                  {/* ✏️ Update Issue */}
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button size="sm">
                        <Edit className="w-4 h-4 mr-1" /> Update
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Update Issue</DialogTitle>
                        <DialogDescription>
                          Change the status and upload after image if resolved.
                        </DialogDescription>
                      </DialogHeader>

                      <div className="space-y-3">
                        <Select value={newStatus} onValueChange={setNewStatus}>
                          <SelectTrigger>
                            <SelectValue placeholder="Select new status" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="pending">Pending</SelectItem>
                            <SelectItem value="in-progress">In Progress</SelectItem>
                            <SelectItem value="resolved">Resolved</SelectItem>
                            <SelectItem value="rejected">Rejected</SelectItem>
                          </SelectContent>
                        </Select>

                        {newStatus === "resolved" && (
                          <div className="space-y-2">
                            <Label htmlFor="after-image">Upload After Image</Label>
                            <Input
                              id="after-image"
                              type="file"
                              accept="image/*"
                              onChange={handleFileChange}
                            />
                          </div>
                        )}
                      </div>

                      <Button
                        onClick={() => handleUpdateIssueStatus(issue.id)}
                        disabled={!newStatus || (newStatus === "resolved" && !afterImageFile)}
                      >
                        Save
                      </Button>
                    </DialogContent>
                  </Dialog>

                  <Button size="sm" variant="secondary">
                    <Wrench className="w-4 h-4 mr-1" /> Assign
                  </Button>
                </div>
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  )
}
