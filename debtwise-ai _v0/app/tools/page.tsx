import { TopNav } from "@/components/navigation/top-nav"
import { MobileNav } from "@/components/navigation/mobile-nav"
import { FloatingActionButton } from "@/components/ui/floating-action-button"
import { ToolsCenter } from "@/components/tools/tools-center"

export default function ToolsPage() {
  return (
    <div className="min-h-screen pb-20 md:pb-6">
      <TopNav />
      <main className="max-w-7xl mx-auto px-4 py-6">
        <ToolsCenter />
      </main>
      <FloatingActionButton />
      <MobileNav />
    </div>
  )
}
