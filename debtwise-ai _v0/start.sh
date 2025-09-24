#!/bin/bash

echo "🚀 啟動 DebtWise AI 應用程式..."

# 檢查環境變數
if [ ! -f .env.local ]; then
    echo "❌ .env.local 文件不存在"
    exit 1
fi

# 檢查 Node.js
if ! command -v node &> /dev/null; then
    echo "❌ 請先安裝 Node.js"
    exit 1
fi

# 安裝依賴 (如果需要)
if [ ! -d node_modules ]; then
    echo "📦 安裝依賴套件..."
    if command -v pnpm &> /dev/null; then
        pnpm install
    else
        npm install
    fi
fi

# 啟動開發伺服器
echo "🌟 啟動開發伺服器..."
if command -v pnpm &> /dev/null; then
    pnpm dev
else
    npm run dev
fi
