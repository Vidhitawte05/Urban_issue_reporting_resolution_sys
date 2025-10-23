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
  first_name: string
  last_name: string
  avatar_url?: string | null
  total_activity: number
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
    // === 1️⃣ Fetch all issues ===
    const { data: allIssuesData, error: allIssuesError } = await supabase
      .from("issues")
      .select("*")
      .order("created_at", { ascending: false })
    if (!allIssuesError && allIssuesData) setAllIssues(allIssuesData)

    // === 2️⃣ Fetch current user’s reports ===
    const { data: authData } = await supabase.auth.getUser()
    const user = authData?.user
    if (user) {
      const { data: myReportsData, error: myError } = await supabase
        .from("issues")
        .select("*")
        .eq("user_id", user.id)
      if (!myError && myReportsData) setMyReports(myReportsData)
    }

    // === 3️⃣ Fetch recent activity from multiple tables ===
    const activities: Activity[] = []

    // a. Issues (recently reported or resolved)
    const { data: issueActivity } = await supabase
      .from("issues")
      .select("title, created_at, status")
      .order("created_at", { ascending: false })
      .limit(5)

    issueActivity?.forEach((i) => {
      activities.push({
        id: i.title + i.created_at,
        description:
          i.status === "resolved"
            ? `An issue "${i.title}" was resolved.`
            : `A new issue "${i.title}" was reported.`,
        created_at: i.created_at,
      })
    })

    // b. Community posts
    const { data: postActivity } = await supabase
      .from("community_posts")
      .select("author, created_at, content")
      .order("created_at", { ascending: false })
      .limit(5)

    postActivity?.forEach((p) => {
      activities.push({
        id: p.author + p.created_at,
        description: `${p.author} shared a new post.`,
        created_at: p.created_at,
      })
    })

    // Sort & trim top 8 combined activities
    const sorted = activities
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      .slice(0, 8)
    setRecentActivity(sorted)

    // === 4️⃣ Leaderboard (using view or fallback aggregation) ===
    // Prefer leaderboard_view if exists
    const { data: leaderboardView } = await supabase
      .from("leaderboard_view")
      .select("*")
      .order("total_activity", { ascending: false })

    if (leaderboardView && leaderboardView.length > 0) {
      setLeaderboard(leaderboardView)
    } else {
      // Fallback: aggregate manually from issues and community_posts
      const { data: issueUsers } = await supabase
        .from("issues")
        .select("user_id, profiles!inner(first_name,last_name,avatar_url)")
      const { data: postUsers } = await supabase
        .from("community_posts")
        .select("author")

      const counts: Record<string, LeaderboardEntry> = {}

      issueUsers?.forEach((i: any) => {
        const uid = i.user_id
        if (!counts[uid]) {
          counts[uid] = {
            id: uid,
            first_name: i.profiles.first_name || "Unknown",
            last_name: i.profiles.last_name || "",
            avatar_url: i.profiles.avatar_url,
            total_activity: 0,
          }
        }
        counts[uid].total_activity++
      })

      postUsers?.forEach((p: any) => {
        const authorKey = p.author
        const entry = Object.values(counts).find(
          (x) => `${x.first_name} ${x.last_name}`.trim() === authorKey
        )
        if (entry) entry.total_activity++
      })

      setLeaderboard(Object.values(counts).sort((a, b) => b.total_activity - a.total_activity))
    }
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground">
          Welcome back! Here's an overview of your community’s reports and activities.
        </p>
      </div>

      {/* Analytics */}
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
        {/* Recent Activity */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
            <CardDescription>Latest updates from your community</CardDescription>
          </CardHeader>
          <CardContent>
            {recentActivity.length > 0 ? (
              recentActivity.map((a) => (
                <p key={a.id} className="text-sm">
                  {a.description} –{" "}
                  <span className="text-muted-foreground">
                    {new Date(a.created_at).toLocaleString()}
                  </span>
                </p>
              ))
            ) : (
              <p>No recent activity</p>
            )}
          </CardContent>
        </Card>

        {/* Leaderboard */}
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
                    alt={`${user.first_name} ${user.last_name}`}
                    className="h-8 w-8 rounded-full"
                  />
                  <span>
                    {user.first_name} {user.last_name}
                  </span>
                  <span className="ml-auto text-sm text-muted-foreground">
                    {user.total_activity} actions
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
