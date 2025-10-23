"use client"

import { useEffect, useState } from "react"
import { supabase } from "@/lib/supabaseClient"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Search, Star, ExternalLink } from "lucide-react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import Link from "next/link"
import { toast } from "@/components/ui/use-toast"

type Issue = {
  id: string
  title: string
  description: string
  status: string
  priority: string
  category?: string
  location?: string
  created_at: string
  resolved_at?: string
  resolution?: string
  resolved_by?: { name?: string; avatar?: string; initials?: string; department?: string }
  before_images?: string[]
  after_images?: string[]
  feedback?: { rating?: number; comment?: string; submitted_at?: string }
}

export default function ResolvedIssuesPage() {
  const [issues, setIssues] = useState<Issue[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [filter, setFilter] = useState("all")
  const [activeIssueId, setActiveIssueId] = useState<string | null>(null)
  const [selectedRating, setSelectedRating] = useState<number | null>(null)
  const [feedbackText, setFeedbackText] = useState("")

  // ✅ Fetch all resolved issues (any category)
  const fetchIssues = async () => {
    setLoading(true)
    const { data, error } = await supabase
      .from("issues")
      .select("*")
      .eq("status", "resolved")
      .order("resolved_at", { ascending: false })
      .limit(50)

    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" })
    } else {
      setIssues(data || [])
    }
    setLoading(false)
  }

  useEffect(() => {
    fetchIssues()

    // ✅ Real-time subscription for resolved issues
    const channel = supabase
      .channel("resolved-issues")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "issues" },
        () => fetchIssues()
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [])

  // ✅ Filter and search
  const filtered = issues.filter((issue) => {
    const s = search.toLowerCase()
    const matchSearch =
      issue.title.toLowerCase().includes(s) ||
      issue.description.toLowerCase().includes(s) ||
      issue.location?.toLowerCase().includes(s) ||
      issue.category?.toLowerCase().includes(s)
    const matchFeedback =
      filter === "all" ||
      (filter === "with-feedback" && issue.feedback?.rating) ||
      (filter === "without-feedback" && !issue.feedback?.rating)
    return matchSearch && matchFeedback
  })

  // ✅ Submit feedback (rating + optional comment)
  const handleSubmitFeedback = async (issueId: string) => {
    if (!selectedRating) {
      toast({ title: "Missing rating", description: "Please select a rating.", variant: "destructive" })
      return
    }

    const feedback = {
      rating: selectedRating,
      comment: feedbackText.trim() || null,
      submitted_at: new Date().toISOString(),
    }

    const { error } = await supabase.from("issues").update({ feedback }).eq("id", issueId)
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" })
    } else {
      toast({ title: "Thank you!", description: "Your feedback has been recorded." })
      setActiveIssueId(null)
      setSelectedRating(null)
      setFeedbackText("")
      fetchIssues()
    }
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Resolved Issues</h1>
        <p className="text-muted-foreground">View and rate all issues that have been resolved.</p>
      </div>

      {/* Search + Filter */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search resolved issues..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-8"
          />
        </div>
        <Select value={filter} onValueChange={setFilter}>
          <SelectTrigger className="sm:w-[180px]">
            <SelectValue placeholder="Filter feedback" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All</SelectItem>
            <SelectItem value="with-feedback">With Feedback</SelectItem>
            <SelectItem value="without-feedback">Without Feedback</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Issues List */}
      <Card>
        <CardHeader>
          <CardTitle>Resolved Issues</CardTitle>
          <CardDescription>All issues marked as resolved by the administration.</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="text-center text-muted-foreground">Loading issues...</p>
          ) : filtered.length === 0 ? (
            <div className="flex h-32 items-center justify-center border border-dashed rounded-lg">
              <p className="text-muted-foreground">
                No resolved issues found. Try adjusting your filters.
              </p>
            </div>
          ) : (
            <div className="space-y-6">
              {filtered.map((issue) => (
                <div key={issue.id} className="border p-4 rounded-lg space-y-4">
                  {/* Header */}
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-semibold">{issue.title}</h3>
                      <p className="text-sm text-muted-foreground">
                        {issue.category || "General"} • {issue.location || "Unknown location"}
                      </p>
                    </div>
                    <Badge className="bg-green-500 text-white">Resolved</Badge>
                  </div>

                  <p className="text-sm">{issue.description}</p>

                  {/* Before/After */}
                  {/* Before & After Images */}
<div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
  <div>
    <h4 className="mb-2 text-sm font-medium">Before</h4>
    <div className="aspect-video overflow-hidden rounded-md border">
      <img
        src={issue.before_images?.[0] || "/placeholder.svg"}
        alt="Before"
        className="h-full w-full object-cover"
        onError={(e) => (e.currentTarget.src = "/placeholder.svg")}
      />
    </div>
  </div>
  <div>
    <h4 className="mb-2 text-sm font-medium">After</h4>
    <div className="aspect-video overflow-hidden rounded-md border">
      <img
        src={issue.after_images?.[0] || "/placeholder.svg"}
        alt="After"
        className="h-full w-full object-cover"
        onError={(e) => (e.currentTarget.src = "/placeholder.svg")}
      />
    </div>
  </div>
</div>


                  {/* Resolution */}
                  {issue.resolution && (
                    <div className="bg-muted p-3 rounded-md">
                      <p className="text-sm">
                        <strong>Resolution:</strong> {issue.resolution}
                      </p>
                      {issue.resolved_by && (
                        <div className="flex items-center gap-2 mt-2">
                          <Avatar className="h-6 w-6">
                            <AvatarImage src={issue.resolved_by.avatar || "/placeholder.svg"} />
                            <AvatarFallback>{issue.resolved_by.initials}</AvatarFallback>
                          </Avatar>
                          <p className="text-xs text-muted-foreground">
                            Resolved by {issue.resolved_by.name} ({issue.resolved_by.department})
                          </p>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Feedback */}
                  {issue.feedback ? (
                    <div className="bg-green-50 p-3 rounded-md dark:bg-green-950">
                      <h4 className="font-medium">Your Feedback</h4>
                      <div className="flex items-center gap-1 mt-1">
                        {Array.from({ length: 5 }).map((_, i) => (
                          <Star
                            key={i}
                            className={`h-4 w-4 ${
                              i < (issue.feedback?.rating || 0)
                                ? "text-yellow-500 fill-yellow-500"
                                : "text-gray-300"
                            }`}
                          />
                        ))}
                      </div>
                      {issue.feedback.comment && (
                        <p className="mt-1 text-sm">{issue.feedback.comment}</p>
                      )}
                    </div>
                  ) : activeIssueId === issue.id ? (
                    <div className="bg-blue-50 p-3 rounded-md dark:bg-blue-950">
                      <h4 className="font-medium">Provide Feedback</h4>
                      <div className="flex items-center gap-1 mt-1">
                        {Array.from({ length: 5 }).map((_, i) => (
                          <button
                            key={i}
                            onClick={() => setSelectedRating(i + 1)}
                            className="p-1 rounded-full hover:bg-blue-100 dark:hover:bg-blue-900"
                          >
                            <Star
                              className={`h-5 w-5 ${
                                selectedRating && i < selectedRating
                                  ? "text-yellow-500 fill-yellow-500"
                                  : "text-gray-300"
                              }`}
                            />
                          </button>
                        ))}
                      </div>
                      <Textarea
                        placeholder="Leave a comment (optional)"
                        value={feedbackText}
                        onChange={(e) => setFeedbackText(e.target.value)}
                        className="mt-2"
                      />
                      <div className="flex gap-2 mt-2">
                        <Button size="sm" onClick={() => handleSubmitFeedback(issue.id)}>
                          Submit
                        </Button>
                        <Button size="sm" variant="ghost" onClick={() => setActiveIssueId(null)}>
                          Cancel
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <Button size="sm" variant="outline" onClick={() => setActiveIssueId(issue.id)}>
                      Give Feedback
                    </Button>
                  )}

                  {/* Footer */}
                  <div className="flex justify-between text-xs text-muted-foreground pt-1">
                    <span>Reported: {new Date(issue.created_at).toLocaleDateString()}</span>
                    {issue.resolved_at && (
                      <span>Resolved: {new Date(issue.resolved_at).toLocaleDateString()}</span>
                    )}
                    <Button asChild variant="ghost" size="sm">
                      <Link href={`/dashboard/issues/${issue.id}`}>
                        <ExternalLink className="h-4 w-4 mr-1" /> Details
                      </Link>
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
