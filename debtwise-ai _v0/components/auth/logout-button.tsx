"use client"

import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { LogOut } from "lucide-react"
import { useRouter } from "next/navigation"
import { useState } from "react"

interface LogoutButtonProps {
  className?: string
  variant?: "default" | "destructive" | "outline" | "secondary" | "ghost" | "link"
}

export function LogoutButton({ className, variant = "ghost" }: LogoutButtonProps) {
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()

  const handleLogout = async () => {
    setIsLoading(true)
    const supabase = createClient()

    try {
      await supabase.auth.signOut()
      router.push("/auth/login")
    } catch (error) {
      console.error("登出錯誤:", error)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Button onClick={handleLogout} disabled={isLoading} variant={variant} className={className}>
      <LogOut className="h-4 w-4 mr-2" />
      {isLoading ? "登出中..." : "登出"}
    </Button>
  )
}
