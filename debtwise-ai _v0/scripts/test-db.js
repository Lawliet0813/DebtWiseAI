const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

async function testConnection() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  
  if (!supabaseUrl || !supabaseKey) {
    console.error('❌ 環境變數未設置')
    console.log('請檢查 .env.local 文件')
    return
  }
  
  console.log('🔄 測試 Supabase 連接...')
  console.log('URL:', supabaseUrl)
  console.log('Key:', supabaseKey.substring(0, 20) + '...')
  
  const supabase = createClient(supabaseUrl, supabaseKey)
  
  try {
    const { data, error } = await supabase.from('debts').select('count', { count: 'exact', head: true })
    if (error) {
      console.error('❌ 資料庫連接失敗:', error.message)
    } else {
      console.log('✅ 資料庫連接成功!')
    }
  } catch (err) {
    console.error('❌ 連接錯誤:', err.message)
  }
}

testConnection()
