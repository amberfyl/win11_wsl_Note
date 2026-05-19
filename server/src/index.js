import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import entriesRouter from './routes/entries.js';
import tagsRouter from './routes/tags.js';
import searchRouter from './routes/search.js';
import importExportRouter from './routes/import-export.js';

const app = express();
const PORT = process.env.PORT ?? 3001;

app.use(cors({ origin: process.env.CLIENT_URL ?? 'http://localhost:5173' }));
app.use(express.json());

app.use('/api/entries', entriesRouter);
app.use('/api/tags', tagsRouter);
app.use('/api/search', searchRouter);
app.use('/api', importExportRouter);

app.get('/api/health', (req, res) => res.json({ status: 'ok' }));

app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ error: '伺服器錯誤' });
});

app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));
