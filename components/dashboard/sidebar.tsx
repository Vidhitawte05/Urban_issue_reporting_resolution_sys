"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { AlertCircle, BarChart3, CheckCircle, Clock, FileText, Home, PlusCircle, Settings, Users } from "lucide-react"
import { Button } from "@/components/ui/button"

const routes = [
  {
    label: "Dashboard",
    icon: Home,
    href: "/dashboard",
    color: "text-sky-500",
  },
  {
    label: "Report Issue",
    icon: PlusCircle,
    href: "/dashboard/report",
    color: "text-violet-500",
  },
  {
    label: "My Reports",
    icon: FileText,
    href: "/dashboard/my-reports",
    color: "text-pink-700",
  },
  {
    label: "Pending Issues",
    icon: Clock,
    href: "/dashboard/pending",
    color: "text-orange-500",
  },
  {
    label: "Resolved Issues",
    icon: CheckCircle,
    href: "/dashboard/resolved",
    color: "text-emerald-500",
  },
  
  {
    label: "Community",
    icon: Users,
    href: "/dashboard/community",
    color: "text-blue-500",
  },
  {
    label: "Analytics",
    icon: BarChart3,
    href: "/dashboard/analytics",
    color: "text-yellow-500",
  },
  {
    label: "Settings",
    icon: Settings,
    href: "/dashboard/settings",
  },
]

export function Sidebar() {
  const pathname = usePathname()

  return (
    <div className="flex h-full w-[240px] flex-col border-r bg-background p-4">
      <div className="flex-1 space-y-1 py-4">
        {routes.map((route) => (
          <Button
            key={route.href}
            variant={pathname === route.href ? "secondary" : "ghost"}
            className={cn("w-full justify-start", pathname === route.href && "bg-muted font-medium")}
            asChild
          >
            <Link href={route.href}>
              <route.icon className={cn("mr-2 h-5 w-5", route.color)} />
              {route.label}
            </Link>
          </Button>
        ))}
      </div>
    </div>
  )
}
