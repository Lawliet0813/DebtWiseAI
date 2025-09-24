# DebtWise AI - 智慧債務管理系統

DebtWise AI 是一個全端的個人債務管理與還款策略 AI 助手，幫助用戶有效管理債務、制定還款計劃並實現財務自由。

## 🎯 核心功能

### ✅ 已完成功能
- **用戶認證系統** - JWT 身份驗證、註冊登錄
- **債務管理** - 完整的 CRUD 操作、債務分類、進度追蹤
- **還款策略** - 雪球法、雪崩法、AI 推薦策略
- **財務計算器** - 貸款計算、債務比較、投資計算等 6 種工具
- **儀表板** - 財務健康評分、統計圖表、進度追蹤
- **響應式設計** - 支援桌面端、平板、手機

### 🚧 開發中功能
- 支付記錄管理
- 目標設定與追蹤
- 詳細報表分析
- 通知系統
- 教育中心內容

## 🛠 技術棧

### 前端
- **React 18** - 現代化前端框架
- **Vite** - 快速建構工具
- **Tailwind CSS** - 實用優先的 CSS 框架
- **Recharts** - 資料視覺化圖表庫
- **React Router** - 前端路由管理
- **Axios** - HTTP 客戶端

### 後端
- **Node.js + Express** - 伺服器端框架
- **PostgreSQL** - 關聯式資料庫
- **JWT** - 身份驗證
- **bcrypt** - 密碼加密
- **Joi** - 資料驗證

### 開發工具
- **Vitest** - 單元測試框架
- **ESLint** - 程式碼檢查
- **Prettier** - 程式碼格式化
- **pnpm** - 套件管理工具

## 🚀 快速開始

### 環境需求
- Node.js 18+
- PostgreSQL 14+
- pnpm 8+

### 1. 專案設定

```bash
# 複製專案
git clone <repository-url>
cd debtwise-ai

# 安裝依賴
pnpm install

# 前端依賴
cd client
pnpm install
cd ..
```

### 2. 資料庫設定

```bash
# 建立 PostgreSQL 資料庫
createdb debtwise_ai

# 執行資料庫遷移
psql -d debtwise_ai -f server/db/schema.sql
```

### 3. 環境變數設定

```bash
# 複製環境變數範例
cp .env.example .env

# 編輯 .env 檔案，填入正確的設定值
```

### 4. 啟動開發服務

```bash
# 同時啟動前端和後端
pnpm dev

# 或分別啟動
pnpm server  # 後端 (http://localhost:3001)
pnpm client  # 前端 (http://localhost:5173)
```

## 📋 可用指令

```bash
# 開發
pnpm dev                 # 同時啟動前後端
pnpm server             # 啟動後端 API 伺服器
pnpm client             # 啟動前端開發伺服器

# 建構
pnpm build              # 建構生產版本
pnpm start              # 啟動生產模式

# 測試
pnpm test               # 執行單元測試
pnpm test:ui            # 啟動測試 UI
pnpm test:coverage      # 執行測試並生成覆蓋率報告

# 程式碼品質
pnpm lint               # 檢查程式碼風格
pnpm lint:fix           # 自動修正程式碼風格

# 資料庫
pnpm db:migrate         # 執行資料庫遷移
pnpm db:seed            # 填入種子資料
```

## 📁 專案結構

```
debtwise-ai/
├── client/                 # React 前端
│   ├── src/
│   │   ├── components/     # 可重用元件
│   │   ├── pages/          # 頁面元件
│   │   ├── contexts/       # React Context
│   │   ├── services/       # API 服務
│   │   ├── hooks/          # 自定義 Hooks
│   │   ├── utils/          # 工具函數
│   │   └── test/           # 測試檔案
│   ├── public/             # 靜態資源
│   └── package.json
├── server/                 # Express 後端
│   ├── routes/             # API 路由
│   ├── middleware/         # 中間件
│   ├── db/                 # 資料庫相關
│   ├── utils/              # 工具函數
│   └── index.js            # 伺服器入口
├── tests/                  # 整合測試
├── docs/                   # 專案文件
├── .env.example            # 環境變數範例
├── package.json            # 根目錄套件設定
└── README.md              # 專案說明
```

## 🔧 環境變數說明

### 必要設定
```env
# 資料庫連線
DB_HOST=localhost
DB_PORT=5432
DB_NAME=debtwise_ai
DB_USER=your_username
DB_PASSWORD=your_password

# JWT 設定
JWT_SECRET=your-256-bit-secret
JWT_EXPIRES_IN=7d

# 伺服器設定
PORT=3001
CLIENT_URL=http://localhost:5173
```

### 選用設定
```env
# Email 服務 (通知功能)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password

# 外部 API (AI 功能增強)
OPENAI_API_KEY=your-openai-key
```

## 🧪 測試

```bash
# 執行所有測試
pnpm test

# 監聽模式執行測試
pnpm test --watch

# 產生覆蓋率報告
pnpm test --coverage

# 執行特定測試檔案
pnpm test src/services/api.test.js
```

## 📊 API 端點

### 身份驗證
- `POST /api/auth/register` - 用戶註冊
- `POST /api/auth/login` - 用戶登入
- `POST /api/auth/refresh` - 重新整理 Token
- `GET /api/auth/me` - 取得用戶資訊

### 債務管理
- `GET /api/debts` - 取得債務列表
- `POST /api/debts` - 新增債務
- `PUT /api/debts/:id` - 更新債務
- `DELETE /api/debts/:id` - 刪除債務

### 計算工具
- `POST /api/calculators/loan` - 貸款計算
- `POST /api/calculators/payoff` - 債務還款計算
- `POST /api/calculators/debt-comparison` - 債務策略比較

[完整 API 文件請參考 `/docs/api.md`]

## 🎨 設計系統

### 顏色配置
- **主色調**: `primary-600` (#0284c7)
- **成功色**: `success-600` (#22c55e)
- **警告色**: `warning-600` (#f59e0b)
- **錯誤色**: `error-600` (#dc2626)

### 元件庫
- 按鈕 (`Button`)
- 載入指示器 (`LoadingSpinner`)
- 表單控制項 (`Input`, `Select`, `Checkbox`)
- 卡片 (`Card`)
- 模態框 (`Modal`)

## 🔒 安全性

- **JWT 身份驗證** - 安全的 token 機制
- **密碼加密** - bcrypt 雜湊加密
- **輸入驗證** - Joi 嚴格驗證
- **CORS 配置** - 跨域請求保護
- **率限制** - API 請求頻率限制

## 📈 效能最佳化

- **程式碼分割** - 按需載入元件
- **快取策略** - API 回應快取
- **圖片最佳化** - 響應式圖片
- **Bundle 分析** - Webpack Bundle Analyzer

## 🚀 部署

### Docker 部署
```bash
# 建構 Docker 映像
docker build -t debtwise-ai .

# 執行容器
docker run -p 3001:3001 debtwise-ai
```

### 環境部署
```bash
# 建構生產版本
pnpm build

# 啟動生產服務器
pnpm start
```

## 🤝 貢獻指南

1. Fork 此專案
2. 建立功能分支 (`git checkout -b feat/amazing-feature`)
3. 提交變更 (`git commit -m 'feat: add amazing feature'`)
4. 推送到分支 (`git push origin feat/amazing-feature`)
5. 開啟 Pull Request

### Commit 規範
- `feat:` 新功能
- `fix:` 錯誤修正
- `docs:` 文件更新
- `style:` 程式碼格式
- `refactor:` 重構
- `test:` 測試相關
- `chore:` 建構/工具

## 📝 更新日誌

### v1.0.0 (2024-09-19)
- ✅ 基礎架構建立
- ✅ 用戶認證系統
- ✅ 債務管理 CRUD
- ✅ 財務計算器
- ✅ 響應式儀表板
- ✅ 測試框架設定

### 即將推出
- 🔲 支付記錄管理
- 🔲 目標追蹤系統
- 🔲 AI 推薦功能
- 🔲 移動端 App
- 🔲 多語言支援

## 📞 支援

如有問題或建議，請通過以下方式聯繫：

- 📧 Email: support@debtwise-ai.com
- 🐛 Issues: [GitHub Issues](https://github.com/your-repo/issues)
- 📖 文件: [Wiki](https://github.com/your-repo/wiki)

## 📄 授權

此專案採用 MIT 授權條款 - 詳見 [LICENSE](LICENSE) 文件

---

**DebtWise AI** - 您的智慧理財夥伴 💰✨