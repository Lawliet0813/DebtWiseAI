"use client"

import { Bell } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { UserProfile } from "@/components/auth/user-profile"

export function TopNav() {
  return (
    <header className="sticky top-0 z-40 glass border-b border-white/20 px-4 py-3">
      <div className="flex items-center justify-between max-w-7xl mx-auto">
        {/* Brand Logo */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-gradient-to-r from-purple-600 to-blue-600 flex items-center justify-center">
            <span className="text-white font-bold text-lg">💰</span>
          </div>
          <div>
            <h1 className="font-bold text-lg gradient-text">DebtWise AI</h1>
            <p className="text-xs text-muted-foreground">智慧債務管理</p>
          </div>
        </div>

        {/* User Actions */}
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" className="relative">
            <Bell className="h-5 w-5" />
            <Badge className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 bg-gradient-to-r from-orange-400 to-yellow-400 text-xs">
              3
            </Badge>
          </Button>
          <UserProfile />
        </div>
      </div>
    </header>
  )
}
