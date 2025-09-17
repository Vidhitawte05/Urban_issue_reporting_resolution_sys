"use client"

import { useEffect, useState } from "react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Search, ExternalLink, Clock, AlertTriangle } from "lucide-react"
import Link from "next/link"
import { Progress } from "@/components/ui/progress"
import { supabase } from "@/lib/supabaseClient"
import { toast } from "@/components/ui/use-toast"

type Issue = {
  id: string
  title: string
  description: string
  status: string
  priority: string
  location: string
  category: string
  created_at: string
  updated_at?: string
  stage?: string
  stage_progress?: number
  estimated_time?: string
}

export default function PendingIssuesPage() {
  const [searchQuery, setSearchQuery] = useState("")
  const [priorityFilter, setPriorityFilter] = useState("all")
  const [issues, setIssues] = useState<Issue[]>([])
  const [loading, setLoading] = useState(true)

  // ✅ Fetch pothole issues
  const fetchIssues = async () => {
    setLoading(true)
    const { data, error } = await supabase
      .from("issues")
      .select("*")
      .eq("status", "pending")
      .eq("category", "pothole") // 👈 Only potholes
      .order("created_at", { ascending: false })

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

    // ✅ Real-time subscription for pothole issues
    const channel = supabase
      .channel("issues-changes")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "issues" },
        (payload) => {
          console.log("Realtime change:", payload)
          fetchIssues()
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [])

  // Filters
  const filteredIssues = issues.filter((issue) => {
    const matchesSearch =
      issue.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      issue.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      issue.location.toLowerCase().includes(searchQuery.toLowerCase())

    const matchesPriority = priorityFilter === "all" || issue.priority === priorityFilter

    return matchesSearch && matchesPriority
  })

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

  const getStageLabel = (stage?: string) => {
    switch (stage) {
      case "initial":
        return "Initial Review"
      case "ai-analysis":
        return "AI Analysis"
      case "verification":
        return "Verification"
      case "moderation":
        return "Moderation"
      default:
        return "Pending"
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold tracking-tight">Pending Pothole Issues</h1>
        <p className="text-muted-foreground">Track pothole issues that are currently pending approval or assignment.</p>
      </div>

      {/* Filters */}
      <div className="flex flex-col gap-4 sm:flex-row">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Search pothole issues..."
            className="pl-8"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      {/* Issues */}
      <Card>
        <CardHeader>
          <CardTitle>Pending Pothole Issues</CardTitle>
          <CardDescription>All pothole issues awaiting verification or assignment</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="text-muted-foreground">Loading issues...</p>
          ) : filteredIssues.length > 0 ? (
            <div className="space-y-4">
              {filteredIssues.map((issue) => (
                <div key={issue.id} className="flex flex-col gap-2 rounded-lg border p-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="font-semibold">{issue.title}</h3>
                      <p className="text-sm text-muted-foreground">{issue.location}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge className={`${getPriorityColor(issue.priority)} text-white`}>
                        {issue.priority}
                      </Badge>
                      <Badge className="bg-yellow-500 hover:bg-yellow-600 text-white">pending</Badge>
                    </div>
                  </div>
                  <p className="text-sm">{issue.description}</p>
                  <div className="mt-2 space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="font-medium">Current Stage: {getStageLabel(issue.stage)}</span>
                      <span className="text-muted-foreground">{issue.stage_progress || 0}%</span>
                    </div>
                    <Progress value={issue.stage_progress || 0} className="h-2" />
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Clock className="h-4 w-4" />
                      <span>Estimated time remaining: {issue.estimated_time || "N/A"}</span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between pt-2 text-xs text-muted-foreground">
                    <div className="flex items-center gap-4">
                      <span>ID: {issue.id}</span>
                      <span>Reported: {new Date(issue.created_at).toLocaleDateString()}</span>
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
                No pending pothole issues found.{" "}
                {searchQuery || priorityFilter !== "all"
                  ? "Try adjusting your search."
                  : "All potholes have been addressed!"}
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Info card */}
      <Card>
        <CardHeader className="flex flex-row items-center gap-2">
          <AlertTriangle className="h-5 w-5 text-yellow-500" />
          <div>
            <CardTitle>What to Expect</CardTitle>
            <CardDescription>Understanding the pothole issue process</CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Pothole reports go through multiple stages: initial review → AI analysis → verification → moderation.
            Once complete, they are assigned to the road maintenance team.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
