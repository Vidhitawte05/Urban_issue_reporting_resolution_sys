"use client"

import { useEffect, useState } from "react"
import { supabase } from "@/lib/supabaseClient"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Separator } from "@/components/ui/separator"
import { toast } from "@/components/ui/use-toast"

export default function SettingsPage() {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  // State
  const [systemName, setSystemName] = useState("")
  const [adminEmail, setAdminEmail] = useState("")
  const [timezone, setTimezone] = useState("")
  const [maintenanceMode, setMaintenanceMode] = useState(false)
  const [emailNotifications, setEmailNotifications] = useState(false)
  const [smsNotifications, setSmsNotifications] = useState(false)
  const [pushNotifications, setPushNotifications] = useState(false)

  // keep admin row reference
  const [adminId, setAdminId] = useState<string | null>(null)

  useEffect(() => {
    fetchAdminSettings()
  }, [])

  async function fetchAdminSettings() {
    setLoading(true)

    // fetch first admin profile
    const { data, error } = await supabase
      .from("profiles")
      .select("id, email, system_name, timezone, maintenance_mode, email_notifications, sms_notifications, push_notifications")
      .eq("role", "admin")
      .limit(1)
      .single()

    if (error) {
      console.error("Error fetching admin settings:", error)
      toast({ title: "Error", description: error.message, variant: "destructive" })
    } else if (data) {
      setAdminId(data.id)
      setSystemName(data.system_name || "")
      setAdminEmail(data.email || "")
      setTimezone(data.timezone || "")
      setMaintenanceMode(data.maintenance_mode || false)
      setEmailNotifications(data.email_notifications || false)
      setSmsNotifications(data.sms_notifications || false)
      setPushNotifications(data.push_notifications || false)
    }

    setLoading(false)
  }

  async function saveSettings(type: "general" | "notifications") {
    if (!adminId) {
      toast({ title: "Error", description: "Admin profile not found", variant: "destructive" })
      return
    }

    setSaving(true)

    let updateData: any = {}
    if (type === "general") {
      updateData = {
        system_name: systemName,
        email: adminEmail,
        timezone,
        maintenance_mode: maintenanceMode,
      }
    } else if (type === "notifications") {
      updateData = {
        email_notifications: emailNotifications,
        sms_notifications: smsNotifications,
        push_notifications: pushNotifications,
      }
    }

    const { error } = await supabase.from("profiles").update(updateData).eq("id", adminId)

    if (error) {
      console.error("Update error:", error)
      toast({ title: "Error", description: error.message, variant: "destructive" })
    } else {
      toast({ title: "Saved", description: "Settings updated successfully." })
    }

    setSaving(false)
  }

  if (loading) return <p className="mt-10 text-center">Loading settings...</p>

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
        <p className="text-muted-foreground">Manage system settings and configurations.</p>
      </div>

      <Tabs defaultValue="general" className="space-y-4">
        <TabsList>
          <TabsTrigger value="general">General</TabsTrigger>
          <TabsTrigger value="notifications">Notifications</TabsTrigger>
          <TabsTrigger value="departments">Departments</TabsTrigger>
          <TabsTrigger value="users">Users</TabsTrigger>
          <TabsTrigger value="security">Security</TabsTrigger>
        </TabsList>

        {/* General Tab */}
        <TabsContent value="general" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>General Settings</CardTitle>
              <CardDescription>Configure general system settings</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="system-name">System Name</Label>
                <Input id="system-name" value={systemName} onChange={(e) => setSystemName(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="admin-email">Admin Email</Label>
                <Input id="admin-email" type="email" value={adminEmail} onChange={(e) => setAdminEmail(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="timezone">Timezone</Label>
                <Input id="timezone" value={timezone} onChange={(e) => setTimezone(e.target.value)} />
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Maintenance Mode</Label>
                  <p className="text-sm text-muted-foreground">Enable maintenance mode for system updates</p>
                </div>
                <Switch checked={maintenanceMode} onCheckedChange={setMaintenanceMode} />
              </div>
              <Button onClick={() => saveSettings("general")} disabled={saving}>
                {saving ? "Saving..." : "Save Changes"}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Notifications Tab */}
        <TabsContent value="notifications" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Notification Settings</CardTitle>
              <CardDescription>Configure notification preferences</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Email Notifications</Label>
                  <p className="text-sm text-muted-foreground">Receive email notifications for new issues</p>
                </div>
                <Switch checked={emailNotifications} onCheckedChange={setEmailNotifications} />
              </div>
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>SMS Notifications</Label>
                  <p className="text-sm text-muted-foreground">Receive SMS for urgent issues</p>
                </div>
                <Switch checked={smsNotifications} onCheckedChange={setSmsNotifications} />
              </div>
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Push Notifications</Label>
                  <p className="text-sm text-muted-foreground">Browser push notifications</p>
                </div>
                <Switch checked={pushNotifications} onCheckedChange={setPushNotifications} />
              </div>
              <Button onClick={() => saveSettings("notifications")} disabled={saving}>
                {saving ? "Saving..." : "Save Preferences"}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Other tabs placeholder */}
        <TabsContent value="departments">
          <Card><CardHeader><CardTitle>Department Management</CardTitle></CardHeader><CardContent><p>Coming soon...</p></CardContent></Card>
        </TabsContent>
        <TabsContent value="users">
          <Card><CardHeader><CardTitle>User Management</CardTitle></CardHeader><CardContent><p>Coming soon...</p></CardContent></Card>
        </TabsContent>
        <TabsContent value="security">
          <Card><CardHeader><CardTitle>Security Settings</CardTitle></CardHeader><CardContent><p>Coming soon...</p></CardContent></Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
