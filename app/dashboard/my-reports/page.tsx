"use client"

import { useEffect, useState } from "react"
import { supabase } from "@/lib/supabaseClient"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Search, MoreHorizontal, ExternalLink } from "lucide-react"
import Link from "next/link"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

export default function MyReportsPage() {
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [myReports, setMyReports] = useState<any[]>([])

  useEffect(() => {
    async function fetchReports() {
      try {
        // ⚡️ TEMP: remove user_id filter for testing
        const { data, error } = await supabase
          .from("issues")
          .select("*")
          .order("created_at", { ascending: false })

        if (error) {
          console.error("Error fetching reports:", error.message)
        } else {
          console.log("Fetched reports:", data) // 👈 check actual structure
          setMyReports(data || [])
        }
      } catch (err) {
        console.error("Unexpected error fetching reports:", err)
      }
    }

    fetchReports()
  }, [])

  // ✅ Filter reports based on search query and status filter
  const filteredReports = myReports.filter((report) => {
    const matchesSearch =
      (report.title?.toLowerCase() || "").includes(searchQuery.toLowerCase()) ||
      (report.description?.toLowerCase() || "").includes(searchQuery.toLowerCase()) ||
      (report.location?.toLowerCase() || "").includes(searchQuery.toLowerCase())

    const matchesStatus = statusFilter === "all" || report.status === statusFilter

    return matchesSearch && matchesStatus
  })

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending":
        return "bg-yellow-500 hover:bg-yellow-600"
      case "in-progress":
        return "bg-blue-500 hover:bg-blue-600"
      case "resolved":
        return "bg-green-500 hover:bg-green-600"
      case "rejected":
        return "bg-red-500 hover:bg-red-600"
      default:
        return "bg-gray-500 hover:bg-gray-600"
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "high":
        return "bg-red-500 hover:bg-red-600"
      case "medium":
        return "bg-orange-500 hover:bg-orange-600"
      case "low":
        return "bg-blue-500 hover:bg-blue-600"
      default:
        return "bg-gray-500 hover:bg-gray-600"
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold tracking-tight">All issues</h1>
        <p className="text-muted-foreground">View and track all the issues have reported.</p>
      </div>

      <div className="flex flex-col gap-4">
        <div className="flex flex-col gap-4 sm:flex-row">
          <div className="relative flex-1">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search reports..."
              className="pl-8"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <Tabs defaultValue="all" className="w-full sm:w-auto" onValueChange={setStatusFilter}>
            <TabsList>
              <TabsTrigger value="all">All</TabsTrigger>
              <TabsTrigger value="pending">Pending</TabsTrigger>
              <TabsTrigger value="in-progress">In Progress</TabsTrigger>
              <TabsTrigger value="resolved">Resolved</TabsTrigger>
              <TabsTrigger value="rejected">Rejected</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>All Reported Issues</CardTitle>
            <CardDescription>
              {statusFilter === "all"
                ? "All issues have reported"
                : `Issues with status: ${statusFilter.replace("-", " ")}`}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {filteredReports.length > 0 ? (
                filteredReports.map((report) => (
                  <div key={report.id} className="flex flex-col gap-2 rounded-lg border p-4">
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="font-semibold">{report.title || "(No title)"}</h3>
                        <p className="text-sm text-muted-foreground">{report.location || "No location provided"}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        {report.priority && (
                          <Badge className={`${getPriorityColor(report.priority)} text-white`}>
                            {report.priority}
                          </Badge>
                        )}
                        {report.status && (
                          <Badge className={`${getStatusColor(report.status)} text-white`}>
                            {report.status.replace("-", " ")}
                          </Badge>
                        )}
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreHorizontal className="h-4 w-4" />
                              <span className="sr-only">More</span>
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuLabel>Actions</DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem asChild>
                              <Link href={`/dashboard/issues/${report.id}`}>View Details</Link>
                            </DropdownMenuItem>
                            <DropdownMenuItem>Track Progress</DropdownMenuItem>
                            <DropdownMenuItem>Share</DropdownMenuItem>
                            {report.status !== "resolved" && report.status !== "rejected" && (
                              <>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem className="text-red-600">Cancel Report</DropdownMenuItem>
                              </>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </div>
                    <p className="text-sm">{report.description || "No description provided"}</p>
                    {report.rejection_reason && (
                      <div className="mt-2 rounded-md bg-red-50 p-2 text-sm text-red-800 dark:bg-red-950 dark:text-red-300">
                        <span className="font-semibold">Rejection Reason: </span>
                        {report.rejection_reason}
                      </div>
                    )}
                    <div className="flex items-center justify-between pt-2 text-xs text-muted-foreground">
                      <div className="flex items-center gap-4">
                        <span>ID: {report.id}</span>
                        <span>Reported: {new Date(report.created_at).toLocaleDateString()}</span>
                      </div>
                      <Button variant="ghost" size="sm" asChild>
                        <Link href={`/dashboard/issues/${report.id}`}>
                          <ExternalLink className="mr-2 h-4 w-4" />
                          Details
                        </Link>
                      </Button>
                    </div>
                  </div>
                ))
              ) : (
                <div className="flex h-32 items-center justify-center rounded-lg border border-dashed">
                  <p className="text-center text-muted-foreground">
                    No reports found. {searchQuery ? "Try adjusting your search." : "Report an issue to get started."}
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
