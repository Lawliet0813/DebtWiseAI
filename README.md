# DebtWise AI - 智能債務管理系統

> 🤖 使用 AI 技術幫助您制定最佳還款策略，實現財務自由的智能債務管理助手

![DebtWise AI Logo](https://img.shields.io/badge/DebtWise-AI-blue?style=for-the-badge&logo=react)
[![MIT License](https://img.shields.io/badge/License-MIT-green.svg)](https://choosealicense.com/licenses/mit/)
[![React](https://img.shields.io/badge/React-18.2.0-blue?logo=react)](https://reactjs.org/)
[![Vite](https://img.shields.io/badge/Vite-4.4.5-646CFF?logo=vite)](https://vitejs.dev/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-3.3.0-38B2AC?logo=tailwind-css)](https://tailwindcss.com/)

## 📦 專案組成

- **前端應用程式**：以 React + Vite 打造的使用者介面，提供完整的債務管理與 AI 策略分析體驗。
- **後端 API**：Node.js 實作的 REST 服務，整合 Supabase PostgreSQL 作為資料庫，支援使用者管理、債務 CRUD、還款模擬與分析。

---

## ✨ 前端核心功能

### 🎯 智能還款策略
- **雪球法**：優先償還小額債務，建立成就感與動力
- **雪崩法**：優先償還高利率債務，數學上最划算
- **AI 推薦**：基於財務狀況提供個人化建議

### 📊 債務管理
- 多種債務類型支援（信用卡、房貸、車貸、學貸等）
- 即時還款進度追蹤
- 詳細的債務分析和預測

### 📈 進度追蹤
- 視覺化還款進度
- 目標設定與追蹤
- 成就系統激勵

### 🛠️ 財務工具
- 貸款計算器
- 緊急基金計算器
- 投資回報計算器
- 房貸負擔能力評估

### 📚 理財教育
- 理財知識文章
- 每日理財小貼士
- 互動式學習進度

---

## 🚀 快速開始（前端）

### 環境需求
- Node.js 16+
- npm/pnpm/yarn

### 安裝步驟

1. **克隆專案**
   ```bash
   git clone https://github.com/Lawliet0813/DebtWiseAI.git
   cd DebtWiseAI
   ```

2. **安裝依賴**
   ```bash
   npm install
   # 或
   pnpm install
   # 或
   yarn install
   ```

3. **啟動開發伺服器**
   ```bash
   npm run dev
   # 或
   pnpm dev
   # 或
   yarn dev
   ```

4. **開啟瀏覽器**
   ```
   http://localhost:3000
   ```

### 可用指令

```bash
# 開發模式
npm run dev

# 建置專案
npm run build

# 程式碼檢查
npm run lint

# 預覽建置結果
npm run preview

# 執行測試
npm run test
```

## 🔧 後端設定（Supabase）

後端 API 預設會連線至 Supabase PostgreSQL。請在部署或啟動 Serverless Functions 時設定以下環境變數：

| 變數 | 說明 |
| --- | --- |
| `SUPABASE_URL` | Supabase 專案 URL。 |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase Service Role Key，建議僅在安全的後端環境使用。 |
| `SUPABASE_ANON_KEY` | （選用）匿名金鑰，若未提供 Service Role Key 可暫時使用。 |
| `SUPABASE_SCHEMA` | （選用）資料庫 schema 名稱，預設為 `public`。 |

資料表預期包含 `users`、`debts`、`payments`、`reminders` 四個集合，欄位結構與原本的 `data/db.json` 相同。若上述變數未設定，系統會自動改用專案內建的 JSON 檔案（`data/db.json`）以利本地測試。

---

## 🏗️ 前端技術架構

### 前端技術棧
- **React 18** - 現代化 UI 框架
- **Vite** - 快速建置工具
- **Tailwind CSS** - 實用優先的 CSS 框架
- **Lucide React** - 精美的圖標庫
- **Recharts** - 數據視覺化圖表庫

### 專案結構
```text
src/
├── components/          # 共用組件
│   ├── common/         # 基礎組件
│   ├── debt/          # 債務相關組件
│   ├── strategy/      # 策略相關組件
│   ├── progress/      # 進度相關組件
│   ├── tools/         # 工具組件
│   └── notifications/ # 通知組件
├── pages/             # 頁面組件
├── hooks/             # 自定義 Hooks
├── utils/             # 工具函數
├── services/          # API 服務
└── data/              # 資料相關
```

---

## 📱 功能特色

### 💡 智能分析
- AI 驅動的債務分析
- 個人化還款建議
- 財務健康評分

### 🎨 現代化 UI
- 響應式設計，支援各種螢幕尺寸
- 直觀的使用者介面
- 深色/淺色模式切換
- 流暢的動畫效果

### 🔐 資料安全
- 使用 Supabase 托管資料並可搭配 Row Level Security 保障隱私
- 環境變數控制資料庫連線，未設定時自動回退至本地 JSON 測試資料
- 支援資料匯出和備份

### 📈 豐富報表
- 月度/年度趨勢分析
- 債務結構分析
- 還款預測和建議

---

## 🤝 貢獻指南

我們歡迎任何形式的貢獻！請遵循以下步驟：

1. Fork 本專案
2. 建立功能分支 (`git checkout -b feature/amazing-feature`)
3. 提交更改 (`git commit -m 'Add some amazing feature'`)
4. 推送到分支 (`git push origin feature/amazing-feature`)
5. 開啟 Pull Request

---

## 📄 開源授權

本專案採用 MIT 授權條款 - 查看 [LICENSE](LICENSE) 檔案了解更多詳情。

---

## 🙋‍♀️ 支援與反饋

- 📧 聯絡信箱：support@debtwise.ai
- 🐛 問題回報：[GitHub Issues](https://github.com/Lawliet0813/DebtWiseAI/issues)
- 💬 功能請求：[GitHub Discussions](https://github.com/Lawliet0813/DebtWiseAI/discussions)

---

## 🎯 專案路線圖

### v1.0 (目前版本)
- [x] 基本債務管理
- [x] 還款策略分析
- [x] 進度追蹤
- [x] 財務工具
- [x] 理財教育

### v2.0 (計劃中)
- [ ] 後端 API 整合
- [ ] 使用者帳戶系統
- [ ] 雲端資料同步
- [ ] 進階 AI 分析
- [ ] 社群功能

### v3.0 (未來)
- [ ] 移動端 App
- [ ] 銀行 API 整合
- [ ] 投資建議功能
- [ ] 多語系支援

---

## 🌟 展示截圖

### 儀表板
![Dashboard](docs/screenshots/dashboard.png)

### 債務管理
![Debt Management](docs/screenshots/debt-management.png)

### 還款策略
![Payment Strategy](docs/screenshots/strategy.png)

---

**讓 DebtWise AI 成為您邁向財務自由的最佳夥伴！** 🚀

Made with ❤️ by DebtWise Team

---

## 🔧 Backend Prototype Overview

DebtWise AI is a debt management and intelligent repayment planning platform. This repository 亦包含一個 Node.js 後端 Prototype，現在預設整合 Supabase PostgreSQL 做為雲端資料庫，同時保留 JSON 檔案回退機制，便於在受限環境或離線情境中執行 RESTful API。

### Backend Features

- **User Management** – registration, login, profile updates, and membership upgrades (free vs. premium).
- **Debt Management** – create, update, delete debts with balance tracking, payment history, and membership-based limits.
- **Repayment Strategies** – deterministic simulation of snowball and avalanche strategies with payoff timelines and interest projections.
- **Reminders & Notifications** – automatic upcoming due-date reminders plus user-defined custom reminders.
- **Analytics & Visualisation Support** – aggregated metrics for totals, distributions, and payment trends to power dashboard charts.
- **Supabase-backed Storage** – 採用 Supabase PostgreSQL 儲存資料，並保留 `data/db.json` 作為本地測試與離線回退方案。

### Getting Started (Backend)

```bash
npm install

# 設定必要的 Supabase 環境變數
export SUPABASE_URL="https://<your-project>.supabase.co"
export SUPABASE_SERVICE_ROLE_KEY="<service-role-key>"

# 啟動 Node.js 後端
node src/server.js
```

The API listens on port `4000` by default. Override with `PORT=5000 node src/server.js`.

### Key Endpoints

| Method | Endpoint | Description |
| ------ | -------- | ----------- |
| `POST` | `/auth/register` | Create a new user account. |
| `POST` | `/auth/login` | Obtain an access token. |
| `GET` | `/users/me` | Retrieve authenticated user profile. |
| `POST` | `/debts` | Create a debt (free tier limited to 5 debts). |
| `POST` | `/debts/:id/payments` | Record a payment and update balance. |
| `POST` | `/strategies/simulate` | Run snowball or avalanche simulations. |
| `GET` | `/analytics/summary` | Fetch totals and payoff progress. |
| `GET` | `/reminders/upcoming` | List automatic and custom reminders. |

Authentication relies on a bearer token returned by login/registration responses.

### Running Backend Tests

```bash
npm test
```

Node's built-in test runner validates repayment strategy calculations and error handling.

### Backend Project Structure

```text
src/
  algorithms/       # Snowball & avalanche simulation logic
  services/         # Domain services operating on the data store
  routes/           # HTTP route registrations
  http/router.js    # Minimal routing & auth layer
  storage/          # Supabase + JSON fallback adapters
  utils/            # Shared helpers (JWT, validation, etc.)
data/db.json        # Persistent storage
```

### Backend Roadmap

- 添加 Supabase schema migration 與種子資料腳本。
- Add push notification integrations (APNs/FCM).
- Provide PDF export and predictive analytics for premium tier (v2 goals).

### Security Notes

- Passwords are hashed with PBKDF2 (120k iterations, SHA-512).
- JWT generation implemented with HMAC-SHA256 and configurable expiry.
- Ensure the default secret (`JWT_SECRET`) is overridden in production deployments.

