import { v4 as uuidv4 } from 'uuid';
import db from '../db/db.js';

export const entryService = {
  create({ type, title, content, status, tags = [] }) {
    const id = uuidv4();
    const now = new Date().toISOString();

    db.prepare(`
      INSERT INTO entries (id, type, title, content, status, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(id, type, title ?? null, content, status ?? null, now, now);

    if (tags.length > 0) {
      const insertTag = db.prepare(
        'INSERT OR IGNORE INTO entry_tags (entry_id, tag_id) VALUES (?, ?)'
      );
      for (const tagId of tags) {
        insertTag.run(id, tagId);
      }
    }

    return this.findById(id);
  },

  findAll({ type, from, to, tag, page = 1, limit = 20 } = {}) {
    let query = `
      SELECT e.*, GROUP_CONCAT(t.name) as tag_names
      FROM entries e
      LEFT JOIN entry_tags et ON e.id = et.entry_id
      LEFT JOIN tags t ON et.tag_id = t.id
      WHERE 1=1
    `;
    const params = [];

    if (type) { query += ' AND e.type = ?'; params.push(type); }
    if (from) { query += ' AND e.created_at >= ?'; params.push(from); }
    if (to)   { query += ' AND e.created_at <= ?'; params.push(to); }
    if (tag)  { query += ' AND t.name = ?'; params.push(tag); }

    query += ' GROUP BY e.id ORDER BY e.created_at DESC LIMIT ? OFFSET ?';
    params.push(limit, (page - 1) * limit);

    return db.prepare(query).all(...params);
  },

  findById(id) {
    const entry = db.prepare('SELECT * FROM entries WHERE id = ?').get(id);
    if (!entry) return null;

    const tags = db.prepare(`
      SELECT t.* FROM tags t
      JOIN entry_tags et ON t.id = et.tag_id
      WHERE et.entry_id = ?
    `).all(id);

    const metadata = db.prepare(
      'SELECT * FROM entry_metadata WHERE entry_id = ?'
    ).get(id);

    return { ...entry, tags, metadata: metadata ?? null };
  },

  update(id, { title, content, status, is_pinned }) {
    const now = new Date().toISOString();
    const fields = [];
    const params = [];

    if (title !== undefined)    { fields.push('title = ?');     params.push(title); }
    if (content !== undefined)  { fields.push('content = ?');   params.push(content); }
    if (status !== undefined)   { fields.push('status = ?');    params.push(status); }
    if (is_pinned !== undefined){ fields.push('is_pinned = ?'); params.push(is_pinned ? 1 : 0); }

    if (fields.length === 0) return this.findById(id);

    fields.push('updated_at = ?');
    params.push(now, id);

    db.prepare(`UPDATE entries SET ${fields.join(', ')} WHERE id = ?`).run(...params);
    return this.findById(id);
  },

  delete(id) {
    db.prepare('DELETE FROM entries WHERE id = ?').run(id);
  },

  fulltextSearch(q, { limit = 20 } = {}) {
    const like = `%${q}%`;
    return db.prepare(`
      SELECT * FROM entries
      WHERE content LIKE ? OR title LIKE ?
      ORDER BY created_at DESC
      LIMIT ?
    `).all(like, like, limit);
  },
};
