"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { LayoutDashboard, FileText, Users, Settings, BarChart3, Clock, CheckCircle, AlertTriangle, MessageSquare, Building, Shield } from 'lucide-react'

export function AdminSidebar() {
const pathname = usePathname()

const menuItems = [
  {
    title: "Dashboard",
    href: "/admin/dashboard",
    icon: LayoutDashboard,
  },
  {
    title: "All Issues",
    href: "/admin/dashboard/all-issues",
    icon: FileText,
  },
  {
    title: "Pending Issues",
    href: "/admin/dashboard/pending",
    icon: Clock,
  },
  {
    title: "Resolved Issues",
    href: "/admin/dashboard/resolved",
    icon: CheckCircle,
  },
  {
    title: "Urgent Issues",
    href: "/admin/dashboard/urgent-issues",
    icon: AlertTriangle,
  },
  {
    title: "Citizens Management",
    href: "/admin/dashboard/citizens-management",
    icon: Users,
  },
  {
    title: "Community",
    href: "/admin/dashboard/community",
    icon: MessageSquare,
  },
  
  {
    title: "Analytics",
    href: "/admin/dashboard/analytics",
    icon: BarChart3,
  },
  {
    title: "Settings",
    href: "/admin/dashboard/settings",
    icon: Settings,
  },
]

return (
  <div className="w-64 bg-white shadow-lg flex flex-col">
    <div className="p-6 border-b">
      <div className="flex items-center gap-2 font-bold text-xl">
        <Shield className="h-6 w-6 text-blue-600" />
        <span className="text-blue-600">Urban</span>
        <span className="text-gray-800">Admin</span>
      </div>
      <p className="text-sm text-gray-600 mt-1">Government Portal</p>
    </div>

    <nav className="flex-1 p-4">
      <ul className="space-y-2">
        {menuItems.map((item) => (
          <li key={item.href}>
            <Link
              href={item.href}
              className={cn(
                "flex items-center gap-3 px-3 py-2 rounded-lg transition-colors",
                pathname === item.href ? "bg-primary text-primary-foreground" : "text-gray-700 hover:bg-gray-100",
              )}
            >
              <item.icon className="h-5 w-5" />
              {item.title}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  </div>
)
}
