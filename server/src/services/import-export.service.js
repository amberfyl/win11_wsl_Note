import { v4 as uuidv4 } from 'uuid';
import db from '../db/db.js';
import { entryService } from './entry.service.js';

export const importExportService = {
  // 解析 Evernote .enex XML 格式
  parseEnex(xmlString) {
    // 簡易 XML 解析，後續可換成 xml2js 或 fast-xml-parser
    const noteRegex = /<note>([\s\S]*?)<\/note>/g;
    const entries = [];
    let match;

    while ((match = noteRegex.exec(xmlString)) !== null) {
      const noteXml = match[1];

      const title = this._extractTag(noteXml, 'title') ?? '';
      const content = this._extractEnContent(noteXml);
      const created = this._parseEnDate(this._extractTag(noteXml, 'created'));
      const tags = this._extractAllTags(noteXml, 'tag');

      entries.push({ title, content, created, tags });
    }

    return entries;
  },

  importFromEnex(xmlString, fileName) {
    const parsed = this.parseEnex(xmlString);
    const historyId = uuidv4();
    let count = 0;

    const insertMany = db.transaction(() => {
      for (const note of parsed) {
        const id = uuidv4();
        const now = note.created ?? new Date().toISOString();

        db.prepare(`
          INSERT INTO entries (id, type, title, content, source, created_at, updated_at)
          VALUES (?, 'idea', ?, ?, 'manual', ?, ?)
        `).run(id, note.title, note.content, now, now);

        count++;
      }

      db.prepare(`
        INSERT INTO import_history (id, source, file_name, entry_count)
        VALUES (?, 'evernote', ?, ?)
      `).run(historyId, fileName, count);
    });

    insertMany();
    return { imported: count, historyId };
  },

  exportToMarkdown({ from, to, type } = {}) {
    const entries = entryService.findAll({ from, to, type, limit: 10000 });

    const TYPE_LABEL = { journal: '日記', idea: '隨手記', todo: '待辦', voice_memo: '語音備忘' };
    const STATUS_PREFIX = { done: '✅ ', cancelled: '~~', pending: '' };

    const sections = entries.map(e => {
      const dt = new Date(e.created_at).toLocaleString('zh-TW', {
        year: 'numeric', month: '2-digit', day: '2-digit',
        hour: '2-digit', minute: '2-digit', hour12: false,
      });
      const typeLabel = TYPE_LABEL[e.type] ?? e.type;
      const prefix    = e.type === 'todo' ? (STATUS_PREFIX[e.status] ?? '') : '';
      const tags      = e.tag_names ? `\n標籤：${e.tag_names.split(',').map(t => `\`${t}\``).join(' ')}` : '';

      const titleLine = e.title ? `\n\n**${e.title}**` : '';
      const body      = e.type === 'todo' && e.status === 'cancelled'
        ? `~~${e.content}~~`
        : `${prefix}${e.content}`;

      return `## ${dt}　${typeLabel}${titleLine}\n\n${body}${tags}`;
    });

    const header = `# MyNote 匯出紀錄\n\n> 匯出時間：${new Date().toLocaleString('zh-TW')}  \n> 共 ${entries.length} 筆記錄\n`;
    return header + '\n---\n\n' + sections.join('\n\n---\n\n');
  },

  exportToEnex(entryIds) {
    const entries = entryIds
      ? entryIds.map(id => entryService.findById(id)).filter(Boolean)
      : entryService.findAll({ limit: 10000 });

    const noteXmls = entries.map(e => `
  <note>
    <title><![CDATA[${e.title ?? e.created_at.slice(0, 10)}]]></title>
    <content><![CDATA[<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE en-note SYSTEM "http://xml.evernote.com/pub/enml2.dtd">
<en-note>${e.content.replace(/&/g, '&amp;')}</en-note>
    ]]></content>
    <created>${e.created_at.replace(/[-:]/g, '').replace('T', 'T').slice(0, 15)}Z</created>
    ${(e.tags ?? []).map(t => `<tag>${t.name}</tag>`).join('\n    ')}
  </note>`).join('\n');

    return `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE en-export SYSTEM "http://xml.evernote.com/pub/evernote-export3.dtd">
<en-export export-date="${new Date().toISOString()}" application="MyNote" version="1.0">
${noteXmls}
</en-export>`;
  },

  _extractTag(xml, tag) {
    const m = xml.match(new RegExp(`<${tag}[^>]*><!\\[CDATA\\[([\\s\\S]*?)\\]\\]><\\/${tag}>|<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`));
    return m ? (m[1] ?? m[2]) : null;
  },

  _extractAllTags(xml, tag) {
    const regex = new RegExp(`<${tag}[^>]*><!\\[CDATA\\[([\\s\\S]*?)\\]\\]><\\/${tag}>|<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`, 'g');
    const results = [];
    let m;
    while ((m = regex.exec(xml)) !== null) results.push(m[1] ?? m[2]);
    return results;
  },

  _extractEnContent(xml) {
    const raw = this._extractTag(xml, 'content') ?? '';
    // 移除 ENML 標籤，保留純文字
    return raw.replace(/<[^>]+>/g, '').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').trim();
  },

  _parseEnDate(str) {
    if (!str) return null;
    // Evernote 格式：20260518T223000Z
    const m = str.match(/^(\d{4})(\d{2})(\d{2})T(\d{2})(\d{2})(\d{2})Z$/);
    if (!m) return null;
    return `${m[1]}-${m[2]}-${m[3]}T${m[4]}:${m[5]}:${m[6]}Z`;
  },
};
