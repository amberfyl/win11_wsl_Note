import { Routes, Route, NavLink } from 'react-router-dom';
import TodayPage from './pages/TodayPage.jsx';
import CalendarPage from './pages/CalendarPage.jsx';
import EntriesPage from './pages/EntriesPage.jsx';
import SearchPage from './pages/SearchPage.jsx';
import SettingsPage from './pages/SettingsPage.jsx';

const navItems = [
  { to: '/',          label: '今日' },
  { to: '/calendar',  label: '日曆' },
  { to: '/entries',   label: '記錄' },
  { to: '/search',    label: '搜尋' },
  { to: '/settings',  label: '設定' },
];

export default function App() {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <nav className="bg-white border-b border-gray-200 px-4 py-3 flex gap-6">
        <span className="font-bold text-gray-800 mr-4">MyNote</span>
        {navItems.map(({ to, label }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/'}
            className={({ isActive }) =>
              `text-sm font-medium ${isActive ? 'text-blue-600' : 'text-gray-500 hover:text-gray-800'}`
            }
          >
            {label}
          </NavLink>
        ))}
      </nav>

      <main className="flex-1 max-w-4xl w-full mx-auto px-4 py-8">
        <Routes>
          <Route path="/"          element={<TodayPage />} />
          <Route path="/calendar"  element={<CalendarPage />} />
          <Route path="/entries"   element={<EntriesPage />} />
          <Route path="/search"    element={<SearchPage />} />
          <Route path="/settings"  element={<SettingsPage />} />
        </Routes>
      </main>
    </div>
  );
}
