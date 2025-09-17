"use client"

import { useEffect, useState } from "react"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Loader2 } from "lucide-react"

type Issue = {
  id: string
  title: string
  description: string
  location: string
  status: string
  created_at: string
  user_id: string
}

type Activity = {
  id: string
  action: string
  issue_id: string | null
  created_at: string
}

export default function AdminDashboardPage() {
  const supabase = createClientComponentClient()
  const [issues, setIssues] = useState<Issue[]>([])
  const [activities, setActivities] = useState<Activity[]>([])
  const [loading, setLoading] = useState(true)

  // 🔹 Fetch issues + activity logs
  const fetchData = async () => {
    setLoading(true)

    const { data: issueData } = await supabase
      .from("issues")
      .select("*")
      .order("created_at", { ascending: false })
    setIssues(issueData || [])

    const { data: activityData } = await supabase
      .from("recent_activity")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(10)
    setActivities(activityData || [])

    setLoading(false)
  }

  useEffect(() => {
    fetchData()
  }, [])

  // 🔹 Update issue status in DB and log activity
  const updateStatus = async (id: string, newStatus: string) => {
  const { error } = await supabase
    .from("issues")
    .update({ status: newStatus })
    .eq("id", id);

  if (error) {
    console.error("Error updating status:", error.message);
    alert("Failed to update issue: " + error.message);
    return;
  }

  await supabase.from("recent_activity").insert({
    action: `Issue marked as ${newStatus}`,
    issue_id: id,
  });

  fetchData();
};


  const allIssues = issues
  const pendingIssues = issues.filter((i) => i.status === "pending")
  const resolvedIssues = issues.filter((i) => i.status === "resolved")

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold tracking-tight">Admin Dashboard</h1>
        <p className="text-muted-foreground">Manage citizen issues and monitor department performance.</p>
      </div>

      <Tabs defaultValue="all-issues" className="space-y-4">
        <TabsList>
          <TabsTrigger value="all-issues">All Issues</TabsTrigger>
          <TabsTrigger value="pending">Pending</TabsTrigger>
          <TabsTrigger value="resolved">Resolved</TabsTrigger>
        </TabsList>

        <TabsContent value="all-issues">
          {loading ? <Loader2 className="h-6 w-6 animate-spin" /> : <IssueList issues={allIssues} updateStatus={updateStatus} />}
        </TabsContent>

        <TabsContent value="pending">
          {loading ? <Loader2 className="h-6 w-6 animate-spin" /> : <IssueList issues={pendingIssues} updateStatus={updateStatus} />}
        </TabsContent>

        <TabsContent value="resolved">
          {loading ? <Loader2 className="h-6 w-6 animate-spin" /> : <IssueList issues={resolvedIssues} updateStatus={updateStatus} />}
        </TabsContent>
      </Tabs>

      <div className="grid gap-6 md:grid-cols-2">
        {/* 🔹 Recent Activity (Dynamic) */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Administrative Activity</CardTitle>
            <CardDescription>Latest actions taken by government officials</CardDescription>
          </CardHeader>
          <CardContent>
            {activities.length === 0 ? (
              <p className="text-sm text-muted-foreground">No recent activity.</p>
            ) : (
              <ul className="space-y-2 text-sm">
                {activities.map((act) => (
                  <li key={act.id}>
                    {act.action}{" "}
                    <span className="text-xs text-muted-foreground">
                      ({new Date(act.created_at).toLocaleString()})
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        {/* 🔹 System Notifications */}
        <Card>
          <CardHeader>
            <CardTitle>System Notifications</CardTitle>
            <CardDescription>Important alerts and system updates</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <div className="w-2 h-2 bg-red-500 rounded-full mt-2"></div>
                <div>
                  <p className="text-sm font-medium">High Priority Issues Alert</p>
                  <p className="text-xs text-muted-foreground">3 urgent issues require immediate attention</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-2 h-2 bg-yellow-500 rounded-full mt-2"></div>
                <div>
                  <p className="text-sm font-medium">Department Performance Review</p>
                  <p className="text-xs text-muted-foreground">Monthly performance reports are ready</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-2 h-2 bg-green-500 rounded-full mt-2"></div>
                <div>
                  <p className="text-sm font-medium">System Update Complete</p>
                  <p className="text-xs text-muted-foreground">All systems are running normally</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

// 🔹 Sub-component for issue list
function IssueList({
  issues,
  updateStatus,
}: {
  issues: Issue[]
  updateStatus: (id: string, newStatus: string) => void
}) {
  if (issues.length === 0) {
    return <p className="text-sm text-muted-foreground">No issues found.</p>
  }

  return (
    <div className="space-y-4">
      {issues.map((issue) => (
        <Card key={issue.id}>
          <CardHeader>
            <CardTitle className="flex justify-between items-center">
              {issue.title}
              <span
                className={`text-xs px-2 py-1 rounded ${
                  issue.status === "pending"
                    ? "bg-yellow-200 text-yellow-800"
                    : "bg-green-200 text-green-800"
                }`}
              >
                {issue.status}
              </span>
            </CardTitle>
            <CardDescription>{issue.location}</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="mb-2 text-sm">{issue.description}</p>
            {issue.status === "pending" && (
              <Button size="sm" onClick={() => updateStatus(issue.id, "resolved")}>
                Mark as Resolved
              </Button>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
