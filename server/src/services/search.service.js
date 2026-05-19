import db from '../db/db.js';
import { entryService } from './entry.service.js';

export const searchService = {
  // 第一階段：全文關鍵字搜尋
  fulltext(q, { limit = 20 } = {}) {
    return entryService.fulltextSearch(q, { limit });
  },

  // 第二階段佔位：語意搜尋（需要 embedding 支援）
  async semantic(query, { topK = 8 } = {}) {
    throw new Error('語意搜尋尚未啟用，請先完成第二階段設定');
  },

  // 第二階段佔位：RAG 問答
  async ask(query) {
    throw new Error('RAG 問答尚未啟用，請先完成第二階段設定');
  },
};
