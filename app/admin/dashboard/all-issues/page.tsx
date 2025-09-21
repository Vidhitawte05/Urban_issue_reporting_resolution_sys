import { AdminIssuesList } from "@/components/admin/admin-issues-list"



export default function AllIssuesPage() {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold tracking-tight">All Issues</h1>
        <p className="text-muted-foreground">A comprehensive list of all reported issues in the system.</p>
      </div>
      <AdminIssuesList filter="all" />
    </div>
  )
}
