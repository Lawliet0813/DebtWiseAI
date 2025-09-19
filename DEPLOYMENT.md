# 🚀 DebtWise AI 部署指南

## 📋 Git 初始化和 GitHub 推送步驟

由於專案已經建立完成，請手動執行以下命令來將專案推送到 GitHub：

### 1. 進入專案目錄
```bash
cd /Users/lawliet/DebtWiseAI
```

### 2. 初始化 Git 倉庫
```bash
git init
```

### 3. 設定 Git 使用者資訊（如果尚未設定）
```bash
git config --global user.name "Your Name"
git config --global user.email "your.email@example.com"
```

### 4. 添加所有檔案到暫存區
```bash
git add .
```

### 5. 提交初始版本
```bash
git commit -m "feat: 🎉 初始化 DebtWise AI 智能債務管理系統

✨ 新增功能：
- 智能債務管理系統核心功能
- 雪球法和雪崩法還款策略
- 響應式儀表板和債務概覽
- 即將到期債務提醒系統
- 現代化 UI 設計 (React + Tailwind CSS)
- 完整的專案結構和配置

🛠️ 技術棧：
- React 18 + Vite
- Tailwind CSS
- Lucide React Icons
- Recharts (準備整合)

📱 支援功能：
- 多種債務類型管理
- 進度追蹤可視化
- 財務狀況總覽
- 個人化歡迎介面"
```

### 6. 連接到 GitHub 遠端倉庫
```bash
git branch -M main
git remote add origin https://github.com/Lawliet0813/DebtWiseAI.git
```

### 7. 推送到 GitHub
```bash
git push -u origin main
```

## ✅ 驗證部署

推送成功後，您可以：

1. **檢查 GitHub 倉庫**
   - 訪問：https://github.com/Lawliet0813/DebtWiseAI
   - 確認所有檔案已正確上傳

2. **本地開發驗證**
   ```bash
   # 安裝依賴
   npm install
   
   # 啟動開發伺服器
   npm run dev
   
   # 建置專案
   npm run build
   
   # 程式碼檢查
   npm run lint
   ```

3. **瀏覽器測試**
   - 開啟 http://localhost:3000
   - 測試主要功能：登入、儀表板、債務概覽

## 📦 專案檔案清單

✅ 已建立的檔案：
- `/package.json` - 專案配置和依賴
- `/vite.config.js` - Vite 建置配置
- `/tailwind.config.js` - Tailwind CSS 配置  
- `/postcss.config.js` - PostCSS 配置
- `/.eslintrc.json` - ESLint 程式碼檢查配置
- `/.gitignore` - Git 忽略檔案規則
- `/index.html` - HTML 入口檔案
- `/src/main.jsx` - React 應用入口
- `/src/App.jsx` - 主要應用組件（21KB）
- `/src/index.css` - 全域 CSS 樣式
- `/README.md` - 專案說明文檔（4.7KB）
- `/LICENSE` - MIT 開源授權
- `/DEPLOYMENT.md` - 本檔案

## 🔄 後續開發流程

1. **功能開發**
   ```bash
   # 建立功能分支
   git checkout -b feat/new-feature
   
   # 開發完成後提交
   git add .
   git commit -m "feat: add new feature"
   git push origin feat/new-feature
   ```

2. **Pull Request**
   - 在 GitHub 上建立 PR
   - 添加適當的描述和截圖

3. **持續整合**
   - 建議添加 GitHub Actions
   - 自動化測試和部署

## 🌐 部署選項

### Vercel（推薦）

本專案已提供以下 Vercel 專用設定：

- `vercel.json`：指定使用 Vite 建置、SPA 路由轉址與輸出目錄。
- `api/[[...slug]].js`：將現有的 Node.js API 轉換為 Vercel Serverless Function，網址路徑為 `/api/*`。
- 調整後的 `src/api/client.js`：在生產環境自動呼叫同網域的 `/api` 端點。

#### 1. 安裝並登入 Vercel CLI
```bash
npm i -g vercel
vercel login
```

#### 2. 連結專案
```bash
vercel link
```

#### 3. 設定環境變數（建議）
```bash
# 供後端簽發 JWT 使用
vercel env add JWT_SECRET

# （選用）自訂存放資料檔案路徑，預設會使用 /tmp/data/db.json
vercel env add DEBTWISE_DB_FILE
```

> 提示：若想沿用預設設定，可跳過 `DEBTWISE_DB_FILE` 並在 Vercel 專案設定中將路徑設為 `/tmp/data/db.json` 或其他可讀寫的位置。

#### 4. 部署
```bash
vercel --prod
```

部署完成後可於 `https://<your-project>.vercel.app` 觀看前端，並透過 `https://<your-project>.vercel.app/api/...` 使用 API。

### Netlify
```bash
# 建置
npm run build

# 手動上傳 dist/ 目錄到 Netlify
```

### GitHub Pages
```bash
# 安裝 gh-pages
npm install --save-dev gh-pages

# 在 package.json 添加部署腳本
"homepage": "https://lawliet0813.github.io/DebtWiseAI",
"scripts": {
  "predeploy": "npm run build",
  "deploy": "gh-pages -d dist"
}

# 部署
npm run deploy
```

---
🎉 專案已準備就緒，祝部署順利！
