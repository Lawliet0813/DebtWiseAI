import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import Link from "next/link"
import { Button } from "@/components/ui/button"

export default function SignUpSuccessPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 p-4">
      <div className="w-full max-w-md">
        <Card className="backdrop-blur-lg bg-white/10 border-white/20 shadow-2xl">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl font-bold text-white">註冊成功！</CardTitle>
            <CardDescription className="text-gray-200">請檢查您的電子郵件</CardDescription>
          </CardHeader>
          <CardContent className="text-center space-y-4">
            <p className="text-gray-200">我們已經發送確認郵件到您的信箱。請點擊郵件中的連結來啟用您的帳號。</p>
            <div className="space-y-2">
              <Button
                asChild
                className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
              >
                <Link href="/auth/login">返回登入頁面</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
