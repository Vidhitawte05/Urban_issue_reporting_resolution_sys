"use client"

import { useState } from "react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Search, ExternalLink, Star } from "lucide-react"
import Link from "next/link"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { toast } from "@/components/ui/use-toast"
import { ClientOnly } from "@/components/client-only" // <-- The component is imported here

// Mock data for resolved issues
const resolvedIssues = [
  {
    id: "ISSUE-1236",
    title: "Garbage Collection Missed",
    description: "Garbage not collected for the past week",
    status: "resolved",
    priority: "medium",
    location: "Sector 2, Residential Block C",
    category: "sanitation",
    createdAt: "2023-04-10T11:45:00Z",
    resolvedAt: "2023-04-17T16:30:00Z",
    resolvedBy: {
      name: "Vikram Mehta",
      avatar: "/placeholder-user.jpg",
      initials: "VM",
      department: "Sanitation Department",
    },
    resolution: "Garbage collection schedule restored. Area cleaned and sanitized.",
    feedback: null,
    beforeImages: ["/placeholder.svg?height=300&width=400&text=Before Image"],
    afterImages: ["/placeholder.svg?height=300&width=400&text=After Image"],
  },
  {
    id: "ISSUE-1230",
    title: "Street Light Flickering",
    description: "Street light at the corner of Main Street and Park Avenue is flickering",
    status: "resolved",
    priority: "low",
    location: "Sector 2, Main Street",
    category: "electricity",
    createdAt: "2023-04-05T09:20:00Z",
    resolvedAt: "2023-04-12T14:15:00Z",
    resolvedBy: {
      name: "Rajesh Kumar",
      avatar: "/placeholder-user.jpg",
      initials: "RK",
      department: "Electricity Department",
    },
    resolution: "Replaced faulty bulb and repaired wiring issue.",
    feedback: {
      rating: 4,
      comment: "Good job, fixed quickly!",
      submittedAt: "2023-04-13T10:30:00Z",
    },
    beforeImages: ["/placeholder.svg?height=300&width=400&text=Before Image"],
    afterImages: ["/placeholder.svg?height=300&width=400&text=After Image"],
  },
  {
    id: "ISSUE-1225",
    title: "Water Leakage in Park",
    description: "Water pipe leaking in the central park area",
    status: "resolved",
    priority: "high",
    location: "Sector 2, Central Park",
    category: "water",
    createdAt: "2023-04-02T08:15:00Z",
    resolvedAt: "2023-04-08T11:45:00Z",
    resolvedBy: {
      name: "Suresh Patel",
      avatar: "/placeholder-user.jpg",
      initials: "SP",
      department: "Water Department",
    },
    resolution: "Repaired broken pipe and restored water supply. Area cleaned up.",
    feedback: {
      rating: 5,
      comment: "Excellent work! Fixed faster than expected and cleaned up the area.",
      submittedAt: "2023-04-09T09:20:00Z",
    },
    beforeImages: ["/placeholder.svg?height=300&width=400&text=Before Image"],
    afterImages: ["/placeholder.svg?height=300&width=400&text=After Image"],
  },
]

export default function ResolvedIssuesPage() {
  const [searchQuery, setSearchQuery] = useState("")
  const [categoryFilter, setCategoryFilter] = useState("all")
  const [feedbackFilter, setFeedbackFilter] = useState("all")

  const filteredIssues = resolvedIssues.filter((issue) => {
    const matchesSearch =
      issue.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      issue.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      issue.location.toLowerCase().includes(searchQuery.toLowerCase())

    const matchesCategory = categoryFilter === "all" || issue.category === categoryFilter
    const matchesFeedback =
      feedbackFilter === "all" ||
      (feedbackFilter === "with-feedback" && issue.feedback) ||
      (feedbackFilter === "without-feedback" && !issue.feedback)

    return matchesSearch && matchesCategory && matchesFeedback
  })

  const handleSubmitFeedback = (issueId: string, rating: number) => {
    toast({
      title: "Feedback Submitted",
      description: `Thank you for rating this resolution ${rating}/5 stars.`,
    })
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold tracking-tight">Resolved Issues</h1>
        <p className="text-muted-foreground">View issues that have been successfully resolved.</p>
      </div>

      <div className="flex flex-col gap-4">
        <div className="flex flex-col gap-4 sm:flex-row">
          <div className="relative flex-1">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search resolved issues..."
              className="pl-8"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <Select value={categoryFilter} onValueChange={setCategoryFilter}>
            <SelectTrigger className="w-full sm:w-[180px]">
              <SelectValue placeholder="Filter by category" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              <SelectItem value="roads">Roads & Potholes</SelectItem>
              <SelectItem value="water">Water Supply</SelectItem>
              <SelectItem value="electricity">Electricity</SelectItem>
              <SelectItem value="sanitation">Sanitation</SelectItem>
              <SelectItem value="infrastructure">Infrastructure</SelectItem>
              <SelectItem value="environment">Environment</SelectItem>
            </SelectContent>
          </Select>
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

        <Card>
          <CardHeader>
            <CardTitle>Resolved Issues</CardTitle>
            <CardDescription>Issues that have been successfully addressed and resolved</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {filteredIssues.length > 0 ? (
                filteredIssues.map((issue) => (
                  <div key={issue.id} className="flex flex-col gap-4 rounded-lg border p-4">
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="font-semibold">{issue.title}</h3>
                        <p className="text-sm text-muted-foreground">{issue.location}</p>
                      </div>
                      <Badge className="bg-green-500 hover:bg-green-600 text-white">Resolved</Badge>
                    </div>
                    <p className="text-sm">{issue.description}</p>

                    <div className="rounded-md bg-muted p-3">
                      <h4 className="font-medium">Resolution</h4>
                      <p className="mt-1 text-sm">{issue.resolution}</p>
                      <div className="mt-2 flex items-center gap-2">
                        <span className="text-xs text-muted-foreground">Resolved by:</span>
                        <div className="flex items-center gap-2">
                          <Avatar className="h-6 w-6">
                            <AvatarImage
                              src={issue.resolvedBy.avatar || "/placeholder.svg"}
                              alt={issue.resolvedBy.name}
                            />
                            <AvatarFallback>{issue.resolvedBy.initials}</AvatarFallback>
                          </Avatar>
                          <div className="flex flex-col">
                            <span className="text-xs font-medium">{issue.resolvedBy.name}</span>
                            <span className="text-xs text-muted-foreground">{issue.resolvedBy.department}</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                      <div>
                        <h4 className="mb-2 text-sm font-medium">Before</h4>
                        <div className="aspect-video overflow-hidden rounded-md border">
                          <img
                            src={issue.beforeImages[0] || "/placeholder.svg"}
                            alt="Before"
                            className="h-full w-full object-cover"
                          />
                        </div>
                      </div>
                      <div>
                        <h4 className="mb-2 text-sm font-medium">After</h4>
                        <div className="aspect-video overflow-hidden rounded-md border">
                          <img
                            src={issue.afterImages[0] || "/placeholder.svg"}
                            alt="After"
                            className="h-full w-full object-cover"
                          />
                        </div>
                      </div>
                    </div>

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
                          <ClientOnly>
                            {new Date(issue.feedback.submittedAt).toLocaleDateString()}
                          </ClientOnly>
                        </p>
                      </div>
                    ) : (
                      <div className="rounded-md bg-blue-50 p-3 dark:bg-blue-950">
                        <h4 className="font-medium text-blue-800 dark:text-blue-300">Provide Feedback</h4>
                        <p className="mt-1 text-sm text-blue-800 dark:text-blue-300">
                          How satisfied are you with the resolution of this issue?
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
                        {/* Wrap the dates in the ClientOnly component */}
                        <span>Reported: <ClientOnly>{new Date(issue.createdAt).toLocaleDateString()}</ClientOnly></span>
                        <span>Resolved: <ClientOnly>{new Date(issue.resolvedAt).toLocaleDateString()}</ClientOnly></span>
                      </div>
                      <Button variant="ghost" size="sm" asChild>
                        <Link href={`/dashboard/issues/${issue.id}`}>
                          <ExternalLink className="mr-2 h-4 w-4" />
                          Details
                        </Link>
                      </Button>
                    </div>
                  </div>
                ))
              ) : (
                <div className="flex h-32 items-center justify-center rounded-lg border border-dashed">
                  <p className="text-center text-muted-foreground">
                    No resolved issues found.{" "}
                    {searchQuery || categoryFilter !== "all" || feedbackFilter !== "all"
                      ? "Try adjusting your filters."
                      : "Issues will appear here once they are resolved."}
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}


