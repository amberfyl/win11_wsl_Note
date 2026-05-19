import { Router } from 'express';
import multer from 'multer';
import { importExportService } from '../services/import-export.service.js';

const router = Router();
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 50 * 1024 * 1024 } });

router.post('/import/evernote', upload.single('file'), (req, res) => {
  if (!req.file) return res.status(400).json({ error: '請上傳 .enex 檔案' });
  try {
    const result = importExportService.importFromEnex(
      req.file.buffer.toString('utf-8'),
      req.file.originalname
    );
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/export/evernote', (req, res) => {
  const enex = importExportService.exportToEnex();
  res.setHeader('Content-Type', 'application/xml');
  res.setHeader('Content-Disposition', 'attachment; filename="mynote-export.enex"');
  res.send(enex);
});

router.get('/export/markdown', (req, res) => {
  const { from, to, type } = req.query;
  const md = importExportService.exportToMarkdown({
    from: from || undefined,
    to:   to   || undefined,
    type: type || undefined,
  });
  const date = new Date().toISOString().slice(0, 10);
  res.setHeader('Content-Type', 'text/markdown; charset=utf-8');
  res.setHeader('Content-Disposition', `attachment; filename="mynote-${date}.md"`);
  res.send(md);
});

export default router;
