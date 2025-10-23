"use client"

import { useEffect, useState } from "react"
import { Bell, Search } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { supabase } from "@/lib/supabaseClient"
import { useRouter } from "next/navigation"
import { Badge } from "@/components/ui/badge"

type Notification = {
  id: string
  title: string
  message: string
  is_read: boolean
  created_at: string
}

type SearchResult = {
  id: string
  title?: string
  first_name?: string
  last_name?: string
  location?: string
  email?: string
  type: "issue" | "citizen"
}

export function AdminHeader() {
  const [adminName, setAdminName] = useState("")
  const [adminEmail, setAdminEmail] = useState("")
  const [avatarUrl, setAvatarUrl] = useState("")
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [searchQuery, setSearchQuery] = useState("")
  const [searchResults, setSearchResults] = useState<SearchResult[]>([])
  const router = useRouter()

  // 🔹 Fetch admin + notifications on load
  useEffect(() => {
    fetchAdminProfile()
    fetchNotifications()

    const channel = supabase
      .channel("notifications-realtime")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "notifications" },
        (payload) => {
          const newNote = payload.new as Notification
          setNotifications((prev) => [newNote, ...prev])
          setUnreadCount((prev) => prev + 1)
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [])

  // ✅ Fetch Admin Profile
  async function fetchAdminProfile() {
    const { data: userData } = await supabase.auth.getUser()
    if (!userData.user) return

    const { data: profile } = await supabase
      .from("profiles")
      .select("first_name, last_name, email, avatar_url")
      .eq("id", userData.user.id)
      .single()

    setAdminName(`${profile?.first_name ?? ""} ${profile?.last_name ?? ""}`.trim() || "Admin User")
    setAdminEmail(profile?.email || userData.user.email || "")
    setAvatarUrl(profile?.avatar_url || "/placeholder.svg")
  }

  // ✅ Fetch Notifications
  async function fetchNotifications() {
    const { data, error } = await supabase
      .from("notifications")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(10)

    if (!error && data) {
      setNotifications(data)
      setUnreadCount(data.filter((n) => !n.is_read).length)
    }
  }

  // ✅ Mark as Read
  async function markAsRead(id: string) {
    await supabase.from("notifications").update({ is_read: true }).eq("id", id)
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, is_read: true } : n)))
    setUnreadCount((prev) => Math.max(prev - 1, 0))
  }

  // ✅ Search (issues + citizens)
  async function handleSearch(value: string) {
    setSearchQuery(value)
    if (!value.trim()) {
      setSearchResults([])
      return
    }

    const [issuesRes, citizensRes] = await Promise.all([
      supabase.from("issues").select("id, title, location").ilike("title", `%${value}%`),
      supabase
        .from("profiles")
        .select("id, first_name, last_name, email")
        .or(`first_name.ilike.%${value}%,last_name.ilike.%${value}%`)
    ])

    const issues =
      issuesRes.data?.map((i) => ({
        id: i.id,
        title: i.title,
        location: i.location,
        type: "issue" as const,
      })) || []

    const citizens =
      citizensRes.data?.map((c) => ({
        id: c.id,
        first_name: c.first_name,
        last_name: c.last_name,
        email: c.email,
        type: "citizen" as const,
      })) || []

    setSearchResults([...issues, ...citizens])
  }

  // ✅ Logout
  async function handleLogout() {
    await supabase.auth.signOut()
    router.push("/login")
  }

  return (
    <header className="border-b bg-white px-6 py-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">Government Admin Portal</h2>

        <div className="flex items-center gap-4 relative">
          {/* 🔍 Search Bar */}
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-400" />
            <Input
              type="search"
              value={searchQuery}
              onChange={(e) => handleSearch(e.target.value)}
              placeholder="Search issues or citizens..."
              className="w-72 pl-8"
            />
            {searchResults.length > 0 && (
              <div className="absolute top-10 left-0 w-full bg-white shadow-lg border rounded-md z-50 max-h-64 overflow-y-auto">
                {searchResults.map((res) => (
                  <div
                    key={res.id}
                    className="p-2 hover:bg-gray-100 cursor-pointer text-sm"
                    onClick={() => {
                      if (res.type === "issue") router.push(`/admin/dashboard/issues/${res.id}`)
                      else router.push(`/admin/dashboard/citizens/${res.id}`)
                      setSearchResults([])
                    }}
                  >
                    {res.type === "issue" ? (
                      <p>
                        🧾 <b>{res.title}</b> – {res.location}
                      </p>
                    ) : (
                      <p>
                        👤 {res.first_name} {res.last_name} – {res.email}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* 🔔 Notifications */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="relative">
                <Bell className="h-5 w-5" />
                {unreadCount > 0 && (
                  <Badge className="absolute -top-1 -right-1 h-4 w-4 flex items-center justify-center rounded-full bg-red-600 text-white text-xs">
                    {unreadCount}
                  </Badge>
                )}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-80" align="end">
              <DropdownMenuLabel>Notifications</DropdownMenuLabel>
              <DropdownMenuSeparator />
              {notifications.length === 0 ? (
                <p className="p-3 text-sm text-muted-foreground text-center">No new notifications</p>
              ) : (
                notifications.map((n) => (
                  <DropdownMenuItem
                    key={n.id}
                    onClick={() => markAsRead(n.id)}
                    className={`flex flex-col items-start gap-1 cursor-pointer ${
                      n.is_read ? "opacity-70" : "font-semibold"
                    }`}
                  >
                    <span>{n.title}</span>
                    <span className="text-xs text-muted-foreground">{n.message}</span>
                    <span className="text-[10px] text-gray-400">
                      {new Date(n.created_at).toLocaleString()}
                    </span>
                  </DropdownMenuItem>
                ))
              )}
            </DropdownMenuContent>
          </DropdownMenu>

          {/* 👤 Profile */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                <Avatar className="h-8 w-8">
                  <AvatarImage src={avatarUrl} alt={adminName} />
                  <AvatarFallback>{adminName ? adminName[0] : "A"}</AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56" align="end" forceMount>
              <DropdownMenuLabel className="font-normal">
                <div className="flex flex-col space-y-1">
                  <p className="text-sm font-medium leading-none">{adminName}</p>
                  <p className="text-xs leading-none text-muted-foreground">{adminEmail}</p>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleLogout}>Log out</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  )
}
