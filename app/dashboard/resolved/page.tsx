"use client"

import { useEffect, useState } from "react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Search, ExternalLink, Star } from "lucide-react"
import Link from "next/link"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { toast } from "@/components/ui/use-toast"
import { ClientOnly } from "@/components/client-only"
import { supabase } from "@/lib/supabaseClient"

type Issue = {
  id: string
  title: string
  description: string
  status: string
  priority: string
  location: string
  category: string
  created_at: string
  resolved_at?: string
  resolved_by?: {
    name: string
    avatar?: string
    initials: string
    department: string
  }
  resolution?: string
  feedback?: {
    rating: number
    comment?: string
    submitted_at: string
  }
  before_images?: string[]
  after_images?: string[]
}

export default function ResolvedIssuesPage() {
  const [searchQuery, setSearchQuery] = useState("")
  const [feedbackFilter, setFeedbackFilter] = useState("all")
  const [issues, setIssues] = useState<Issue[]>([])
  const [loading, setLoading] = useState(true)

  // ✅ Fetch resolved pothole issues
  const fetchIssues = async () => {
    setLoading(true)
    const { data, error } = await supabase
      .from("issues")
      .select("*")
      .eq("status", "resolved")
      .eq("category", "pothole")
      .order("resolved_at", { ascending: false })

    if (error) {
      console.error("Error fetching issues:", error.message)
      toast({
        title: "Error loading issues",
        description: error.message,
        variant: "destructive",
      })
    } else {
      setIssues(data || [])
    }
    setLoading(false)
  }

  useEffect(() => {
    fetchIssues()

    // ✅ Realtime subscription for pothole issues
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

  const filteredIssues = issues.filter((issue) => {
    const matchesSearch =
      issue.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      issue.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      issue.location.toLowerCase().includes(searchQuery.toLowerCase())

    const matchesFeedback =
      feedbackFilter === "all" ||
      (feedbackFilter === "with-feedback" && issue.feedback) ||
      (feedbackFilter === "without-feedback" && !issue.feedback)

    return matchesSearch && matchesFeedback
  })

  const handleSubmitFeedback = async (issueId: string, rating: number) => {
    const { error } = await supabase
      .from("issues")
      .update({
        feedback: {
          rating,
          submitted_at: new Date().toISOString(),
        },
      })
      .eq("id", issueId)

    if (error) {
      toast({
        title: "Error submitting feedback",
        description: error.message,
        variant: "destructive",
      })
    } else {
      toast({
        title: "Feedback Submitted",
        description: `Thank you for rating this resolution ${rating}/5 stars.`,
      })
      fetchIssues()
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold tracking-tight">Resolved Pothole Issues</h1>
        <p className="text-muted-foreground">View pothole issues that have been successfully resolved.</p>
      </div>

      {/* Search + Feedback filter */}
      <div className="flex flex-col gap-4 sm:flex-row">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Search resolved pothole issues..."
            className="pl-8"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <Select value={feedbackFilter} onValueChange={setFeedbackFilter}>
          <SelectTrigger className="w-full sm:w-[180px]">
            <SelectValue placeholder="Filter by feedback" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Issues</SelectItem>
            <SelectItem value="with-feedback">With Feedback</SelectItem>
            <SelectItem value="without-feedback">Needs Feedback</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Issues */}
      <Card>
        <CardHeader>
          <CardTitle>Resolved Pothole Issues</CardTitle>
          <CardDescription>Issues that have been successfully fixed</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="text-muted-foreground">Loading issues...</p>
          ) : filteredIssues.length > 0 ? (
            <div className="space-y-6">
              {filteredIssues.map((issue) => (
                <div key={issue.id} className="flex flex-col gap-4 rounded-lg border p-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="font-semibold">{issue.title}</h3>
                      <p className="text-sm text-muted-foreground">{issue.location}</p>
                    </div>
                    <Badge className="bg-green-500 hover:bg-green-600 text-white">Resolved</Badge>
                  </div>
                  <p className="text-sm">{issue.description}</p>

                  {issue.resolution && (
                    <div className="rounded-md bg-muted p-3">
                      <h4 className="font-medium">Resolution</h4>
                      <p className="mt-1 text-sm">{issue.resolution}</p>
                      {issue.resolved_by && (
                        <div className="mt-2 flex items-center gap-2">
                          <span className="text-xs text-muted-foreground">Resolved by:</span>
                          <div className="flex items-center gap-2">
                            <Avatar className="h-6 w-6">
                              <AvatarImage
                                src={issue.resolved_by.avatar || "/placeholder.svg"}
                                alt={issue.resolved_by.name}
                              />
                              <AvatarFallback>{issue.resolved_by.initials}</AvatarFallback>
                            </Avatar>
                            <div className="flex flex-col">
                              <span className="text-xs font-medium">{issue.resolved_by.name}</span>
                              <span className="text-xs text-muted-foreground">{issue.resolved_by.department}</span>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Before & After Images */}
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div>
                      <h4 className="mb-2 text-sm font-medium">Before</h4>
                      <div className="aspect-video overflow-hidden rounded-md border">
                        <img
                          src={issue.before_images?.[0] || "/placeholder.svg"}
                          alt="Before"
                          className="h-full w-full object-cover"
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
                        />
                      </div>
                    </div>
                  </div>

                  {/* Feedback */}
                  {issue.feedback ? (
                    <div className="rounded-md bg-green-50 p-3 dark:bg-green-950">
                      <h4 className="font-medium text-green-800 dark:text-green-300">Your Feedback</h4>
                      <div className="mt-1 flex items-center gap-1">
                        {Array.from({ length: 5 }).map((_, i) => (
                          <Star
                            key={i}
                            className={`h-4 w-4 ${
                              i < (issue.feedback?.rating || 0) ? "fill-yellow-500 text-yellow-500" : "text-gray-300"
                            }`}
                          />
                        ))}
                        <span className="ml-2 text-sm text-green-800 dark:text-green-300">
                          {issue.feedback.rating}/5
                        </span>
                      </div>
                      {issue.feedback.comment && (
                        <p className="mt-1 text-sm text-green-800 dark:text-green-300">{issue.feedback.comment}</p>
                      )}
                      <p className="mt-1 text-xs text-green-700 dark:text-green-400">
                        Submitted on{" "}
                        <ClientOnly>{new Date(issue.feedback.submitted_at).toLocaleDateString()}</ClientOnly>
                      </p>
                    </div>
                  ) : (
                    <div className="rounded-md bg-blue-50 p-3 dark:bg-blue-950">
                      <h4 className="font-medium text-blue-800 dark:text-blue-300">Provide Feedback</h4>
                      <p className="mt-1 text-sm text-blue-800 dark:text-blue-300">
                        How satisfied are you with the resolution of this pothole?
                      </p>
                      <div className="mt-2 flex items-center gap-1">
                        {Array.from({ length: 5 }).map((_, i) => (
                          <button
                            key={i}
                            onClick={() => handleSubmitFeedback(issue.id, i + 1)}
                            className="rounded-full p-1 hover:bg-blue-100 dark:hover:bg-blue-900"
                          >
                            <Star className="h-5 w-5 text-gray-300 hover:fill-yellow-500 hover:text-yellow-500" />
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="flex items-center justify-between pt-2 text-xs text-muted-foreground">
                    <div className="flex items-center gap-4">
                      <span>ID: {issue.id}</span>
                      <span>
                        Reported:{" "}
                        <ClientOnly>{new Date(issue.created_at).toLocaleDateString()}</ClientOnly>
                      </span>
                      {issue.resolved_at && (
                        <span>
                          Resolved: <ClientOnly>{new Date(issue.resolved_at).toLocaleDateString()}</ClientOnly>
                        </span>
                      )}
                    </div>
                    <Button variant="ghost" size="sm" asChild>
                      <Link href={`/dashboard/issues/${issue.id}`}>
                        <ExternalLink className="mr-2 h-4 w-4" />
                        Details
                      </Link>
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex h-32 items-center justify-center rounded-lg border border-dashed">
              <p className="text-center text-muted-foreground">
                No resolved pothole issues found.{" "}
                {searchQuery || feedbackFilter !== "all"
                  ? "Try adjusting your filters."
                  : "Issues will appear here once they are resolved."}
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
