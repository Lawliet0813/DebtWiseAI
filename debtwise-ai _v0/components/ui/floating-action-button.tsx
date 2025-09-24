"use client"

import { Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

interface FloatingActionButtonProps {
  onClick?: () => void
  className?: string
}

export function FloatingActionButton({ onClick, className }: FloatingActionButtonProps) {
  return (
    <Button
      onClick={onClick}
      className={cn(
        "fixed bottom-20 right-4 z-40 w-14 h-14 rounded-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 shadow-lg hover:shadow-xl transition-all duration-200 hover:scale-105 animate-pulse",
        "md:bottom-6",
        className,
      )}
      size="icon"
    >
      <Plus className="h-6 w-6 text-white" />
    </Button>
  )
}
