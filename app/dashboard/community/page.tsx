"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { toast } from "@/components/ui/use-toast"
import { supabase } from "@/lib/supabaseClient"

type Member = {
  id: string
  name: string
  avatar_url?: string | null
  joined_at?: string
  role?: string
  issues_count: number
}

type Discussion = {
  id: string
  title: string
  content: string
  created_at: string
  likes?: number
  user_id?: string
  profiles?: { name?: string; avatar_url?: string | null }
}

type EventType = {
  id: string
  title: string
  description?: string
  date?: string
  location?: string
  organizer_id?: string
  profiles?: { name?: string; avatar_url?: string | null }
}

export default function CommunityPage() {
  const [members, setMembers] = useState<Member[]>([])
  const [discussions, setDiscussions] = useState<Discussion[]>([])
  const [events, setEvents] = useState<EventType[]>([])
  const [loading, setLoading] = useState(true)

  // discussion composer state
  const [discussionTitle, setDiscussionTitle] = useState("")
  const [discussionContent, setDiscussionContent] = useState("")
  const [postingDiscussion, setPostingDiscussion] = useState(false)

  useEffect(() => {
    fetchData()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  async function fetchData() {
    setLoading(true)
    try {
      // 1) Fetch profiles (basic)
      const profilesRes = await supabase
  .from("profiles")
  .select("id, first_name, last_name, avatar_url, role, joined_at")


      if (profilesRes.error) {
        console.error("profiles error:", profilesRes.error)
        toast({ title: "Error fetching members", description: profilesRes.error.message, variant: "destructive" })
        setMembers([])
      }
      const profiles = profilesRes.data || []

      // 2) Fetch all issues (only need user_id to count per user)
      const issuesRes = await supabase.from("issues").select("user_id")
      if (issuesRes.error) {
        console.error("issues error:", issuesRes.error)
        toast({ title: "Error fetching issues", description: issuesRes.error.message, variant: "destructive" })
      }
      const issues = issuesRes.data || []

      // compute issues count per user id
      const issueCounts: Record<string, number> = {}
      for (const i of issues) {
        const uid = (i as any).user_id
        if (!uid) continue
        issueCounts[uid] = (issueCounts[uid] || 0) + 1
      }

      // build members array preserving layout
      const membersList: Member[] = profiles.map((p: any) => ({
        id: p.id,
        name: p.first_name ?? "Unknown", 

        avatar_url: p.avatar_url ?? null,
        joined_at: p.joined_at ?? new Date().toISOString(),
        role: p.role ?? "Citizen",
        issues_count: issueCounts[p.id] ?? 0,
      }))
      setMembers(membersList)

      // 3) Fetch discussions (basic fields + user_id)
      const discussionsRes = await supabase
        .from("discussions")
        .select("id, title, content, created_at, likes, user_id")
        .order("created_at", { ascending: false })

      if (discussionsRes.error) {
        console.error("discussions error:", discussionsRes.error)
        toast({
          title: "Error fetching discussions",
          description: discussionsRes.error.message,
          variant: "destructive",
        })
        setDiscussions([])
      } else {
        const discussionsData: Discussion[] = discussionsRes.data || []

        // fetch profiles for the user_ids referenced in discussions
        const userIds = Array.from(new Set(discussionsData.map((d) => d.user_id).filter(Boolean)))
        let profileMap: Record<string, { name?: string; avatar_url?: string | null }> = {}
        if (userIds.length > 0) {
          const usersRes = await supabase.from("profiles").select("id, name, avatar_url").in("id", userIds)
          if (!usersRes.error && usersRes.data) {
            for (const u of usersRes.data) {
              profileMap[(u as any).id] = { name: (u as any).name, avatar_url: (u as any).avatar_url }
            }
          }
        }

        // attach profile info (if any)
        const discussionsWithProfiles = discussionsData.map((d) => ({
          ...d,
          profiles: profileMap[d.user_id ?? ""] ?? undefined,
        }))
        setDiscussions(discussionsWithProfiles)
      }

      // 4) Fetch events and map organizers
      const eventsRes = await supabase
        .from("events")
        .select("id, title, description, date, location, organizer_id")
        .order("date", { ascending: true })

      if (eventsRes.error) {
        console.error("events error:", eventsRes.error)
        toast({ title: "Error fetching events", description: eventsRes.error.message, variant: "destructive" })
        setEvents([])
      } else {
        const eventsData: EventType[] = eventsRes.data || []

        const organizerIds = Array.from(new Set(eventsData.map((e) => e.organizer_id).filter(Boolean)))
        let organizersMap: Record<string, { name?: string; avatar_url?: string | null }> = {}
        if (organizerIds.length > 0) {
          const orgRes = await supabase.from("profiles").select("id, name, avatar_url").in("id", organizerIds)
          if (!orgRes.error && orgRes.data) {
            for (const o of orgRes.data) {
              organizersMap[(o as any).id] = { name: (o as any).name, avatar_url: (o as any).avatar_url }
            }
          }
        }

        const eventsWithProfiles = eventsData.map((e) => ({
          ...e,
          profiles: e.organizer_id ? organizersMap[e.organizer_id] : undefined,
        }))
        setEvents(eventsWithProfiles)
      }
    } catch (err: any) {
      console.error("fetchData unexpected error:", err)
      toast({ title: "Error", description: "Failed to load community data.", variant: "destructive" })
    } finally {
      setLoading(false)
    }
  }

  const getBadge = (count: number) => {
    if (count > 10) return <Badge className="bg-yellow-500 text-white">Gold</Badge>
    if (count >= 5) return <Badge className="bg-gray-400 text-white">Silver</Badge>
    return <Badge className="bg-orange-500 text-white">Bronze</Badge>
  }

  // basic profanity filter
  const profanityRegex = /\b(fuck|shit|bitch|asshole|damn)\b/i

  const handleSubmitDiscussion = async () => {
    const title = discussionTitle.trim()
    const content = discussionContent.trim()
    if (!title || !content) {
      toast({ title: "Missing fields", description: "Please provide both title and content.", variant: "destructive" })
      return
    }
    if (profanityRegex.test(title) || profanityRegex.test(content)) {
      toast({ title: "Inappropriate content", description: "Please avoid abusive language.", variant: "destructive" })
      return
    }

    setPostingDiscussion(true)
    try {
      const {
        data: { user },
        error: userErr,
      } = await supabase.auth.getUser()

      if (userErr) throw userErr
      if (!user) {
        toast({ title: "Not signed in", description: "Please sign in to post.", variant: "destructive" })
        setPostingDiscussion(false)
        return
      }

      const insertRes = await supabase.from("discussions").insert([
        {
          user_id: user.id,
          title,
          content,
        },
      ])

      if (insertRes.error) {
        console.error("insert discussion error:", insertRes.error)
        toast({ title: "Error", description: insertRes.error.message, variant: "destructive" })
      } else {
        toast({ title: "Discussion posted", description: "Your discussion has been posted." })
        setDiscussionTitle("")
        setDiscussionContent("")
        await fetchData() // refresh
      }
    } catch (err: any) {
      console.error("post discussion unexpected:", err)
      toast({ title: "Error", description: err?.message || "Failed to post discussion.", variant: "destructive" })
    } finally {
      setPostingDiscussion(false)
    }
  }

  if (loading) {
    return <p className="text-center mt-10">Loading community data...</p>
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Members Leaderboard (layout preserved) */}
      <Card>
        <CardHeader>
          <CardTitle>Community Members</CardTitle>
          <CardDescription>Members of your sector (live)</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {members.length > 0 ? (
              members.map((member) => (
                <div key={member.id} className="flex items-center gap-4 rounded-lg border p-4">
                  <Avatar className="h-10 w-10">
                    <AvatarImage src={member.avatar_url || "/placeholder-user.jpg"} alt={member.name} />
                    <AvatarFallback>{member.name?.charAt(0) ?? "U"}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1 space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold">{member.name}</span>
                      <Badge variant="outline">{member.role}</Badge>
                    </div>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <span>{member.issues_count} issues reported</span>
                      <span>Joined {new Date(member.joined_at ?? "").toLocaleDateString()}</span>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    <div className="flex items-center gap-1">
                      <span className="text-sm font-medium">{member.issues_count} pts</span>
                    </div>
                    {getBadge(member.issues_count)}
                  </div>
                </div>
              ))
            ) : (
              <div className="flex h-32 items-center justify-center rounded-lg border border-dashed">
                <p className="text-center text-muted-foreground">No members found.</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Discussions (layout preserved, with composer) */}
      <Card>
        <CardHeader>
          <CardTitle>Community Discussions</CardTitle>
          <CardDescription>Share questions and experiences with your community</CardDescription>
        </CardHeader>

        <CardContent className="space-y-4">
          <div className="space-y-2 rounded-lg border p-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Title</label>
              <Input placeholder="What would you like to discuss?" value={discussionTitle} onChange={(e) => setDiscussionTitle(e.target.value)} />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Content</label>
              <Textarea placeholder="Share your thoughts..." className="min-h-[120px]" value={discussionContent} onChange={(e) => setDiscussionContent(e.target.value)} />
            </div>
            <div className="flex justify-end">
              <Button onClick={handleSubmitDiscussion} disabled={postingDiscussion}>
                {postingDiscussion ? "Posting..." : "Post Discussion"}
              </Button>
            </div>
          </div>

          <div className="space-y-4">
            {discussions.length > 0 ? (
              discussions.map((d) => (
                <div key={d.id} className="flex flex-col gap-3 rounded-lg border p-4">
                  <div className="flex items-start gap-2">
                    <Avatar className="h-6 w-6">
                      <AvatarImage src={d.profiles?.avatar_url || "/placeholder-user.jpg"} />
                      <AvatarFallback>{d.profiles?.name?.charAt(0) ?? "U"}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{d.profiles?.name ?? "Anonymous"}</span>
                        <span className="text-xs text-muted-foreground">{new Date(d.created_at).toLocaleDateString()}</span>
                      </div>
                      <h4 className="font-semibold">{d.title}</h4>
                      <p className="text-sm text-muted-foreground">{d.content}</p>
                    </div>
                    <div className="text-xs text-muted-foreground">👍 {d.likes ?? 0}</div>
                  </div>
                </div>
              ))
            ) : (
              <div className="flex h-32 items-center justify-center rounded-lg border border-dashed">
                <p className="text-center text-muted-foreground">No discussions yet. Start the conversation!</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Events (layout preserved) */}
      <Card>
        <CardHeader>
          <CardTitle>Upcoming Events</CardTitle>
          <CardDescription>Community events in your sector</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {events.length > 0 ? (
            events.map((event) => (
              <div key={event.id} className="flex flex-col gap-3 rounded-lg border p-4">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-semibold">{event.title}</h3>
                    <p className="text-sm text-muted-foreground">{event.description}</p>
                  </div>
                  <Badge className="bg-green-50 text-green-700">Upcoming</Badge>
                </div>
                <div className="grid gap-2 text-sm">
                  <div className="flex items-center gap-2">
                    <span>📍 {event.location}</span>
                    <span>🗓 {event.date ? new Date(event.date).toLocaleDateString() : "N/A"}</span>
                  </div>
                  <div className="text-xs text-muted-foreground">Organized by {event.profiles?.name ?? "N/A"}</div>
                </div>
                <div className="flex items-center gap-2 pt-2">
                  <Button onClick={() => toast({ title: "Joined", description: "You joined the event (demo)." })}>Join Event</Button>
                </div>
              </div>
            ))
          ) : (
            <div className="flex h-32 items-center justify-center rounded-lg border border-dashed">
              <p className="text-center text-muted-foreground">No upcoming events found.</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
