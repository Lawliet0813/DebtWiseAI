"use client"

import { createClient } from "@/lib/supabase/client"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { LogOut, Settings, User } from "lucide-react"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import type { User as SupabaseUser } from "@supabase/supabase-js"

export function UserProfile() {
  const [user, setUser] = useState<SupabaseUser | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    const getUser = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      setUser(user)
      setIsLoading(false)
    }

    getUser()

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      setUser(session?.user ?? null)
    })

    return () => subscription.unsubscribe()
  }, [supabase.auth])

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push("/auth/login")
  }

  if (isLoading) {
    return <div className="h-8 w-8 rounded-full bg-white/20 animate-pulse" />
  }

  if (!user) {
    return (
      <Button onClick={() => router.push("/auth/login")} variant="ghost" className="text-white hover:bg-white/20">
        登入
      </Button>
    )
  }

  const displayName = user.user_metadata?.display_name || user.email?.split("@")[0] || "用戶"
  const initials = displayName.slice(0, 2).toUpperCase()

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="relative h-8 w-8 rounded-full">
          <Avatar className="h-8 w-8">
            <AvatarFallback className="bg-white/20 text-white text-xs">{initials}</AvatarFallback>
          </Avatar>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56 bg-white/10 backdrop-blur-lg border-white/20" align="end" forceMount>
        <DropdownMenuLabel className="font-normal text-white">
          <div className="flex flex-col space-y-1">
            <p className="text-sm font-medium leading-none">{displayName}</p>
            <p className="text-xs leading-none text-gray-300">{user.email}</p>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator className="bg-white/20" />
        <DropdownMenuItem className="text-white hover:bg-white/20 cursor-pointer">
          <User className="mr-2 h-4 w-4" />
          <span>個人資料</span>
        </DropdownMenuItem>
        <DropdownMenuItem className="text-white hover:bg-white/20 cursor-pointer">
          <Settings className="mr-2 h-4 w-4" />
          <span>設定</span>
        </DropdownMenuItem>
        <DropdownMenuSeparator className="bg-white/20" />
        <DropdownMenuItem className="text-white hover:bg-white/20 cursor-pointer" onClick={handleLogout}>
          <LogOut className="mr-2 h-4 w-4" />
          <span>登出</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
