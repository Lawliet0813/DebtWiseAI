import { TopNav } from "@/components/navigation/top-nav"
import { MobileNav } from "@/components/navigation/mobile-nav"
import { FloatingActionButton } from "@/components/ui/floating-action-button"
import { DashboardOverview } from "@/components/dashboard/dashboard-overview"
import { ProtectedRoute } from "@/components/auth/protected-route"

export default function HomePage() {
  return (
    <ProtectedRoute>
      <div className="min-h-screen pb-20 md:pb-6">
        <TopNav />
        <main className="max-w-7xl mx-auto px-4 py-6">
          <DashboardOverview />
        </main>
        <FloatingActionButton />
        <MobileNav />
      </div>
    </ProtectedRoute>
  )
}
