# win11_wsl_Note

# MyNote 個人智慧日誌系統

個人用的整合式筆記工具，把日記、隨手記、待辦事項放在同一個地方，解決「記了但找不到」的問題。

## 功能

- **今日頁面** — 快速新增記錄、查看今日待辦與日記
- **記錄列表** — 依分類篩選（日記 / 隨手記 / 待辦事項），支援分頁
- **月曆檢視** — 藍點標記有記錄的日期，點擊查看當日內容
- **全文搜尋** — 即時搜尋所有記錄內容
- **Markdown 匯出** — 匯出全部或指定類型的記錄，搭配 NotebookLM 做語意分析
- **Evernote 匯入** — 支援 `.enex` 格式匯入（開發中）

## 技術架構

```
mynote/
├── server/          # Node.js + Express + SQLite (port 3001)
└── client/          # React + Vite + Tailwind CSS (port 5173)
```

| 層級 | 技術 |
|------|------|
| 前端 | React 18、Vite、Tailwind CSS |
| 後端 | Node.js、Express |
| 資料庫 | SQLite（better-sqlite3） |

## 本機開發

### 前置需求

- Node.js 22+

### 安裝與啟動

```bash
# 安裝所有依賴（第一次或換機器時執行）
npm run install:all

# 啟動開發伺服器（後端 + 前端同時啟動）
npm run dev
```

開啟瀏覽器：`http://localhost:5173`

### Windows 11 注意事項

`better-sqlite3` 含有原生 C++ 模組，需在目標平台重新編譯。

**方法一（推薦）：用 WSL2 跑後端**

```bash
# WSL2 terminal — 跑後端
npm run dev --prefix server
```

```powershell
# Windows PowerShell — 跑前端
npm run dev --prefix client
```

**方法二：純 Windows**

安裝 Node.js 時勾選「Automatically install the necessary tools」，讓安裝程式自動處理 C++ Build Tools，再執行 `npm run install:all`。

## 環境變數

複製 `server/.env.example` 為 `server/.env`：

```bash
cp server/.env.example server/.env
```

## API 端點

| 方法 | 路徑 | 說明 |
|------|------|------|
| GET/POST | `/api/entries` | 取得 / 新增記錄 |
| GET/PUT/DELETE | `/api/entries/:id` | 單筆記錄操作 |
| GET | `/api/entries/calendar` | 月曆用記錄清單 |
| GET/POST | `/api/tags` | 標籤管理 |
| GET | `/api/search?q=` | 全文搜尋 |
| GET | `/api/export/markdown` | 匯出 Markdown |
| POST | `/api/import/enex` | 匯入 Evernote .enex |

## 未來規劃

- [ ] 標籤管理 UI
- [ ] 記錄編輯功能
- [ ] Evernote 匯入 UI
- [ ] AI metadata 萃取（情緒、人物、地點）
- [ ] LINE Bot 語音輸入
