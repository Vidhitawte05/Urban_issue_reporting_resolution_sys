"use client"

import { useEffect, useState } from "react"
import { Bell, Search, Settings, User } from "lucide-react"
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

export function AdminHeader() {
  const [adminName, setAdminName] = useState<string>("")
  const [adminEmail, setAdminEmail] = useState<string>("")
  const [avatarUrl, setAvatarUrl] = useState<string>("")
  const router = useRouter()

  useEffect(() => {
    fetchAdminProfile()
  }, [])

  async function fetchAdminProfile() {
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser()

    if (error || !user) {
      console.error("Auth error:", error)
      return
    }

    // fetch profile from profiles table
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("first_name, last_name, email, avatar_url")
      .eq("id", user.id)
      .single()

    if (profileError) {
      console.error("Profile fetch error:", profileError)
      return
    }

    setAdminName(`${profile.first_name ?? ""} ${profile.last_name ?? ""}`.trim() || "Admin User")
    setAdminEmail(profile.email || user.email || "")
    setAvatarUrl(profile.avatar_url || "/placeholder.svg?height=32&width=32")
  }

  async function handleLogout() {
    const { error } = await supabase.auth.signOut()
    if (error) {
      console.error("Logout error:", error)
      return
    }
    router.push("/login") // redirect to login page
  }

  return (
    <header className="border-b bg-white px-6 py-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <h2 className="text-xl font-semibold">Government Admin Portal</h2>
        </div>

        <div className="flex items-center gap-4">
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input type="search" placeholder="Search issues, citizens..." className="w-64 pl-8" />
          </div>

          <Button variant="ghost" size="icon">
            <Bell className="h-5 w-5" />
          </Button>

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
              <DropdownMenuItem>
                <User className="mr-2 h-4 w-4" />
                <span>Profile</span>
              </DropdownMenuItem>
              <DropdownMenuItem>
                <Settings className="mr-2 h-4 w-4" />
                <span>Settings</span>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleLogout}>Log out</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  )
}
