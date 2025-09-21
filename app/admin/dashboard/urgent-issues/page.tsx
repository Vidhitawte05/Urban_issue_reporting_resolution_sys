import { AdminIssuesList } from "@/components/admin/admin-issues-list"

export default function UrgentIssuesPage() {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold tracking-tight">Urgent Issues</h1>
        <p className="text-muted-foreground">Critical issues requiring immediate attention and rapid resolution.</p>
      </div>
      <AdminIssuesList filter="high" />
    </div>
  )
}
