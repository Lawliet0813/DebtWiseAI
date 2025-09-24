import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import Link from "next/link"
import { Button } from "@/components/ui/button"

export default async function AuthErrorPage({
  searchParams,
}: {
  searchParams: Promise<{ error: string }>
}) {
  const params = await searchParams

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 p-4">
      <div className="w-full max-w-md">
        <Card className="backdrop-blur-lg bg-white/10 border-white/20 shadow-2xl">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl font-bold text-white">認證錯誤</CardTitle>
          </CardHeader>
          <CardContent className="text-center space-y-4">
            {params?.error ? (
              <p className="text-red-300 bg-red-500/20 p-3 rounded-lg">錯誤代碼: {params.error}</p>
            ) : (
              <p className="text-gray-200">發生未知錯誤，請稍後再試。</p>
            )}
            <Button
              asChild
              className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
            >
              <Link href="/auth/login">返回登入頁面</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
