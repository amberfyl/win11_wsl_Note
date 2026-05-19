import { useState, useEffect, useMemo } from 'react';
import { entriesApi } from '../services/api.js';
import EntryCard from '../components/EntryCard.jsx';

const WEEKDAYS = ['日', '一', '二', '三', '四', '五', '六'];

function pad(n) { return String(n).padStart(2, '0'); }

function monthRange(year, month) {
  const from = new Date(year, month, 1).toISOString();
  const to   = new Date(year, month + 1, 1).toISOString();
  return { from, to };
}

function formatMonthYear(year, month) {
  return new Date(year, month, 1).toLocaleDateString('zh-TW', {
    year: 'numeric', month: 'long',
  });
}

export default function CalendarPage() {
  const today   = new Date();
  const todayStr = `${today.getFullYear()}-${pad(today.getMonth() + 1)}-${pad(today.getDate())}`;

  const [year, setYear]             = useState(today.getFullYear());
  const [month, setMonth]           = useState(today.getMonth());
  const [allEntries, setAllEntries] = useState([]);
  const [selectedDate, setSelected] = useState(null);

  useEffect(() => {
    const { from, to } = monthRange(year, month);
    entriesApi.list({ from, to, limit: 500 }).then(setAllEntries);
  }, [year, month]);

  // 日期 -> entry[] 的 map
  const entryMap = useMemo(() => {
    const map = {};
    for (const e of allEntries) {
      const d = e.created_at.slice(0, 10);
      (map[d] ??= []).push(e);
    }
    return map;
  }, [allEntries]);

  // 日曆格子（null = 空白補位）
  const calDays = useMemo(() => {
    const firstWeekday  = new Date(year, month, 1).getDay();
    const daysInMonth   = new Date(year, month + 1, 0).getDate();
    return [
      ...Array(firstWeekday).fill(null),
      ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
    ];
  }, [year, month]);

  function prevMonth() {
    setSelected(null);
    if (month === 0) { setYear(y => y - 1); setMonth(11); }
    else setMonth(m => m - 1);
  }

  function nextMonth() {
    setSelected(null);
    if (month === 11) { setYear(y => y + 1); setMonth(0); }
    else setMonth(m => m + 1);
  }

  function toggleDate(d) {
    const dateStr = `${year}-${pad(month + 1)}-${pad(d)}`;
    setSelected(prev => prev === dateStr ? null : dateStr);
  }

  function handleUpdate(updated) {
    setAllEntries(prev => prev.map(e => e.id === updated.id ? updated : e));
  }

  function handleDelete(id) {
    setAllEntries(prev => prev.filter(e => e.id !== id));
  }

  const selectedEntries = selectedDate ? (entryMap[selectedDate] ?? []) : [];

  return (
    <div className="space-y-6">
      {/* 標題 + 月份導航 */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-800">日曆</h1>
        <div className="flex items-center gap-3">
          <button
            onClick={prevMonth}
            className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 text-gray-600 text-lg leading-none"
          >
            ‹
          </button>
          <span className="text-sm font-semibold text-gray-700 w-28 text-center">
            {formatMonthYear(year, month)}
          </span>
          <button
            onClick={nextMonth}
            className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 text-gray-600 text-lg leading-none"
          >
            ›
          </button>
        </div>
      </div>

      {/* 月曆 */}
      <div className="bg-white rounded-xl border border-gray-200 p-4">
        {/* 星期標頭 */}
        <div className="grid grid-cols-7 mb-1">
          {WEEKDAYS.map(w => (
            <div key={w} className="text-center text-xs font-medium text-gray-400 py-2">
              {w}
            </div>
          ))}
        </div>

        {/* 日期格子 */}
        <div className="grid grid-cols-7 gap-1">
          {calDays.map((d, i) => {
            if (d === null) return <div key={`empty-${i}`} />;
            const dateStr    = `${year}-${pad(month + 1)}-${pad(d)}`;
            const hasEntries = !!entryMap[dateStr];
            const isToday    = dateStr === todayStr;
            const isSelected = dateStr === selectedDate;

            return (
              <button
                key={d}
                onClick={() => toggleDate(d)}
                className={`relative flex flex-col items-center py-2 rounded-lg text-sm font-medium transition-colors ${
                  isSelected
                    ? 'bg-blue-600 text-white'
                    : isToday
                      ? 'bg-blue-50 text-blue-700'
                      : 'text-gray-700 hover:bg-gray-50'
                }`}
              >
                {d}
                {hasEntries && (
                  <span className={`w-1.5 h-1.5 rounded-full mt-0.5 ${
                    isSelected ? 'bg-white' : 'bg-blue-400'
                  }`} />
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* 選取日期的記錄 */}
      {selectedDate && (
        <section>
          <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-3">
            {selectedDate}
            <span className="ml-2 normal-case tracking-normal text-gray-400">
              {selectedEntries.length > 0 ? `${selectedEntries.length} 筆記錄` : '無記錄'}
            </span>
          </h2>

          {selectedEntries.length === 0 ? (
            <p className="text-sm text-gray-300 text-center py-6">這天沒有記錄</p>
          ) : (
            <div className="space-y-3">
              {selectedEntries.map(e => (
                <EntryCard key={e.id} entry={e} onUpdate={handleUpdate} onDelete={handleDelete} />
              ))}
            </div>
          )}
        </section>
      )}
    </div>
  );
}
