import { useState } from 'react';
import { searchApi } from '../services/api.js';
import EntryCard from '../components/EntryCard.jsx';

export default function SearchPage() {
  const [query, setQuery]     = useState('');
  const [results, setResults] = useState([]);
  const [searched, setSearched] = useState(false);
  const [loading, setLoading]   = useState(false);

  async function handleSearch(e) {
    e.preventDefault();
    const q = query.trim();
    if (!q) return;
    setLoading(true);
    setSearched(true);
    try {
      const data = await searchApi.fulltext(q, 50);
      setResults(data);
    } finally {
      setLoading(false);
    }
  }

  function handleUpdate(updated) {
    setResults(prev => prev.map(e => e.id === updated.id ? updated : e));
  }

  function handleDelete(id) {
    setResults(prev => prev.filter(e => e.id !== id));
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-800">搜尋</h1>

      <form onSubmit={handleSearch} className="flex gap-2">
        <input
          type="text"
          value={query}
          onChange={e => setQuery(e.target.value)}
          placeholder="搜尋記錄內容或標題..."
          className="flex-1 border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300 focus:border-transparent transition-shadow"
        />
        <button
          type="submit"
          disabled={loading || !query.trim()}
          className="px-5 py-2.5 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 disabled:opacity-40 transition-colors"
        >
          {loading ? '搜尋中...' : '搜尋'}
        </button>
      </form>

      {searched && !loading && (
        results.length === 0 ? (
          <div className="text-center py-16 text-gray-400">
            <p className="text-sm">沒有找到符合「{query}」的記錄</p>
          </div>
        ) : (
          <div className="space-y-3">
            <p className="text-xs text-gray-400">找到 {results.length} 筆結果</p>
            {results.map(e => (
              <EntryCard key={e.id} entry={e} onUpdate={handleUpdate} onDelete={handleDelete} />
            ))}
          </div>
        )
      )}

      {!searched && (
        <div className="text-center py-16 text-gray-300">
          <p className="text-4xl mb-3">🔍</p>
          <p className="text-sm">輸入關鍵字搜尋所有記錄</p>
        </div>
      )}
    </div>
  );
}
