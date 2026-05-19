import { v4 as uuidv4 } from 'uuid';
import db from '../db/db.js';

export const tagService = {
  create({ name, color = '#6B7280' }) {
    const id = uuidv4();
    db.prepare('INSERT INTO tags (id, name, color) VALUES (?, ?, ?)').run(id, name, color);
    return db.prepare('SELECT * FROM tags WHERE id = ?').get(id);
  },

  findAll() {
    return db.prepare('SELECT * FROM tags ORDER BY name').all();
  },

  update(id, { name, color }) {
    const fields = [];
    const params = [];
    if (name  !== undefined) { fields.push('name = ?');  params.push(name); }
    if (color !== undefined) { fields.push('color = ?'); params.push(color); }
    if (fields.length === 0) return db.prepare('SELECT * FROM tags WHERE id = ?').get(id);
    params.push(id);
    db.prepare(`UPDATE tags SET ${fields.join(', ')} WHERE id = ?`).run(...params);
    return db.prepare('SELECT * FROM tags WHERE id = ?').get(id);
  },

  delete(id) {
    db.prepare('DELETE FROM tags WHERE id = ?').run(id);
  },

  addToEntry(entryId, tagId) {
    db.prepare('INSERT OR IGNORE INTO entry_tags (entry_id, tag_id) VALUES (?, ?)').run(entryId, tagId);
  },

  removeFromEntry(entryId, tagId) {
    db.prepare('DELETE FROM entry_tags WHERE entry_id = ? AND tag_id = ?').run(entryId, tagId);
  },
};
