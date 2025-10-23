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
}

export default function PendingIssuesPage() {
  const [searchQuery, setSearchQuery] = useState("")
  const [issues, setIssues] = useState<Issue[]>([])
  const [loading, setLoading] = useState(true)

  // ✅ Fetch pending pothole issues
  const fetchIssues = async () => {
    setLoading(true)
    const { data, error } = await supabase
      .from("issues")
      .select("*")
      .eq("status", "pending")
      .eq("category", "potholes") // ✅ your defined category
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

    // ✅ Real-time updates
    const channel = supabase
      .channel("issues-updates")
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

  // ✅ Stage progress calculation
  const getStageProgress = (stage?: string) => {
    switch (stage) {
      case "initial":
        return 25
      case "ai-analysis":
        return 50
      case "verification":
        return 75
      case "moderation":
        return 90
      case "resolved":
        return 100
      default:
        return 10
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
      case "resolved":
        return "Resolved"
      default:
        return "Pending Review"
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

  // ✅ Filter logic
  const filteredIssues = issues.filter((issue) =>
    issue.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    issue.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
    issue.location.toLowerCase().includes(searchQuery.toLowerCase())
  )

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold tracking-tight">Pending Pothole Issues</h1>
        <p className="text-muted-foreground">
          Track pothole issues that are currently under review or verification.
        </p>
      </div>

      {/* 🔍 Search bar */}
      <div className="relative flex-1 max-w-md">
        <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
        <Input
          type="search"
          placeholder="Search issues..."
          className="pl-8"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      {/* 🧾 Issues list */}
      <Card>
        <CardHeader>
          <CardTitle>Pending Pothole Issues</CardTitle>
          <CardDescription>All pothole issues awaiting review or assignment.</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="text-muted-foreground">Loading issues...</p>
          ) : filteredIssues.length > 0 ? (
            <div className="space-y-4">
              {filteredIssues.map((issue) => {
                const progress = getStageProgress(issue.stage)
                const stageLabel = getStageLabel(issue.stage)
                return (
                  <div key={issue.id} className="rounded-lg border p-4 space-y-2">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-semibold">{issue.title}</h3>
                        <p className="text-sm text-muted-foreground">{issue.location}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge className={`${getPriorityColor(issue.priority)} text-white`}>
                          {issue.priority}
                        </Badge>
                        <Badge className="bg-yellow-500 text-white">{issue.status}</Badge>
                      </div>
                    </div>

                    <p className="text-sm text-muted-foreground">{issue.description}</p>

                    {/* 🚦 Progress bar */}
                    <div className="mt-2 space-y-1">
                      <div className="flex justify-between text-xs">
                        <span>Stage: {stageLabel}</span>
                        <span>{progress}%</span>
                      </div>
                      <Progress value={progress} className="h-2" />
                    </div>

                    <div className="flex justify-between items-center text-xs text-muted-foreground pt-2">
                      <div className="flex gap-3">
                        <span>ID: {issue.id}</span>
                        <span>Reported: {new Date(issue.created_at).toLocaleDateString()}</span>
                      </div>
                      <Button variant="ghost" size="sm" asChild>
                        <Link href={`/dashboard/issues/${issue.id}`}>
                          <ExternalLink className="h-4 w-4 mr-2" /> Details
                        </Link>
                      </Button>
                    </div>
                  </div>
                )
              })}
            </div>
          ) : (
            <div className="flex h-32 items-center justify-center border border-dashed rounded-lg">
              <p className="text-muted-foreground">
                No pending pothole issues found. All caught up! 🎉
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* ℹ️ Info card */}
      <Card>
        <CardHeader className="flex flex-row items-center gap-2">
          <AlertTriangle className="h-5 w-5 text-yellow-500" />
          <div>
            <CardTitle>What to Expect</CardTitle>
            <CardDescription>How pothole reports are processed</CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Pothole reports go through multiple stages: Initial Review → AI Analysis → Verification → Moderation.
            Once complete, they are assigned to the maintenance team for fixing.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
