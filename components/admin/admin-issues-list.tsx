"use client"

import { useState, useEffect } from "react"
import { supabase } from "@/lib/supabaseClient"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Skeleton } from "@/components/ui/skeleton"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { MapPin, User, Calendar, Search, Eye, Edit, Wrench, AlertTriangle } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"

interface Issue {
  id: string
  title: string
  description: string
  priority: string
  status: string
  submittedBy: string
  submittedDate: string
  location: string
  contact: string
  email: string
  assignedTo: string | null
}

interface Worker {
  id: string
  name: string
  department: string
  status: "available" | "busy" | "offline"
}

interface AdminIssuesListProps {
  filter: string
}

export function AdminIssuesList({ filter }: AdminIssuesListProps) {
  const [searchTerm, setSearchTerm] = useState("")
  const [issues, setIssues] = useState<Issue[]>([])
  const [workers, setWorkers] = useState<Worker[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedIssue, setSelectedIssue] = useState<Issue | null>(null)
  const [newStatus, setNewStatus] = useState("")
  const { toast } = useToast()

  // Fetch issues + workers
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true)
      const { data: issuesData, error: issuesErr } = await supabase
        .from("issues")
        .select("*")
        .order("created_at", { ascending: false })

      const { data: workersData } = await supabase.from("workers").select("*")

      if (issuesErr) setError(issuesErr.message)

      if (issuesData) {
        setIssues(
          issuesData.map((i: any) => ({
            id: i.id,
            title: i.title,
            description: i.description,
            priority: i.priority,
            status: i.status,
            submittedBy: i.submitted_by || "Citizen",
            submittedDate: i.created_at?.split("T")[0] ?? "",
            location: i.location ?? "",
            contact: i.contact ?? "",
            email: i.email ?? "",
            assignedTo: i.assigned_to ?? null,
          }))
        )
      }

      if (workersData) setWorkers(workersData)
      setLoading(false)
    }

    fetchData()
  }, [])

  // Update issue status in DB
  const handleUpdateIssueStatus = async (issueId: string, status: string) => {
    const { error } = await supabase.from("issues").update({ status }).eq("id", issueId)
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" })
    } else {
      setIssues((prev) => prev.map((i) => (i.id === issueId ? { ...i, status } : i)))
      toast({ title: "Updated", description: `Status updated to ${status}` })
    }
  }

  const filteredIssues = issues.filter((issue) => {
    const matchesFilter =
      filter === "all" ||
      issue.status === filter ||
      (filter === "high" && issue.priority === "high")
    const matchesSearch =
      issue.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      issue.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      issue.submittedBy.toLowerCase().includes(searchTerm.toLowerCase()) ||
      issue.location.toLowerCase().includes(searchTerm.toLowerCase())
    return matchesFilter && matchesSearch
  })

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Loading Issues...</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="flex items-start justify-between p-4 border rounded-lg">
                <Skeleton className="h-5 w-64" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    )
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Error</CardTitle>
          <CardDescription className="text-red-500">Failed to load issues: {error}</CardDescription>
        </CardHeader>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* Search */}
      <div className="flex items-center gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search issues, citizens, or locations..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {/* Issues List */}
      <Card>
        <CardHeader>
          <CardTitle>Issues Management</CardTitle>
          <CardDescription>
            {filter === "all" ? "All reported issues" : `Issues filtered by: ${filter}`}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {filteredIssues.length === 0 ? (
              <div className="flex h-32 items-center justify-center rounded-lg border border-dashed">
                <p className="text-muted-foreground">No issues found.</p>
              </div>
            ) : (
              filteredIssues.map((issue) => (
                <div key={issue.id} className="rounded-lg border p-4 space-y-3">
                  <div className="flex items-center gap-3">
                    <h3 className="font-semibold text-lg">{issue.title}</h3>
                    <Badge>{issue.status}</Badge>
                    <Badge variant="secondary">{issue.priority}</Badge>
                  </div>

                  <p className="text-sm text-muted-foreground line-clamp-2">{issue.description}</p>

                  <div className="flex flex-wrap items-center gap-4 text-xs text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <User className="w-4 h-4" /> {issue.submittedBy}
                    </div>
                    <div className="flex items-center gap-1">
                      <MapPin className="w-4 h-4" /> {issue.location}
                    </div>
                    <div className="flex items-center gap-1">
                      <Calendar className="w-4 h-4" /> {issue.submittedDate}
                    </div>
                  </div>

                  <div className="flex justify-end gap-2">
                    {/* View Dialog */}
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button size="sm" variant="outline" onClick={() => setSelectedIssue(issue)}>
                          <Eye className="w-4 h-4 mr-1" /> View
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle className="flex items-center gap-2">
                            <AlertTriangle className="w-5 h-5" />
                            Issue Details
                          </DialogTitle>
                          <DialogDescription>Full details of this issue</DialogDescription>
                        </DialogHeader>
                        {selectedIssue && (
                          <div className="space-y-4">
                            <p><strong>Title:</strong> {selectedIssue.title}</p>
                            <p><strong>Description:</strong> {selectedIssue.description}</p>
                            <p><strong>Status:</strong> {selectedIssue.status}</p>
                            <p><strong>Priority:</strong> {selectedIssue.priority}</p>
                            <p><strong>Location:</strong> {selectedIssue.location}</p>
                            <p><strong>Submitted By:</strong> {selectedIssue.submittedBy}</p>
                          </div>
                        )}
                      </DialogContent>
                    </Dialog>

                    {/* Update Dialog */}
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button size="sm">
                          <Edit className="w-4 h-4 mr-1" /> Update
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Update Status</DialogTitle>
                          <DialogDescription>Change the status of this issue</DialogDescription>
                        </DialogHeader>
                        <Select value={newStatus} onValueChange={setNewStatus}>
                          <SelectTrigger>
                            <SelectValue placeholder="Select new status" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="pending">Pending</SelectItem>
                            <SelectItem value="in-progress">In Progress</SelectItem>
                            <SelectItem value="resolved">Resolved</SelectItem>
                            <SelectItem value="rejected">Rejected</SelectItem>
                          </SelectContent>
                        </Select>
                        <Button
                          onClick={() => {
                            handleUpdateIssueStatus(issue.id, newStatus)
                          }}
                          disabled={!newStatus}
                        >
                          Save
                        </Button>
                      </DialogContent>
                    </Dialog>

                    <Button size="sm" variant="secondary">
                      <Wrench className="w-4 h-4 mr-1" /> Assign
                    </Button>
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
