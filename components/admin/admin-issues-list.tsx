"use client"

import { useState, useEffect } from "react"
import { supabase } from "@/lib/supabaseClient"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Clock, CheckCircle, AlertTriangle, MapPin, User, Calendar, Search, Eye, Edit, MessageSquare, Wrench, XCircle } from 'lucide-react'
import { useToast } from '@/components/ui/use-toast'

interface IssueComment {
  id: string
  author: string
  message: string
  timestamp: string
  isAdmin: boolean
}

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
  lastUpdated: string
  comments: IssueComment[]
}

interface Worker {
  id: string
  name: string
  department: string
  status: "available" | "busy" | "offline"
  current_tasks: number
  completed_tasks: number
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
  const [newComment, setNewComment] = useState("")
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false)
  const [isUpdateDialogOpen, setIsUpdateDialogOpen] = useState(false)
  const [isAssignWorkDialogOpen, setIsAssignWorkDialogOpen] = useState(false)
  const [dialogNewStatus, setDialogNewStatus] = useState("")
  const [dialogAssignedTo, setDialogAssignedTo] = useState("")
  const [quickUpdateStatus, setQuickUpdateStatus] = useState("")
  const [assignWorkerId, setAssignWorkerId] = useState("")
  const [assignInstructions, setAssignInstructions] = useState("")

  const { toast } = useToast()

  // Fetch issues + workers
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true)
      const { data: issuesData, error: issuesErr } = await supabase
        .from("issues")
        .select("*, workers(name, department)")
        .order("created_at", { ascending: false })

      const { data: workersData, error: workersErr } = await supabase
        .from("workers")
        .select("*")

      if (issuesErr) setError(issuesErr.message)
      if (workersErr) setError(workersErr.message)

      if (issuesData) {
        setIssues(
          issuesData.map((i: any) => ({
            id: i.id,
            title: i.title,
            description: i.description,
            priority: i.priority,
            status: i.status,
            submittedBy: i.submitted_by || "Citizen",
            submittedDate: i.created_at.split("T")[0],
            location: i.location,
            contact: i.contact || "",
            email: i.email || "",
            assignedTo: i.workers ? i.workers.name : null,
            lastUpdated: i.created_at.split("T")[0],
            comments: [], // can connect to comments table if needed
          }))
        )
      }
      if (workersData) setWorkers(workersData)
      setLoading(false)
    }

    fetchData()
  }, [])

  // Update issue status in DB
  const handleUpdateIssueStatus = async (issueId: string, newStatus: string, assignedTo: string | null) => {
    const { error } = await supabase
      .from("issues")
      .update({ status: newStatus, assigned_to: assignedTo || null })
      .eq("id", issueId)

    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" })
      return
    }

    setIssues(prev => prev.map(i => i.id === issueId ? { ...i, status: newStatus, assignedTo: assignedTo } : i))
    setIsViewDialogOpen(false)
    setIsUpdateDialogOpen(false)
    toast({ title: "Success", description: `Issue ${issueId} updated to ${newStatus}` })
  }

  // Assign worker
  const handleAssignIssueToWorker = async (issueId: string, workerId: string, instructions: string) => {
    const { error } = await supabase
      .from("issues")
      .update({ status: "in-progress", assigned_to: workerId })
      .eq("id", issueId)

    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" })
      return
    }

    toast({ title: "Assigned!", description: `Issue ${issueId} assigned.` })
    setIsAssignWorkDialogOpen(false)
  }

  // Filtering
  const filteredIssues = issues.filter(issue => {
    const matchesFilter =
      filter === "all" ||
      issue.status === filter ||
      (filter === "urgent" && issue.priority === "urgent")
    const matchesSearch =
      issue.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      issue.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      issue.submittedBy.toLowerCase().includes(searchTerm.toLowerCase()) ||
      issue.location.toLowerCase().includes(searchTerm.toLowerCase())
    return matchesFilter && matchesSearch
  })

  if (loading) {
    return (
      <div className="flex flex-col gap-6">
        <div className="flex flex-col gap-2">
          {/* Skeletons for loading state */}
        </div>
        <div className="flex items-center gap-4">
          {/* Skeletons for search/filter */}
        </div>
        <Card>
          <CardHeader>
            {/* Skeletons for card header */}
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="flex items-start justify-between p-4 border rounded-lg">
                  <div className="flex-1 space-y-2">
                    <div className="flex items-center gap-2">
                      <Skeleton className="h-5 w-64" />
                      <Skeleton className="h-6 w-16" />
                      <Skeleton className="h-6 w-20" />
                    </div>
                    <Skeleton className="h-4 w-full" />
                    <div className="flex gap-4">
                      <Skeleton className="h-4 w-32" />
                      <Skeleton className="h-4 w-24" />
                      <Skeleton className="h-4 w-20" />
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Skeleton className="h-8 w-20" />
                    <Skeleton className="h-8 w-24" />
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex flex-col gap-6">
        <h1 className="text-3xl font-bold tracking-tight">Error</h1>
        <p className="text-red-500">Failed to load issues: {error}</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
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
                <p className="text-center text-muted-foreground">
                  No issues found. Try adjusting your search or filter criteria.
                </p>
              </div>
            ) : (
              filteredIssues.map((issue) => (
                <div key={issue.id} className="flex items-start justify-between p-4 border rounded-lg">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-lg font-semibold text-gray-900">{issue.title}</h3>
                      <Badge className={getStatusColor(issue.status)}>
                        {getStatusIcon(issue.status)}
                        <span className="ml-1 capitalize">{issue.status.replace("-", " ")}</span>
                      </Badge>
                      <Badge className={getPriorityColor(issue.priority)}>
                        <span className="capitalize">{issue.priority}</span>
                      </Badge>
                    </div>

                    <p className="text-gray-600 mb-3 line-clamp-2">{issue.description}</p>

                    <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500">
                      <div className="flex items-center gap-1">
                        <User className="w-4 h-4" />
                        {issue.submittedBy}
                      </div>
                      <div className="flex items-center gap-1">
                        <MapPin className="w-4 h-4" />
                        {issue.location}
                      </div>
                      <div className="flex items-center gap-1">
                        <Calendar className="w-4 h-4" />
                        {issue.submittedDate}
                      </div>
                      {issue.assignedTo && (
                        <div className="flex items-center gap-1">
                          <Wrench className="w-4 h-4" />
                          Assigned to: {issue.assignedTo}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 ml-4">
                    <Dialog open={isViewDialogOpen && selectedIssue?.id === issue.id} onOpenChange={setIsViewDialogOpen}>
                      <DialogTrigger asChild>
                        <Button variant="outline" size="sm" onClick={() => handleViewDialogOpen(issue)}>
                          <Eye className="w-4 h-4 mr-1" />
                          View
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
                        <DialogHeader>
                          <DialogTitle className="flex items-center gap-2">
                            <AlertTriangle className="w-5 h-5" />
                            Issue Details - {selectedIssue?.id}
                          </DialogTitle>
                          <DialogDescription>Manage and update issue status</DialogDescription>
                        </DialogHeader>

                        {selectedIssue && (
                          <div className="space-y-6">
                            {/* Issue Info */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                              <div>
                                <h4 className="font-semibold mb-3">Issue Information</h4>
                                <div className="space-y-2 text-sm">
                                  <div>
                                    <strong>Title:</strong> {selectedIssue.title}
                                  </div>
                                  <div>
                                    <strong>Category:</strong> {selectedIssue.category}
                                  </div>
                                  <div>
                                    <strong>Priority:</strong>
                                    <Badge className={`ml-2 ${getPriorityColor(selectedIssue.priority)}`}>
                                      {selectedIssue.priority}
                                    </Badge>
                                  </div>
                                  <div>
                                    <strong>Status:</strong>
                                    <Badge className={`ml-2 ${getStatusColor(selectedIssue.status)}`}>
                                      {selectedIssue.status.replace("-", " ")}
                                    </Badge>
                                  </div>
                                  <div>
                                    <strong>Location:</strong> {selectedIssue.location}
                                  </div>
                                  <div>
                                    <strong>Submitted:</strong> {selectedIssue.submittedDate}
                                  </div>
                                  {selectedIssue.assignedTo && (
                                    <div>
                                      <strong>Assigned To:</strong> {selectedIssue.assignedTo}
                                    </div>
                                  )}
                                </div>
                              </div>

                              <div>
                                <h4 className="font-semibold mb-3">Citizen Information</h4>
                                <div className="space-y-2 text-sm">
                                  <div className="flex items-center gap-2">
                                    <User className="w-4 h-4" />
                                    <strong>Name:</strong> {selectedIssue.submittedBy}
                                  </div>
                                  <div>
                                    <strong>Phone:</strong> {selectedIssue.contact}
                                  </div>
                                  <div>
                                    <strong>Email:</strong> {selectedIssue.email}
                                  </div>
                                </div>
                              </div>
                            </div>

                            {/* Description */}
                            <div>
                              <h4 className="font-semibold mb-2">Description</h4>
                              <p className="text-gray-700 bg-gray-50 p-3 rounded-lg">{selectedIssue.description}</p>
                            </div>

                            {/* Status Update */}
                            <div className="border-t pt-4">
                              <h4 className="font-semibold mb-3">Update Status</h4>
                              <div className="flex gap-4 mb-4">
                                <div className="flex-1">
                                  <Label htmlFor="status-update">New Status</Label>
                                  <Select value={dialogNewStatus} onValueChange={(value) => setDialogNewStatus(value)}>
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
                                </div>
                                <div className="flex-1">
                                  <Label htmlFor="assign-to">Assign To</Label>
                                  <Input
                                    placeholder="Department/Team"
                                    value={dialogAssignedTo}
                                    onChange={(e) => setDialogAssignedTo(e.target.value)}
                                  />
                                </div>
                              </div>
                              <Button onClick={() => selectedIssue && handleUpdateIssueStatus(selectedIssue.id, dialogNewStatus, dialogAssignedTo)}>
                                Save Changes
                              </Button>
                            </div>

                            {/* Comments */}
                            <div className="border-t pt-4">
                              <h4 className="font-semibold mb-3">Comments & Updates</h4>
                              <div className="space-y-3 mb-4 max-h-60 overflow-y-auto">
                                {selectedIssue.comments.map((comment: any) => (
                                  <div
                                    key={comment.id}
                                    className={`p-3 rounded-lg ${comment.isAdmin ? "bg-blue-50 border-l-4 border-blue-400" : "bg-gray-50"}`}
                                  >
                                    <div className="flex items-center justify-between mb-1">
                                      <span className="font-medium text-sm">
                                        {comment.isAdmin ? (
                                          <Badge variant="secondary" className="mr-2">
                                            Admin
                                          </Badge>
                                        ) : (
                                          <Badge variant="outline" className="mr-2">
                                            Citizen
                                          </Badge>
                                        )}
                                        {comment.author}
                                      </span>
                                      <span className="text-xs text-gray-500">{comment.timestamp}</span>
                                    </div>
                                    <p className="text-sm text-gray-700">{comment.message}</p>
                                  </div>
                                ))}
                              </div>

                              <div className="space-y-2">
                                <Label htmlFor="new-comment">Add Comment</Label>
                                <Textarea
                                  id="new-comment"
                                  placeholder="Add a comment or update..."
                                  value={newComment}
                                  onChange={(e) => setNewComment(e.target.value)}
                                />
                                <Button
                                  onClick={() => selectedIssue && handleAddComment(selectedIssue.id, newComment)}
                                  disabled={!newComment.trim()}
                                >
                                  <MessageSquare className="w-4 h-4 mr-2" />
                                  Add Comment
                                </Button>
                              </div>
                            </div>
                          </div>
                        )}
                      </DialogContent>
                    </Dialog>

                    <Dialog open={isUpdateDialogOpen && selectedIssue?.id === issue.id} onOpenChange={setIsUpdateDialogOpen}>
                      <DialogTrigger asChild>
                        <Button size="sm" onClick={() => handleQuickUpdateOpen(issue)}>
                          <Edit className="w-4 h-4 mr-1" />
                          Update
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Quick Status Update</DialogTitle>
                          <DialogDescription>Update the status of issue {issue.id}</DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4">
                          <div>
                            <Label>Current Status</Label>
                            <Badge className={`ml-2 ${getStatusColor(issue.status)}`}>
                              {issue.status.replace("-", " ")}
                            </Badge>
                          </div>
                          <div>
                            <Label htmlFor="quick-status">New Status</Label>
                            <Select value={quickUpdateStatus} onValueChange={(value) => setQuickUpdateStatus(value)}>
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
                          </div>
                          <Button onClick={() => selectedIssue && handleUpdateIssueStatus(selectedIssue.id, quickUpdateStatus, selectedIssue.assignedTo)}>
                            Update Status
                          </Button>
                        </div>
                      </DialogContent>
                    </Dialog>

                    <Dialog open={isAssignWorkDialogOpen && selectedIssue?.id === issue.id} onOpenChange={setIsAssignWorkDialogOpen}>
                      <DialogTrigger asChild>
                        <Button size="sm" variant="secondary" onClick={() => handleAssignWorkOpen(issue)}>
                          <Wrench className="w-4 h-4 mr-1" />
                          Assign
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Assign Work for Issue {selectedIssue?.id}</DialogTitle>
                          <DialogDescription>Assign this issue to a field worker.</DialogDescription>
                        </DialogHeader>
                        {selectedIssue && (
                          <div className="space-y-4">
                            <div>
                              <Label htmlFor="worker-select">Select Worker</Label>
                              <Select
                                value={assignWorkerId}
                                onValueChange={(value) => setAssignWorkerId(value)}
                              >
                                <SelectTrigger>
                                  <SelectValue placeholder="Choose a worker" />
                                </SelectTrigger>
                                <SelectContent>
                                  {workers.map((worker) => (
                                    <SelectItem key={worker.id} value={worker.id}>
                                      {worker.name} - {worker.department} ({worker.status})
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>
                            <div>
                              <Label htmlFor="assign-instructions">Instructions for Worker</Label>
                              <Textarea
                                id="assign-instructions"
                                placeholder="Provide detailed instructions for the worker..."
                                rows={4}
                                value={assignInstructions}
                                onChange={(e) => setAssignInstructions(e.target.value)}
                              />
                            </div>
                          </div>
                        )}
                        <DialogFooter>
                          <Button
                            onClick={() => selectedIssue && handleAssignIssueToWorker(selectedIssue.id, assignWorkerId, assignInstructions)}
                            disabled={!assignWorkerId || !assignInstructions.trim()}
                          >
                            Assign Issue
                          </Button>
                        </DialogFooter>
                      </DialogContent>
                    </Dialog>
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
