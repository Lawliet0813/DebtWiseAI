import { TopNav } from "@/components/navigation/top-nav"
import { MobileNav } from "@/components/navigation/mobile-nav"
import { FloatingActionButton } from "@/components/ui/floating-action-button"
import { ReportsAnalytics } from "@/components/reports/reports-analytics"

export default function ReportsPage() {
  return (
    <div className="min-h-screen pb-20 md:pb-6">
      <TopNav />
      <main className="max-w-7xl mx-auto px-4 py-6">
        <ReportsAnalytics />
      </main>
      <FloatingActionButton />
      <MobileNav />
    </div>
  )
}
