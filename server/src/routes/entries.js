import { Router } from 'express';
import { entryService } from '../services/entry.service.js';

const router = Router();

router.post('/', (req, res) => {
  const { type, title, content, status, tags } = req.body;
  if (!type || !content) return res.status(400).json({ error: 'type 和 content 為必填' });
  const entry = entryService.create({ type, title, content, status, tags });
  res.status(201).json(entry);
});

router.get('/', (req, res) => {
  const { type, from, to, tag, page, limit } = req.query;
  const entries = entryService.findAll({ type, from, to, tag, page: Number(page) || 1, limit: Number(limit) || 20 });
  res.json(entries);
});

router.get('/:id', (req, res) => {
  const entry = entryService.findById(req.params.id);
  if (!entry) return res.status(404).json({ error: '找不到記錄' });
  res.json(entry);
});

router.put('/:id', (req, res) => {
  const { title, content, status, is_pinned } = req.body;
  const entry = entryService.update(req.params.id, { title, content, status, is_pinned });
  if (!entry) return res.status(404).json({ error: '找不到記錄' });
  res.json(entry);
});

router.delete('/:id', (req, res) => {
  entryService.delete(req.params.id);
  res.status(204).end();
});

export default router;
