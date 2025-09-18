# DebtWise AI - 智能債務管理系統

> 🤖 使用 AI 技術幫助您制定最佳還款策略，實現財務自由的智能債務管理助手

![DebtWise AI Logo](https://img.shields.io/badge/DebtWise-AI-blue?style=for-the-badge&logo=react)
[![MIT License](https://img.shields.io/badge/License-MIT-green.svg)](https://choosealicense.com/licenses/mit/)
[![React](https://img.shields.io/badge/React-18.2.0-blue?logo=react)](https://reactjs.org/)
[![Vite](https://img.shields.io/badge/Vite-4.4.5-646CFF?logo=vite)](https://vitejs.dev/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-3.3.0-38B2AC?logo=tailwind-css)](https://tailwindcss.com/)

## ✨ 核心功能

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

## 🚀 快速開始

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

## 🏗️ 技術架構

### 前端技術棧
- **React 18** - 現代化 UI 框架
- **Vite** - 快速建置工具
- **Tailwind CSS** - 實用優先的 CSS 框架
- **Lucide React** - 精美的圖標庫
- **Recharts** - 數據視覺化圖表庫

### 專案結構
```
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
- 本地儲存，保護隱私
- 不收集敏感資訊
- 支援資料匯出和備份

### 📈 豐富報表
- 月度/年度趨勢分析
- 債務結構分析
- 還款預測和建議

## 🤝 貢獻指南

我們歡迎任何形式的貢獻！請遵循以下步驟：

1. Fork 本專案
2. 建立功能分支 (`git checkout -b feature/amazing-feature`)
3. 提交更改 (`git commit -m 'Add some amazing feature'`)
4. 推送到分支 (`git push origin feature/amazing-feature`)
5. 開啟 Pull Request

## 📄 開源授權

本專案採用 MIT 授權條款 - 查看 [LICENSE](LICENSE) 檔案了解更多詳情。

## 🙋‍♀️ 支援與反饋

- 📧 聯絡信箱：support@debtwise.ai
- 🐛 問題回報：[GitHub Issues](https://github.com/Lawliet0813/DebtWiseAI/issues)
- 💬 功能請求：[GitHub Discussions](https://github.com/Lawliet0813/DebtWiseAI/discussions)

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
