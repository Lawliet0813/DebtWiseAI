import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"

/**
 * 建立伺服器端Supabase客戶端
 * 重要：使用Fluid compute時，不要將此客戶端放在全域變數中
 * 每次使用時都要建立新的客戶端
 */
export async function createClient() {
  const cookieStore = await cookies()

  return createServerClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, {
    cookies: {
      getAll() {
        return cookieStore.getAll()
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options))
        } catch {
          // "setAll" 方法從伺服器元件呼叫
          // 如果您有中間件刷新用戶會話，可以忽略此錯誤
        }
      },
    },
  })
}
