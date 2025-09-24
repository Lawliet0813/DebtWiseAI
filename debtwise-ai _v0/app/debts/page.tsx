import { TopNav } from "@/components/navigation/top-nav"
import { MobileNav } from "@/components/navigation/mobile-nav"
import { FloatingActionButton } from "@/components/ui/floating-action-button"
import { DebtManagement } from "@/components/debts/debt-management"

export default function DebtsPage() {
  return (
    <div className="min-h-screen pb-20 md:pb-6">
      <TopNav />
      <main className="max-w-7xl mx-auto px-4 py-6">
        <DebtManagement />
      </main>
      <FloatingActionButton />
      <MobileNav />
    </div>
  )
}
