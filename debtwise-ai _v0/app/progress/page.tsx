import { TopNav } from "@/components/navigation/top-nav"
import { MobileNav } from "@/components/navigation/mobile-nav"
import { FloatingActionButton } from "@/components/ui/floating-action-button"
import { ProgressTracking } from "@/components/progress/progress-tracking"

export default function ProgressPage() {
  return (
    <div className="min-h-screen pb-20 md:pb-6">
      <TopNav />
      <main className="max-w-7xl mx-auto px-4 py-6">
        <ProgressTracking />
      </main>
      <FloatingActionButton />
      <MobileNav />
    </div>
  )
}
