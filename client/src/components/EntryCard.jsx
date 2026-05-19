import { useState } from 'react';
import { entriesApi } from '../services/api.js';

const TYPE_META = {
  journal:    { label: '日記',   bg: 'bg-blue-50',   text: 'text-blue-700'   },
  idea:       { label: '隨手記', bg: 'bg-amber-50',   text: 'text-amber-700'  },
  todo:       { label: '待辦',   bg: 'bg-purple-50',  text: 'text-purple-700' },
  voice_memo: { label: '語音',   bg: 'bg-green-50',   text: 'text-green-700'  },
};

function shortDate(iso) {
  const d = new Date(iso);
  return d.toLocaleString('zh-TW', {
    month: 'numeric', day: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
}

export default function EntryCard({ entry, onUpdate, onDelete }) {
  const [expanded, setExpanded] = useState(false);
  const meta    = TYPE_META[entry.type] ?? TYPE_META.idea;
  const isDone  = entry.status === 'done';
  const preview = !expanded && entry.content.length > 120
    ? entry.content.slice(0, 120) + '…'
    : entry.content;

  async function toggleTodo() {
    const next    = isDone ? 'pending' : 'done';
    const updated = await entriesApi.update(entry.id, { status: next });
    onUpdate?.(updated);
  }

  async function handleDelete() {
    if (!confirm('確定要刪除這筆記錄嗎？')) return;
    await entriesApi.delete(entry.id);
    onDelete?.(entry.id);
  }

  return (
    <div className={`bg-white rounded-xl border border-gray-200 p-4 transition-opacity ${isDone ? 'opacity-50' : ''}`}>
      <div className="flex items-start gap-3">
        {entry.type === 'todo' && (
          <button
            onClick={toggleTodo}
            className="mt-0.5 flex-shrink-0 focus:outline-none"
            aria-label={isDone ? '標為未完成' : '標為完成'}
          >
            <span className={`flex items-center justify-center w-5 h-5 rounded border-2 text-xs transition-colors ${
              isDone
                ? 'bg-green-500 border-green-500 text-white'
                : 'border-gray-300 hover:border-blue-400'
            }`}>
              {isDone && '✓'}
            </span>
          </button>
        )}

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1.5">
            <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${meta.bg} ${meta.text}`}>
              {meta.label}
            </span>
            <span className="text-xs text-gray-400">{shortDate(entry.created_at)}</span>
          </div>

          {entry.title && (
            <h3 className={`font-medium text-gray-800 mb-1 ${isDone ? 'line-through' : ''}`}>
              {entry.title}
            </h3>
          )}

          <p className={`text-sm text-gray-600 whitespace-pre-wrap leading-relaxed ${
            isDone && !entry.title ? 'line-through' : ''
          }`}>
            {preview}
          </p>

          {entry.content.length > 120 && (
            <button
              onClick={() => setExpanded(v => !v)}
              className="mt-1 text-xs text-blue-500 hover:underline"
            >
              {expanded ? '收起' : '展開全文'}
            </button>
          )}
        </div>

        <button
          onClick={handleDelete}
          className="flex-shrink-0 text-gray-300 hover:text-red-400 transition-colors text-xs leading-none p-1"
          aria-label="刪除"
        >
          ✕
        </button>
      </div>
    </div>
  );
}
