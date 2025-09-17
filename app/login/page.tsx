"use client"

import type React from "react"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { User, Shield } from "lucide-react"
import { useRouter } from "next/navigation"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"

export default function LoginPage() {
  const supabase = createClientComponentClient()
  const router = useRouter()

  const [citizenForm, setCitizenForm] = useState({ email: "", password: "" })
  const [adminForm, setAdminForm] = useState({ govId: "", password: "" })
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // 🔹 Citizen login
const handleCitizenLogin = async (e: React.FormEvent) => {
  e.preventDefault()
  setIsLoading(true)
  setError(null)

  try {
    const { data, error: signInError } = await supabase.auth.signInWithPassword({
      email: citizenForm.email,
      password: citizenForm.password,
    })

    if (signInError) {
      setError(signInError.message)
    } else if (data.user) {
      const { data: profile } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", data.user.id)
        .single()

      if (profile?.role === "citizen") {
        router.push("/dashboard")
      } else {
        setError("You are not authorized as a citizen.")
      }
    }
  } catch (err) {
    setError("Something went wrong. Please try again.")
  } finally {
    setIsLoading(false)
  }
}
  // 🔹 Admin login
const handleAdminLogin = async (e: React.FormEvent) => {
  e.preventDefault()
  setIsLoading(true)
  setError(null)

  try {
    const { data, error: signInError } = await supabase.auth.signInWithPassword({
      email: adminForm.govId,
      password: adminForm.password,
    })

    if (signInError) {
      setError(signInError.message)
    } else if (data.user) {
      const { data: profile } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", data.user.id)
        .single()

      if (profile?.role === "admin") {
        router.push("/admin/dashboard")
      } else {
        setError("You are not authorized as an admin.")
      }
    }
  } catch (err) {
    setError("Something went wrong. Please try again.")
  } finally {
    setIsLoading(false)
  }
}
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Citizen Services Portal</h1>
          <p className="text-gray-600">Access your account or administrative panel</p>
        </div>

        <Tabs defaultValue="citizen" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="citizen" className="flex items-center gap-2">
              <User className="w-4 h-4" />
              Citizen Login
            </TabsTrigger>
            <TabsTrigger value="admin" className="flex items-center gap-2">
              <Shield className="w-4 h-4" />
              Admin Login
            </TabsTrigger>
          </TabsList>

          {/* Citizen Login */}
          <TabsContent value="citizen">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="w-5 h-5" />
                  Citizen Access
                </CardTitle>
                <CardDescription>Login to submit and track your issues</CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleCitizenLogin} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="citizen-email">Email Address</Label>
                    <Input
                      id="citizen-email"
                      type="email"
                      placeholder="your.email@example.com"
                      value={citizenForm.email}
                      onChange={(e) => setCitizenForm({ ...citizenForm, email: e.target.value })}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="citizen-password">Password</Label>
                    <Input
                      id="citizen-password"
                      type="password"
                      value={citizenForm.password}
                      onChange={(e) => setCitizenForm({ ...citizenForm, password: e.target.value })}
                      required
                    />
                  </div>
                  {error && <p className="text-red-500 text-sm">{error}</p>}
                  <Button type="submit" className="w-full" disabled={isLoading}>
                    {isLoading ? "Signing In..." : "Sign In"}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Admin Login */}
          <TabsContent value="admin">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="w-5 h-5" />
                  Government Official Access
                </CardTitle>
                <CardDescription>Secure login for authorized personnel only</CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleAdminLogin} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="gov-id">Government ID (use as email)</Label>
                    <Input
                      id="gov-id"
                      placeholder="gov-official@example.com"
                      value={adminForm.govId}
                      onChange={(e) => setAdminForm({ ...adminForm, govId: e.target.value })}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="admin-password">Password</Label>
                    <Input
                      id="admin-password"
                      type="password"
                      value={adminForm.password}
                      onChange={(e) => setAdminForm({ ...adminForm, password: e.target.value })}
                      required
                    />
                  </div>
                  {error && <p className="text-red-500 text-sm">{error}</p>}
                  <Button type="submit" className="w-full" disabled={isLoading}>
                    {isLoading ? "Verifying..." : "Secure Login"}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
