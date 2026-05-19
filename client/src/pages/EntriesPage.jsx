import { useState, useEffect } from 'react';
import { entriesApi } from '../services/api.js';
import EntryCard from '../components/EntryCard.jsx';

const TYPE_FILTERS = [
  { value: '',        label: '全部'   },
  { value: 'journal', label: '日記'   },
  { value: 'idea',    label: '隨手記' },
  { value: 'todo',    label: '待辦'   },
];

const LIMIT = 20;

export default function EntriesPage() {
  const [entries, setEntries] = useState([]);
  const [type, setType]       = useState('');
  const [page, setPage]       = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [loading, setLoading] = useState(true);

  async function load(t, p, append = false) {
    setLoading(true);
    try {
      const data = await entriesApi.list({ type: t || undefined, page: p, limit: LIMIT });
      setEntries(prev => append ? [...prev, ...data] : data);
      setHasMore(data.length === LIMIT);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    setPage(1);
    load(type, 1, false);
  }, [type]);

  function handleUpdate(updated) {
    setEntries(prev => prev.map(e => e.id === updated.id ? updated : e));
  }

  function handleDelete(id) {
    setEntries(prev => prev.filter(e => e.id !== id));
  }

  function loadMore() {
    const next = page + 1;
    setPage(next);
    load(type, next, true);
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-800">記錄列表</h1>

      {/* 分類篩選 */}
      <div className="flex gap-2 flex-wrap">
        {TYPE_FILTERS.map(({ value, label }) => (
          <button
            key={value}
            onClick={() => setType(value)}
            className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
              type === value
                ? 'bg-blue-600 text-white shadow-sm'
                : 'bg-white border border-gray-200 text-gray-600 hover:border-blue-300 hover:text-blue-600'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* 列表 */}
      {loading && page === 1 ? (
        <p className="text-gray-400 text-sm">載入中...</p>
      ) : entries.length === 0 ? (
        <div className="text-center py-20 text-gray-400">
          <p className="text-sm">沒有符合條件的記錄</p>
        </div>
      ) : (
        <div className="space-y-3">
          {entries.map(e => (
            <EntryCard key={e.id} entry={e} onUpdate={handleUpdate} onDelete={handleDelete} />
          ))}

          {hasMore && (
            <button
              onClick={loadMore}
              disabled={loading}
              className="w-full py-3 text-sm text-blue-500 hover:underline disabled:opacity-40"
            >
              {loading ? '載入中...' : '載入更多'}
            </button>
          )}
        </div>
      )}
    </div>
  );
}
