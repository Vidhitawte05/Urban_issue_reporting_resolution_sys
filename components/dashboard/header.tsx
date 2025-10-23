"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import { Bell, Menu, User } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { Sidebar } from "@/components/dashboard/sidebar"
import { supabase } from "@/lib/supabaseClient"

type Notification = {
  id: string
  title: string
  message: string
  type: string
  created_at: string
  is_read: boolean
}

export function Header() {
  const router = useRouter()
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [unreadCount, setUnreadCount] = useState(0)

  // ✅ Fetch notifications
  useEffect(() => {
    fetchNotifications()

    // ✅ Real-time listener for new notifications
    const channel = supabase
      .channel("notifications-updates")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "notifications" },
        (payload) => {
          console.log("🔔 Notification Change:", payload)
          fetchNotifications()
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [])

  async function fetchNotifications() {
    const { data, error } = await supabase
      .from("notifications")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(5)

    if (!error && data) {
      setNotifications(data)
      const unread = data.filter((n) => !n.is_read).length
      setUnreadCount(unread)
    }
  }

  // ✅ Mark all notifications as read
  async function markAllAsRead() {
    await supabase.from("notifications").update({ is_read: true }).eq("is_read", false)
    setUnreadCount(0)
  }

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push("/login")
  }

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center justify-between">
        {/* === Left Section === */}
        <div className="flex items-center gap-2 md:gap-4">
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="outline" size="icon" className="md:hidden">
                <Menu className="h-5 w-5" />
                <span className="sr-only">Toggle menu</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-[240px] sm:w-[300px]">
              <Sidebar />
            </SheetContent>
          </Sheet>
          <Link href="/dashboard" className="flex items-center gap-2 font-bold">
            <span className="text-primary">Urban</span>
            <span>Connect</span>
          </Link>
        </div>

        {/* === Right Section === */}
        <div className="flex items-center gap-2">
          {/* 🔔 Notifications Dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="relative">
                <Bell className="h-5 w-5" />
                {unreadCount > 0 && (
                  <span className="absolute right-1 top-1 flex h-2.5 w-2.5 rounded-full bg-red-500" />
                )}
                <span className="sr-only">Notifications</span>
              </Button>
            </DropdownMenuTrigger>

            <DropdownMenuContent align="end" className="w-80">
              <DropdownMenuLabel className="flex items-center justify-between">
                Notifications
                {unreadCount > 0 && (
                  <button
                    onClick={markAllAsRead}
                    className="text-xs text-primary hover:underline"
                  >
                    Mark all as read
                  </button>
                )}
              </DropdownMenuLabel>
              <DropdownMenuSeparator />

              {notifications.length === 0 ? (
                <DropdownMenuItem className="text-muted-foreground">
                  No notifications yet
                </DropdownMenuItem>
              ) : (
                notifications.map((n) => (
                  <DropdownMenuItem
                    key={n.id}
                    className={`flex flex-col items-start space-y-1 ${
                      !n.is_read ? "bg-muted/40" : ""
                    }`}
                  >
                    <span className="font-medium">{n.title}</span>
                    <span className="text-xs text-muted-foreground">{n.message}</span>
                    <span className="text-[10px] text-gray-400">
                      {new Date(n.created_at).toLocaleString()}
                    </span>
                  </DropdownMenuItem>
                ))
              )}
            </DropdownMenuContent>
          </DropdownMenu>

          {/* 👤 User Dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon">
                <User className="h-5 w-5" />
                <span className="sr-only">User menu</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>My Account</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleLogout}>Logout</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  )
}
