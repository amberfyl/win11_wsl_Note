import { useState, useEffect } from 'react';
import { entriesApi } from '../services/api.js';
import EntryForm from '../components/EntryForm.jsx';
import EntryCard from '../components/EntryCard.jsx';

function todayRange() {
  const now  = new Date();
  const from = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();
  const to   = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1).toISOString();
  return { from, to };
}

function formatToday() {
  return new Date().toLocaleDateString('zh-TW', {
    year: 'numeric', month: 'long', day: 'numeric', weekday: 'short',
  });
}

export default function TodayPage() {
  const [entries, setEntries]   = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading]   = useState(true);

  useEffect(() => {
    const { from, to } = todayRange();
    entriesApi.list({ from, to, limit: 200 })
      .then(setEntries)
      .finally(() => setLoading(false));
  }, []);

  function handleSave(entry) {
    setEntries(prev => [entry, ...prev]);
    setShowForm(false);
  }

  function handleUpdate(updated) {
    setEntries(prev => prev.map(e => e.id === updated.id ? updated : e));
  }

  function handleDelete(id) {
    setEntries(prev => prev.filter(e => e.id !== id));
  }

  const todos   = entries.filter(e => e.type === 'todo');
  const others  = entries.filter(e => e.type !== 'todo');
  const pending = todos.filter(e => e.status !== 'done');
  const done    = todos.filter(e => e.status === 'done');

  return (
    <div className="space-y-6">
      {/* 標題列 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">今日</h1>
          <p className="text-sm text-gray-400 mt-0.5">{formatToday()}</p>
        </div>
        {!showForm && (
          <button
            onClick={() => setShowForm(true)}
            className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
          >
            ＋ 新增
          </button>
        )}
      </div>

      {/* 新增表單 */}
      {showForm && (
        <EntryForm onSave={handleSave} onCancel={() => setShowForm(false)} />
      )}

      {loading ? (
        <p className="text-gray-400 text-sm">載入中...</p>
      ) : (
        <>
          {/* 待辦區塊 */}
          {todos.length > 0 && (
            <section>
              <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-3">
                待辦事項
                {pending.length > 0 && (
                  <span className="ml-2 text-blue-500 normal-case tracking-normal">
                    {pending.length} 項未完成
                  </span>
                )}
              </h2>
              <div className="space-y-2">
                {pending.map(e => (
                  <EntryCard key={e.id} entry={e} onUpdate={handleUpdate} onDelete={handleDelete} />
                ))}
                {done.map(e => (
                  <EntryCard key={e.id} entry={e} onUpdate={handleUpdate} onDelete={handleDelete} />
                ))}
              </div>
            </section>
          )}

          {/* 其他記錄 */}
          {others.length > 0 && (
            <section>
              <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-3">
                今日記錄
                <span className="ml-2 text-gray-400 normal-case tracking-normal">
                  {others.length} 筆
                </span>
              </h2>
              <div className="space-y-3">
                {others.map(e => (
                  <EntryCard key={e.id} entry={e} onUpdate={handleUpdate} onDelete={handleDelete} />
                ))}
              </div>
            </section>
          )}

          {/* 空白提示 */}
          {entries.length === 0 && !showForm && (
            <div className="text-center py-20 text-gray-400">
              <p className="text-5xl mb-4">📝</p>
              <p className="text-sm">今天還沒有任何記錄</p>
              <button
                onClick={() => setShowForm(true)}
                className="mt-3 text-sm text-blue-500 hover:underline"
              >
                開始寫第一筆
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
