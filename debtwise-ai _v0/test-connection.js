// 簡單的連接測試
const https = require('https');

const SUPABASE_URL = 'https://jgtuigwywejqvxclbzix.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpndHVpZ3d5d2VqcXZ4Y2xieml4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTg3NDU3MDUsImV4cCI6MjA3NDMyMTcwNX0.5KVsJCKPgm3dv_Mvn76NNItvsER7FIxIYPKfsx07NLA';

console.log('🔄 測試 Supabase 連接...');
console.log('URL:', SUPABASE_URL);
console.log('Key:', SUPABASE_KEY.substring(0, 20) + '...');

// 測試 REST API 連接
const options = {
  hostname: 'jgtuigwywejqvxclbzix.supabase.co',
  path: '/rest/v1/',
  method: 'GET',
  headers: {
    'apikey': SUPABASE_KEY,
    'Authorization': 'Bearer ' + SUPABASE_KEY
  }
};

const req = https.request(options, (res) => {
  console.log('Status Code:', res.statusCode);
  if (res.statusCode === 200) {
    console.log('✅ Supabase REST API 連接成功!');
  } else {
    console.log('❌ Supabase REST API 連接失敗');
  }
  
  let data = '';
  res.on('data', (chunk) => {
    data += chunk;
  });
  
  res.on('end', () => {
    console.log('Response:', data);
  });
});

req.on('error', (error) => {
  console.error('❌ 連接錯誤:', error);
});

req.end();
