"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { supabase } from "@/lib/supabaseClient"
import { IssueStats } from "@/components/dashboard/issue-stats"

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
  description: string
  created_at: string
}

type LeaderboardEntry = {
  id: string
  full_name: string
  avatar_url?: string | null
  issue_count: number
}

export default function DashboardPage() {
  const [myReports, setMyReports] = useState<Issue[]>([])
  const [allIssues, setAllIssues] = useState<Issue[]>([])
  const [recentActivity, setRecentActivity] = useState<Activity[]>([])
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([])

  useEffect(() => {
    fetchDashboardData()
  }, [])

  async function fetchDashboardData() {
    // Fetch all issues
    const { data: allIssuesData } = await supabase
      .from("issues")
      .select("*")
      .order("created_at", { ascending: false })
    if (allIssuesData) setAllIssues(allIssuesData)

    // Fetch current user’s reports
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (user) {
      const { data: myReportsData } = await supabase
        .from("issues")
        .select("*")
        .eq("user_id", user.id)
      if (myReportsData) setMyReports(myReportsData)
    }

    // Fetch activities (optional table)
    const { data: activityData } = await supabase
      .from("activities")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(5)
    if (activityData) setRecentActivity(activityData)

    // Build leaderboard (issues grouped by user)
    const { data: leaderboardData } = await supabase
      .from("issues")
      .select("user_id, profiles!inner(full_name, avatar_url)")
    if (leaderboardData) {
      const counts: Record<string, LeaderboardEntry> = {}
      for (const issue of leaderboardData as any[]) {
        const uid = issue.user_id
        if (!counts[uid]) {
          counts[uid] = {
            id: uid,
            full_name: issue.profiles.full_name ?? "Unknown",
            avatar_url: issue.profiles.avatar_url,
            issue_count: 0,
          }
        }
        counts[uid].issue_count++
      }
      setLeaderboard(Object.values(counts).sort((a, b) => b.issue_count - a.issue_count))
    }
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground">Welcome back! Here's an overview of your community's issues.</p>
      </div>

      {/* Analytics (keep as it is) */}
      <IssueStats />

      {/* Tabs: My Reports + All Issues */}
      <Tabs defaultValue="my-reports" className="space-y-4">
        <TabsList>
          <TabsTrigger value="my-reports">My Reports</TabsTrigger>
          <TabsTrigger value="all-sectors">All Issues</TabsTrigger>
        </TabsList>

        {/* My Reports */}
        <TabsContent value="my-reports" className="space-y-4">
          {myReports.length > 0 ? (
            myReports.map((issue) => (
              <Card key={issue.id}>
                <CardHeader>
                  <CardTitle>{issue.title}</CardTitle>
                  <CardDescription>{issue.location}</CardDescription>
                </CardHeader>
                <CardContent>
                  <p>{issue.description}</p>
                  <p className="text-sm text-muted-foreground">Status: {issue.status}</p>
                </CardContent>
              </Card>
            ))
          ) : (
            <p>You haven’t reported any issues yet.</p>
          )}
        </TabsContent>

        {/* All Issues */}
        <TabsContent value="all-sectors" className="space-y-4">
          {allIssues.length > 0 ? (
            allIssues.map((issue) => (
              <Card key={issue.id}>
                <CardHeader>
                  <CardTitle>{issue.title}</CardTitle>
                  <CardDescription>{issue.location}</CardDescription>
                </CardHeader>
                <CardContent>
                  <p>{issue.description}</p>
                </CardContent>
              </Card>
            ))
          ) : (
            <p>No issues reported yet.</p>
          )}
        </TabsContent>
      </Tabs>

      {/* Recent Activity + Leaderboard */}
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
            <CardDescription>Latest updates from your community</CardDescription>
          </CardHeader>
          <CardContent>
            {recentActivity.length > 0 ? (
              recentActivity.map((a) => (
                <p key={a.id} className="text-sm">
                  {a.description} – {new Date(a.created_at).toLocaleString()}
                </p>
              ))
            ) : (
              <p>No recent activity</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Community Leaderboard</CardTitle>
            <CardDescription>Top contributors</CardDescription>
          </CardHeader>
          <CardContent>
            {leaderboard.length > 0 ? (
              leaderboard.map((user) => (
                <div key={user.id} className="flex items-center gap-2 py-1">
                  <img
                    src={user.avatar_url || "/placeholder-user.jpg"}
                    alt={user.full_name}
                    className="h-8 w-8 rounded-full"
                  />
                  <span>{user.full_name}</span>
                  <span className="ml-auto text-sm text-muted-foreground">
                    {user.issue_count} issues
                  </span>
                </div>
              ))
            ) : (
              <p>No leaderboard data yet.</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
