"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { useParams } from "next/navigation"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Textarea } from "@/components/ui/textarea"
import { toast } from "@/components/ui/use-toast"
import { MapPin, Share2, ThumbsUp } from "lucide-react"
import { getIssueById, getComments, addComment } from "@/lib/issuesService"

export default function IssueDetailPage() {
  const params = useParams()
  const issueId = params.id as string

  const [issue, setIssue] = useState<any>(null)
  const [comments, setComments] = useState<any[]>([])
  const [commentText, setCommentText] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchData() {
      try {
        const issueData = await getIssueById(issueId)
        const commentData = await getComments(issueId)
        setIssue(issueData)
        setComments(commentData)
      } catch (err) {
        setError("Failed to load issue details.")
      }
    }
    if (issueId) fetchData()
  }, [issueId])

  const handleSubmitComment = async () => {
    if (!commentText.trim()) return
    setIsSubmitting(true)
    try {
      await addComment(issueId, "Rahul Sharma", commentText)
      const updatedComments = await getComments(issueId)
      setComments(updatedComments)
      setCommentText("")
      toast({ title: "Comment Added", description: "Your comment has been added successfully." })
    } catch (err) {
      toast({ title: "Error", description: "Failed to submit comment." })
    }
    setIsSubmitting(false)
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending":
        return "bg-yellow-500 hover:bg-yellow-600"
      case "in-progress":
        return "bg-blue-500 hover:bg-blue-600"
      case "resolved":
        return "bg-green-500 hover:bg-green-600"
      default:
        return "bg-gray-500 hover:bg-gray-600"
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "high":
        return "bg-red-500 hover:bg-red-600"
      case "medium":
        return "bg-orange-500 hover:bg-orange-600"
      case "low":
        return "bg-blue-500 hover:bg-blue-600"
      default:
        return "bg-gray-500 hover:bg-gray-600"
    }
  }

  const handleShareIssue = () => {
    if (!issue) return
    if (navigator.clipboard) {
      navigator.clipboard.writeText(`https://urbanconnect.com/issues/${issue.id}`)
      toast({
        title: "Link Copied",
        description: "Issue link copied to clipboard.",
      })
    } else {
      toast({
        title: "Clipboard Error",
        description: "Clipboard API not available.",
      })
    }
  }

  if (error) {
    return <div className="p-8 text-center text-red-500">{error}</div>
  }

  if (!issue) {
    return <div className="p-8 text-center">Loading issue details...</div>
  }

  // Defensive fallback for arrays and nested objects
  const images = Array.isArray(issue.images) ? issue.images : []
  const timeline = Array.isArray(issue.timeline) ? issue.timeline : []
  const reportedBy = issue.reportedBy ?? {}
  const assignedTo = issue.assignedTo ?? {}
  const technician = issue.technician ?? {}

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-2">
        <div className="flex items-center gap-2">
          <Link href="/dashboard">
            <Button variant="ghost" size="sm">
              Dashboard
            </Button>
          </Link>
          <span className="text-muted-foreground">/</span>
          <Link href="/dashboard/issues">
            <Button variant="ghost" size="sm">
              Issues
            </Button>
          </Link>
          <span className="text-muted-foreground">/</span>
          <Button variant="ghost" size="sm" disabled>
            {issue.id}
          </Button>
        </div>
        <h1 className="text-3xl font-bold tracking-tight">{issue.title ?? "Untitled Issue"}</h1>
        <div className="flex flex-wrap items-center gap-2">
          <Badge className={`${getStatusColor(issue.status)} text-white`}>{issue.status?.replace("-", " ") ?? "unknown"}</Badge>
          <Badge className={`${getPriorityColor(issue.priority)} text-white`}>{issue.priority ?? "unknown"}</Badge>
          <span className="text-sm text-muted-foreground">
            Reported on {issue.createdAt ? new Date(issue.createdAt).toLocaleDateString() : "N/A"}
          </span>
          <span className="text-sm text-muted-foreground">ID: {issue.id ?? "N/A"}</span>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <div className="md:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Issue Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h3 className="font-semibold">Description</h3>
                <p className="mt-1 text-muted-foreground">{issue.description ?? "No description provided."}</p>
              </div>
              <div>
                <h3 className="font-semibold">Location</h3>
                <div className="mt-1 flex items-start gap-2">
                  <MapPin className="h-5 w-5 text-muted-foreground shrink-0 mt-0.5" />
                  <p className="text-muted-foreground">{issue.location ?? "Unknown"}</p>
                </div>
              </div>
              <div>
                <h3 className="font-semibold">Images</h3>
                <div className="mt-2 grid grid-cols-1 gap-4 sm:grid-cols-2">
                  {images.length > 0 ? (
                    images.map((image: string, index: number) => (
                      <div key={index} className="relative aspect-video overflow-hidden rounded-md border">
                        <img
                          src={image || "/placeholder.svg"}
                          alt={`Issue image ${index + 1}`}
                          className="h-full w-full object-cover"
                        />
                      </div>
                    ))
                  ) : (
                    <div className="text-muted-foreground">No images available.</div>
                  )}
                </div>
              </div>
            </CardContent>
            <CardFooter className="flex justify-between">
              <Button variant="outline" size="sm" onClick={handleShareIssue}>
                <Share2 className="mr-2 h-4 w-4" />
                Share
              </Button>
              <Button variant="outline" size="sm">
                <ThumbsUp className="mr-2 h-4 w-4" />
                Support (23)
              </Button>
            </CardFooter>
          </Card>

          <Tabs defaultValue="comments" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="comments">Comments</TabsTrigger>
              <TabsTrigger value="timeline">Timeline</TabsTrigger>
            </TabsList>
            <TabsContent value="comments">
              <Card>
                <CardHeader>
                  <CardTitle>Comments</CardTitle>
                  <CardDescription>Discussion about this issue</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {comments.length > 0 ? (
                    comments.map((comment) => (
                      <div key={comment.id} className="flex gap-4">
                        <Avatar className="h-10 w-10">
                          <AvatarFallback>{comment.user_name?.[0] || "U"}</AvatarFallback>
                        </Avatar>
                        <div className="flex-1 space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="font-semibold">{comment.user_name ?? "Anonymous"}</span>
                            <span className="text-xs text-muted-foreground">
                              {comment.created_at ? new Date(comment.created_at).toLocaleString() : ""}
                            </span>
                          </div>
                          <p className="text-sm">{comment.text ?? ""}</p>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-muted-foreground">No comments yet.</div>
                  )}
                </CardContent>
                <CardFooter>
                  <div className="flex w-full flex-col gap-2">
                    <Textarea
                      placeholder="Add a comment..."
                      value={commentText}
                      onChange={(e) => setCommentText(e.target.value)}
                    />
                    <Button
                      className="ml-auto"
                      disabled={!commentText.trim() || isSubmitting}
                      onClick={handleSubmitComment}
                    >
                      {isSubmitting ? "Submitting..." : "Submit"}
                    </Button>
                  </div>
                </CardFooter>
              </Card>
            </TabsContent>
            <TabsContent value="timeline">
              <Card>
                <CardHeader>
                  <CardTitle>Timeline</CardTitle>
                  <CardDescription>History of this issue</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="relative space-y-4 pl-6 before:absolute before:left-2 before:top-2 before:h-[calc(100%-16px)] before:w-[2px] before:bg-muted">
                    {timeline.length > 0 ? (
                      timeline.map((event: any) => (
                        <div key={event.id} className="relative">
                          <div className="absolute -left-6 flex h-6 w-6 items-center justify-center rounded-full bg-background">
                            {event.icon ? (
                              <event.icon className={`h-4 w-4 ${event.iconColor ?? ""}`} />
                            ) : (
                              <MapPin className="h-4 w-4 text-muted-foreground" />
                            )}
                          </div>
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <span className="font-semibold">{event.title ?? "Event"}</span>
                              <span className="text-xs text-muted-foreground">
                                {event.timestamp ? new Date(event.timestamp).toLocaleString() : ""}
                              </span>
                            </div>
                            <p className="text-sm text-muted-foreground">{event.description ?? ""}</p>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="text-muted-foreground">No timeline events available.</div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Status Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-1">
                <span className="text-sm font-medium">Category</span>
                <p className="text-sm text-muted-foreground capitalize">{issue.category?.replace("-", " ") ?? "N/A"}</p>
              </div>
              <Separator />
              <div className="space-y-1">
                <span className="text-sm font-medium">Reported By</span>
                <div className="flex items-center gap-2">
                  <Avatar className="h-6 w-6">
                    <AvatarImage src={reportedBy.avatar || "/placeholder.svg"} alt={reportedBy.name ?? "User"} />
                    <AvatarFallback>{reportedBy.initials ?? "U"}</AvatarFallback>
                  </Avatar>
                  <p className="text-sm text-muted-foreground">{reportedBy.name ?? "Unknown"}</p>
                </div>
              </div>
              <Separator />
              <div className="space-y-1">
                <span className="text-sm font-medium">Assigned Department</span>
                <p className="text-sm text-muted-foreground">{assignedTo.name ?? "N/A"}</p>
                <p className="text-xs text-muted-foreground">{assignedTo.contact ?? ""}</p>
              </div>
              <Separator />
              <div className="space-y-1">
                <span className="text-sm font-medium">Assigned Technician</span>
                <p className="text-sm text-muted-foreground">{technician.name ?? "N/A"}</p>
                <p className="text-xs text-muted-foreground">{technician.contact ?? ""}</p>
              </div>
              <Separator />
              <div className="space-y-1">
                <span className="text-sm font-medium">Estimated Resolution</span>
                <p className="text-sm text-muted-foreground">
                  {issue.estimatedResolutionDate ? new Date(issue.estimatedResolutionDate).toLocaleDateString() : "N/A"}
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Similar Issues</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="rounded-md border p-3">
                <div className="flex justify-between">
                  <h3 className="font-medium">Pothole near City Mall</h3>
                  <Badge className="bg-green-500 hover:bg-green-600 text-white">resolved</Badge>
                </div>
                <p className="text-sm text-muted-foreground mt-1">Sector 1, City Mall Road</p>
              </div>
              <div className="rounded-md border p-3">
                <div className="flex justify-between">
                  <h3 className="font-medium">Road damage after rain</h3>
                  <Badge className="bg-blue-500 hover:bg-blue-600 text-white">in progress</Badge>
                </div>
                <p className="text-sm text-muted-foreground mt-1">Sector 2, Hospital Road</p>
              </div>
              <div className="rounded-md border p-3">
                <div className="flex justify-between">
                  <h3 className="font-medium">Damaged road surface</h3>
                  <Badge className="bg-yellow-500 hover:bg-yellow-600 text-white">pending</Badge>
                </div>
                <p className="text-sm text-muted-foreground mt-1">Sector 3, School Lane</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}