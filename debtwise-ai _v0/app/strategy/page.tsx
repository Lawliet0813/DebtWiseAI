import { TopNav } from "@/components/navigation/top-nav"
import { MobileNav } from "@/components/navigation/mobile-nav"
import { FloatingActionButton } from "@/components/ui/floating-action-button"
import { StrategySelection } from "@/components/strategy/strategy-selection"

export default function StrategyPage() {
  return (
    <div className="min-h-screen pb-20 md:pb-6">
      <TopNav />
      <main className="max-w-7xl mx-auto px-4 py-6">
        <StrategySelection />
      </main>
      <FloatingActionButton />
      <MobileNav />
    </div>
  )
}
