import { importExportApi } from '../services/api.js';

export default function SettingsPage() {
  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-bold text-gray-800">設定</h1>

      {/* 匯出區塊 */}
      <section className="bg-white rounded-xl border border-gray-200 p-6 space-y-4">
        <h2 className="font-semibold text-gray-700">匯出記錄</h2>

        <div className="space-y-3">
          {/* 匯出全部 */}
          <div className="flex items-center justify-between py-3 border-b border-gray-100">
            <div>
              <p className="text-sm font-medium text-gray-700">匯出全部記錄（Markdown）</p>
              <p className="text-xs text-gray-400 mt-0.5">適合丟給 NotebookLM 分析，格式為 .md</p>
            </div>
            <button
              onClick={() => importExportApi.exportMarkdown()}
              className="px-4 py-2 text-sm font-medium bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              下載 .md
            </button>
          </div>

          {/* 只匯出日記 */}
          <div className="flex items-center justify-between py-3 border-b border-gray-100">
            <div>
              <p className="text-sm font-medium text-gray-700">只匯出日記</p>
              <p className="text-xs text-gray-400 mt-0.5">type = journal</p>
            </div>
            <button
              onClick={() => importExportApi.exportMarkdown({ type: 'journal' })}
              className="px-4 py-2 text-sm font-medium border border-gray-200 text-gray-600 rounded-lg hover:border-blue-300 hover:text-blue-600 transition-colors"
            >
              下載 .md
            </button>
          </div>

          {/* 只匯出隨手記 */}
          <div className="flex items-center justify-between py-3">
            <div>
              <p className="text-sm font-medium text-gray-700">只匯出隨手記</p>
              <p className="text-xs text-gray-400 mt-0.5">type = idea</p>
            </div>
            <button
              onClick={() => importExportApi.exportMarkdown({ type: 'idea' })}
              className="px-4 py-2 text-sm font-medium border border-gray-200 text-gray-600 rounded-lg hover:border-blue-300 hover:text-blue-600 transition-colors"
            >
              下載 .md
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}
