import { Router } from 'express';
import { searchService } from '../services/search.service.js';

const router = Router();

router.get('/fulltext', (req, res) => {
  const { q, limit } = req.query;
  if (!q) return res.status(400).json({ error: 'q 為必填' });
  res.json(searchService.fulltext(q, { limit: Number(limit) || 20 }));
});

// 第二階段：語意搜尋
router.post('/', async (req, res) => {
  const { query, topK } = req.body;
  if (!query) return res.status(400).json({ error: 'query 為必填' });
  try {
    const results = await searchService.semantic(query, { topK });
    res.json(results);
  } catch (err) {
    res.status(503).json({ error: err.message });
  }
});

// 第二階段：RAG 問答
router.post('/ask', async (req, res) => {
  const { query } = req.body;
  if (!query) return res.status(400).json({ error: 'query 為必填' });
  try {
    const answer = await searchService.ask(query);
    res.json({ answer });
  } catch (err) {
    res.status(503).json({ error: err.message });
  }
});

export default router;
