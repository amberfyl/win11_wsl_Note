-- entries: 所有記錄的主表
CREATE TABLE IF NOT EXISTS entries (
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

CREATE INDEX IF NOT EXISTS idx_entries_type ON entries(type);
CREATE INDEX IF NOT EXISTS idx_entries_created ON entries(created_at);
CREATE INDEX IF NOT EXISTS idx_entries_status ON entries(status) WHERE status IS NOT NULL;

-- entry_metadata: AI 萃取的結構化資料
CREATE TABLE IF NOT EXISTS entry_metadata (
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

-- tags: 手動標籤
CREATE TABLE IF NOT EXISTS tags (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL UNIQUE,
    color TEXT DEFAULT '#6B7280',
    created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ','now'))
);

-- entry_tags: 記錄與標籤的多對多關係
CREATE TABLE IF NOT EXISTS entry_tags (
    entry_id TEXT NOT NULL REFERENCES entries(id) ON DELETE CASCADE,
    tag_id TEXT NOT NULL REFERENCES tags(id) ON DELETE CASCADE,
    PRIMARY KEY (entry_id, tag_id)
);

-- import_history: 匯入紀錄
CREATE TABLE IF NOT EXISTS import_history (
    id TEXT PRIMARY KEY,
    source TEXT NOT NULL CHECK (source IN ('evernote','notion','markdown','other')),
    file_name TEXT,
    entry_count INTEGER NOT NULL DEFAULT 0,
    imported_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ','now'))
);
