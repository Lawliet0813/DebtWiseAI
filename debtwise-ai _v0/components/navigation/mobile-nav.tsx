"use client"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { createClient } from "@/lib/supabase/client"
import { useEffect, useState } from "react"
import type { User } from "@supabase/supabase-js"

const navItems = [
  { href: "/", label: "總覽", emoji: "📊" },
  { href: "/debts", label: "債務", emoji: "💳" },
  { href: "/progress", label: "進度", emoji: "📈" },
  { href: "/strategy", label: "策略", emoji: "🎯" },
  { href: "/tools", label: "工具", emoji: "🛠️" },
]

export function MobileNav() {
  const pathname = usePathname()
  const [user, setUser] = useState<User | null>(null)
  const supabase = createClient()

  useEffect(() => {
    const getUser = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      setUser(user)
    }

    getUser()

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      setUser(session?.user ?? null)
    })

    return () => subscription.unsubscribe()
  }, [supabase.auth])

  if (!user) {
    return null
  }

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 glass border-t border-white/20 px-4 py-2 md:hidden">
      <div className="flex items-center justify-around">
        {navItems.map((item) => {
          const isActive = pathname === item.href
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex flex-col items-center gap-1 px-3 py-2 rounded-xl transition-all duration-200",
                isActive
                  ? "bg-gradient-to-r from-purple-600 to-blue-600 text-white scale-110"
                  : "text-muted-foreground hover:text-foreground hover:scale-105",
              )}
            >
              <span className="text-lg">{item.emoji}</span>
              <span className="text-xs font-medium">{item.label}</span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
