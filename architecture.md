# 個人智慧日誌系統 — 完整架構文件

## 一、產品定位

一套整合日記、隨手記、待辦事項的個人記錄系統，搭配 AI 語意搜尋與分析功能，解決「記了很多但找不到、用不上」的核心痛點。

支援手動輸入與 LINE 語音輸入，資料儲存在自己的系統，支援 Evernote 匯入匯出。

---

## 二、系統架構總覽

```
┌─────────────────────────────────────────────────┐
│                    使用者介面                      │
│         Web App（React + Tailwind CSS）            │
│   日記撰寫 ｜ 快速記錄 ｜ 搜尋 ｜ 分析儀表板         │
└──────────────────────┬──────────────────────────┘
                       │ REST API
┌──────────────────────▼──────────────────────────┐
│                  後端服務 (Node.js)                │
│                                                   │
│  ┌─────────┐ ┌──────────┐ ┌───────────────────┐  │
│  │ 記錄管理 │ │ 匯入匯出  │ │ LINE Webhook 接收 │  │
│  └────┬────┘ └─────┬────┘ └────────┬──────────┘  │
│       │            │               │              │
│  ┌────▼────────────▼───────────────▼──────────┐  │
│  │              AI 處理層                       │  │
│  │  Embedding 產生 ｜ Metadata 萃取 ｜ RAG 問答  │  │
│  │           （Claude API）                     │  │
│  └────────────────────┬───────────────────────┘  │
│                       │                           │
│  ┌────────────────────▼───────────────────────┐  │
│  │              資料存取層                       │  │
│  │    SQLite（主資料）+ SQLite-vec（向量）        │  │
│  │    Markdown 檔案（原始內容備份）               │  │
│  └────────────────────────────────────────────┘  │
└──────────────────────────────────────────────────┘
```

---

## 三、資料庫設計

### 3.1 主資料庫（SQLite）

#### entries — 所有記錄的主表

| 欄位 | 型別 | 說明 |
|------|------|------|
| id | TEXT (UUID) | 主鍵 |
| type | TEXT | `journal` / `idea` / `todo` / `voice_memo` |
| title | TEXT | 標題（可為空，日記通常不需要標題） |
| content | TEXT | Markdown 格式的內容 |
| status | TEXT | 僅 todo 使用：`pending` / `done` / `cancelled` |
| source | TEXT | `manual` / `line_voice` |
| is_pinned | INTEGER | 是否釘選，0 或 1 |
| created_at | TEXT | ISO 8601 建立時間 |
| updated_at | TEXT | ISO 8601 更新時間 |

```sql
CREATE TABLE entries (
    id TEXT PRIMARY KEY,
    type TEXT NOT NULL CHECK (type IN ('journal','idea','todo','voice_memo')),
    title TEXT,
    content TEXT NOT NULL,
    status TEXT CHECK (status IN ('pending','done','cancelled')),
    source TEXT NOT NULL DEFAULT 'manual' CHECK (source IN ('manual','line_voice')),
    is_pinned INTEGER NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ','now')),
    updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ','now'))
);

CREATE INDEX idx_entries_type ON entries(type);
CREATE INDEX idx_entries_created ON entries(created_at);
CREATE INDEX idx_entries_status ON entries(status) WHERE status IS NOT NULL;
```

#### entry_metadata — AI 自動萃取的結構化資料

| 欄位 | 型別 | 說明 |
|------|------|------|
| entry_id | TEXT | 外鍵，對應 entries.id |
| mood | TEXT | 情緒：`happy` / `calm` / `anxious` / `sad` / `angry` / `excited` |
| energy_level | INTEGER | 精力值 1~10 |
| topics | TEXT | JSON 陣列，如 `["工作","健身"]` |
| people | TEXT | JSON 陣列，如 `["小明","老闆"]` |
| locations | TEXT | JSON 陣列，如 `["台北","星巴克"]` |
| events | TEXT | JSON 陣列，如 `["開會","跑步5K"]` |
| summary | TEXT | AI 產生的一句話摘要 |
| extracted_at | TEXT | 萃取時間 |

```sql
CREATE TABLE entry_metadata (
    entry_id TEXT PRIMARY KEY REFERENCES entries(id) ON DELETE CASCADE,
    mood TEXT,
    energy_level INTEGER CHECK (energy_level BETWEEN 1 AND 10),
    topics TEXT DEFAULT '[]',
    people TEXT DEFAULT '[]',
    locations TEXT DEFAULT '[]',
    events TEXT DEFAULT '[]',
    summary TEXT,
    extracted_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ','now'))
);
```

#### tags & entry_tags — 手動標籤系統

```sql
CREATE TABLE tags (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL UNIQUE,
    color TEXT DEFAULT '#6B7280',
    created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ','now'))
);

CREATE TABLE entry_tags (
    entry_id TEXT NOT NULL REFERENCES entries(id) ON DELETE CASCADE,
    tag_id TEXT NOT NULL REFERENCES tags(id) ON DELETE CASCADE,
    PRIMARY KEY (entry_id, tag_id)
);
```

#### import_history — 匯入紀錄

```sql
CREATE TABLE import_history (
    id TEXT PRIMARY KEY,
    source TEXT NOT NULL CHECK (source IN ('evernote','notion','markdown','other')),
    file_name TEXT,
    entry_count INTEGER NOT NULL DEFAULT 0,
    imported_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ','now'))
);
```

### 3.2 向量資料庫（SQLite-vec）

```sql
-- 儲存每筆記錄的 embedding 向量
-- 向量維度依所選 embedding 模型而定（Claude 建議 1024 維）
CREATE VIRTUAL TABLE entry_embeddings USING vec0(
    entry_id TEXT PRIMARY KEY,
    vector float[1024]
);
```

### 3.3 本地 Markdown 檔案（備份用）

```
data/
├── journal/
│   ├── 2026/
│   │   ├── 05/
│   │   │   ├── 2026-05-18.md
│   │   │   └── 2026-05-19.md
│   │   └── 06/
│   └── ...
├── ideas/
│   ├── idea-a1b2c3d4.md
│   └── ...
├── todos/
│   ├── todo-e5f6g7h8.md
│   └── ...
└── voice_memos/
    ├── voice-i9j0k1l2.md
    └── ...
```

每個 Markdown 檔案的 front matter 包含 metadata：

```markdown
---
id: a1b2c3d4-e5f6-7890-abcd-ef1234567890
type: journal
tags: [工作, 心得]
created: 2026-05-18T22:30:00+08:00
---

今天跟團隊討論了新的架構方案...
```

---

## 四、技術選型

| 層級 | 技術 | 選擇原因 |
|------|------|----------|
| 前端 | React + Tailwind CSS | 開發快、元件化、後續可包 Tauri 桌面版 |
| 後端 | Node.js + Express | 與前端同語言，降低複雜度 |
| 資料庫 | SQLite + SQLite-vec | 單檔案、免架設、本地優先 |
| AI | Claude API | 中文理解力強，支援 metadata 萃取與 RAG |
| Embedding | Voyage AI 或 OpenAI text-embedding | 語意向量化，未來可換本地模型 |
| LINE 串接 | LINE Messaging API + Webhook | 接收語音訊息並轉文字 |
| 語音轉文字 | LINE 內建或 Whisper API | 語音 → 文字 |
| 匯入匯出 | ENEX 解析器（Evernote 格式） | 支援 Evernote 匯入匯出 |

### AI 抽象層設計（預留換模型彈性）

```javascript
// ai-provider.js — 統一介面
class AIProvider {
    async generateEmbedding(text) { }
    async extractMetadata(text) { }
    async chat(query, contextDocs) { }
}

class ClaudeProvider extends AIProvider { ... }
class LocalModelProvider extends AIProvider { ... }  // 日後擴充

// 使用時只認介面，不認實作
const ai = new ClaudeProvider(apiKey);
// 日後切換：
// const ai = new LocalModelProvider(modelPath);
```

---

## 五、核心功能流程

### 5.1 寫入流程（手動輸入）

```
使用者打字
  → 前端送出 { type, content, tags }
  → 後端存入 SQLite entries 表
  → 同步寫一份 Markdown 檔案到本地
  → 背景非同步：
      ├── Claude API 萃取 metadata → 存入 entry_metadata
      └── Embedding API 產生向量 → 存入 entry_embeddings
```

### 5.2 寫入流程（LINE 語音）

```
使用者對 LINE Bot 傳送語音訊息
  → LINE 平台 Webhook 打到你的後端
  → 後端下載語音檔
  → 語音轉文字（Whisper API 或 LINE 內建）
  → 自動建立一筆 entry（type: voice_memo, source: line_voice）
  → 同樣觸發 metadata 萃取 + embedding
  → 可選：LINE Bot 回覆「已記錄：[文字摘要前30字]」
```

### 5.3 語意搜尋流程（RAG）

```
使用者輸入：「上次去日本吃的那家拉麵」
  → 問句轉 embedding 向量
  → 向量資料庫找出最相似的 5~10 筆記錄
  → 將這些記錄原文 + 使用者問句一起送給 Claude
  → Claude 回答：「你在 2026/03/12 的日記提到，
     在東京新宿吃了一家叫『風雲兒』的拉麵，
     你說沾麵比湯麵好吃。」
  → 回答附帶來源日期連結，可點擊跳到原文
```

### 5.4 分析流程

```
使用者選擇：「分析我 2026 年 3~5 月」
  → 從 entry_metadata 撈出該期間所有結構化資料
  → SQL 彙總：
      ├── 情緒分布（每週 mood 統計）
      ├── 精力趨勢（energy_level 折線圖）
      ├── 常見主題 Top 10
      ├── 最常提到的人
      └── 活動頻率
  → 前端繪製圖表（Recharts）
  → 可選：將彙總資料丟給 Claude 產生「月報」文字洞察
```

### 5.5 匯入匯出流程

**匯入（Evernote → 本系統）**

```
使用者上傳 .enex 檔案（Evernote 匯出格式）
  → 後端解析 ENEX XML
  → 每一筆 note 轉成一筆 entry
  → 保留原始建立時間、標籤
  → 記錄到 import_history
  → 背景觸發 metadata 萃取 + embedding
```

**匯出（本系統 → Evernote 相容格式）**

```
使用者選擇匯出範圍（全部 / 某類型 / 某時間區間）
  → 後端產生 .enex 檔案
  → 使用者下載後可匯入 Evernote
  → 同時提供 Markdown ZIP 匯出選項
```

---

## 六、API 設計

### 記錄 CRUD

```
POST   /api/entries              建立記錄
GET    /api/entries              列表（支援 type, date range, tag 篩選）
GET    /api/entries/:id          取得單筆
PUT    /api/entries/:id          更新
DELETE /api/entries/:id          刪除
```

### 標籤

```
POST   /api/tags                 建立標籤
GET    /api/tags                 列表
PUT    /api/tags/:id             更新（改名、改顏色）
DELETE /api/tags/:id             刪除
POST   /api/entries/:id/tags     為記錄加標籤
DELETE /api/entries/:id/tags/:tagId  移除標籤
```

### 搜尋

```
POST   /api/search               語意搜尋（自然語言）
GET    /api/search/fulltext?q=    全文關鍵字搜尋
```

### 分析

```
GET    /api/analytics/mood?from=&to=        情緒趨勢
GET    /api/analytics/topics?from=&to=      主題統計
GET    /api/analytics/people?from=&to=      人物統計
GET    /api/analytics/summary?from=&to=     AI 產生的期間總結
```

### 匯入匯出

```
POST   /api/import/evernote       上傳 .enex 匯入
GET    /api/export/evernote       匯出 .enex
GET    /api/export/markdown       匯出 Markdown ZIP
```

### LINE Webhook

```
POST   /api/webhook/line          LINE 平台回呼端點
```

---

## 七、前端頁面規劃

| 頁面 | 功能 |
|------|------|
| 首頁/今日 | 今天的日記 + 待辦清單 + 快速新增按鈕 |
| 日曆檢視 | 月曆，有記錄的日期有標記，點擊查看當日內容 |
| 記錄列表 | 所有記錄，可依類型/標籤/日期篩選排序 |
| 編輯器 | Markdown 編輯器，支援即時預覽 |
| 搜尋 | 搜尋框 + 結果列表，支援自然語言與關鍵字 |
| 分析儀表板 | 情緒圖表、主題統計、人物關係、AI 洞察 |
| 設定 | API Key 管理、匯入匯出、標籤管理 |

---

## 八、檔案目錄結構

```
project-root/
├── client/                    # 前端 React
│   ├── src/
│   │   ├── components/        # UI 元件
│   │   │   ├── Editor/        # Markdown 編輯器
│   │   │   ├── Calendar/      # 日曆檢視
│   │   │   ├── Search/        # 搜尋介面
│   │   │   ├── Analytics/     # 分析圖表
│   │   │   └── QuickInput/    # 快速輸入浮窗
│   │   ├── pages/             # 頁面
│   │   ├── hooks/             # 自訂 hooks
│   │   ├── services/          # API 呼叫
│   │   └── utils/             # 工具函數
│   └── package.json
│
├── server/                    # 後端 Node.js
│   ├── src/
│   │   ├── routes/            # API 路由
│   │   ├── services/          # 商業邏輯
│   │   │   ├── entry.service.js
│   │   │   ├── search.service.js
│   │   │   ├── analytics.service.js
│   │   │   ├── import-export.service.js
│   │   │   └── line-webhook.service.js
│   │   ├── ai/                # AI 抽象層
│   │   │   ├── ai-provider.js
│   │   │   ├── claude-provider.js
│   │   │   └── local-provider.js   # 日後擴充
│   │   ├── db/                # 資料庫
│   │   │   ├── schema.sql
│   │   │   ├── migrations/
│   │   │   └── db.js
│   │   └── utils/
│   └── package.json
│
├── data/                      # 本地資料（使用者的）
│   ├── app.db                 # SQLite 主資料庫
│   ├── vectors.db             # SQLite-vec 向量
│   ├── journal/               # Markdown 備份
│   ├── ideas/
│   ├── todos/
│   └── voice_memos/
│
└── README.md
```

---

## 九、開發階段規劃

### 第一階段：能寫能看（2~3 週）

- 前後端專案初始化
- SQLite 資料庫建立（entries + tags）
- 記錄 CRUD API
- Markdown 編輯器（寫日記、記 idea、加 todo）
- 日曆檢視（哪天有寫東西、點進去看）
- 手動標籤功能
- 全文關鍵字搜尋

**里程碑：你每天會想打開來用。**

### 第二階段：能找（2 週）

- 接入 Embedding API
- 建立 SQLite-vec 向量索引
- 語意搜尋 API + 前端搜尋介面
- RAG 問答（自然語言問，AI 帶來源回答）

**里程碑：問「上次吃的那家店」能找到。**

### 第三階段：能分析（2~3 週）

- AI metadata 自動萃取（情緒、人物、地點、事件）
- 分析儀表板（情緒趨勢圖、主題統計、人物排行）
- AI 產生期間總結報告

**里程碑：看到自己三個月的生活模式。**

### 第四階段：LINE 語音輸入（1~2 週）

- LINE Bot 建立 + Webhook 設定
- 語音訊息接收 + 語音轉文字
- 自動建立 voice_memo 類型記錄
- LINE Bot 回覆確認訊息

**里程碑：對 LINE 說話就能記事。**

### 第五階段：匯入匯出（1 週）

- Evernote .enex 解析器
- 匯入功能（含 metadata 補萃取）
- 匯出成 .enex + Markdown ZIP

**里程碑：舊資料全部進來，未來也不怕搬家。**

### 第六階段（未來）：桌面版 + 進階功能

- Tauri 包裝桌面版（全域快捷鍵、離線使用）
- AI 主動提醒（「你上週說想做的事還沒做」）
- 本地模型替換 Claude API

---

## 十、安全與隱私考量

- API Key 加密儲存，不存明碼
- 所有資料在本地，AI 呼叫只送出當下需要的片段
- LINE Webhook 驗證簽章，防止偽造請求
- 匯出檔案不含 API Key 或系統設定

---

## 十一、成本估算

| 項目 | 費用 | 說明 |
|------|------|------|
| Claude API | 每月約 $3~10 USD | 取決於每日記錄量與搜尋次數 |
| Embedding API | 每月約 $1~3 USD | 每筆記錄產生一次向量 |
| LINE Messaging API | 免費方案可用 | 每月 500 則免費訊息 |
| 伺服器 | 視部署方式 | 本地跑免費，雲端約 $5~10/月 |
