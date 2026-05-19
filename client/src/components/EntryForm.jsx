import { useState } from 'react';
import { entriesApi } from '../services/api.js';

const TYPES = [
  { value: 'journal', label: '日記' },
  { value: 'idea',    label: '隨手記' },
  { value: 'todo',    label: '待辦' },
];

export default function EntryForm({ onSave, onCancel, defaultType = 'journal' }) {
  const [type, setType]       = useState(defaultType);
  const [title, setTitle]     = useState('');
  const [content, setContent] = useState('');
  const [saving, setSaving]   = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    const trimContent = content.trim();
    const trimTitle   = title.trim();
    if (!trimContent && !trimTitle) return;
    setSaving(true);
    try {
      const entry = await entriesApi.create({
        type,
        title:   trimTitle || null,
        content: trimContent || trimTitle,
        status:  type === 'todo' ? 'pending' : null,
      });
      onSave(entry);
      setTitle('');
      setContent('');
    } finally {
      setSaving(false);
    }
  }

  const isTodo = type === 'todo';

  return (
    <form
      onSubmit={handleSubmit}
      className="bg-white rounded-xl border border-gray-200 p-4 space-y-3 shadow-sm"
    >
      <div className="flex gap-2">
        {TYPES.map(({ value, label }) => (
          <button
            key={value}
            type="button"
            onClick={() => setType(value)}
            className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
              type === value
                ? 'bg-blue-100 text-blue-700'
                : 'text-gray-500 hover:bg-gray-100'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {!isTodo && (
        <input
          type="text"
          placeholder="標題（選填）"
          value={title}
          onChange={e => setTitle(e.target.value)}
          className="w-full text-sm border-0 border-b border-gray-200 pb-1.5 focus:outline-none focus:border-blue-400 transition-colors"
        />
      )}

      <textarea
        placeholder={isTodo ? '待辦事項...' : '寫點什麼...'}
        value={content}
        onChange={e => setContent(e.target.value)}
        rows={isTodo ? 2 : 5}
        autoFocus
        className="w-full text-sm resize-none focus:outline-none text-gray-700 placeholder-gray-300"
      />

      <div className="flex justify-end gap-2 pt-1 border-t border-gray-100">
        <button
          type="button"
          onClick={onCancel}
          className="px-3 py-1.5 text-sm text-gray-500 hover:text-gray-700"
        >
          取消
        </button>
        <button
          type="submit"
          disabled={saving || (!content.trim() && !title.trim())}
          className="px-4 py-1.5 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-40 transition-colors"
        >
          {saving ? '儲存中...' : '儲存'}
        </button>
      </div>
    </form>
  );
}
