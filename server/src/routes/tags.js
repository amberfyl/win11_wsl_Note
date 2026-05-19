import { Router } from 'express';
import { tagService } from '../services/tag.service.js';

const router = Router();

router.post('/', (req, res) => {
  const { name, color } = req.body;
  if (!name) return res.status(400).json({ error: 'name 為必填' });
  const tag = tagService.create({ name, color });
  res.status(201).json(tag);
});

router.get('/', (req, res) => {
  res.json(tagService.findAll());
});

router.put('/:id', (req, res) => {
  const { name, color } = req.body;
  res.json(tagService.update(req.params.id, { name, color }));
});

router.delete('/:id', (req, res) => {
  tagService.delete(req.params.id);
  res.status(204).end();
});

// 為記錄加標籤
router.post('/entries/:entryId/tags', (req, res) => {
  const { tagId } = req.body;
  if (!tagId) return res.status(400).json({ error: 'tagId 為必填' });
  tagService.addToEntry(req.params.entryId, tagId);
  res.status(204).end();
});

// 移除記錄的標籤
router.delete('/entries/:entryId/tags/:tagId', (req, res) => {
  tagService.removeFromEntry(req.params.entryId, req.params.tagId);
  res.status(204).end();
});

export default router;
