import axios from 'axios';

const api = axios.create({ baseURL: '/api' });

export const entriesApi = {
  list: (params) => api.get('/entries', { params }).then(r => r.data),
  get: (id) => api.get(`/entries/${id}`).then(r => r.data),
  create: (data) => api.post('/entries', data).then(r => r.data),
  update: (id, data) => api.put(`/entries/${id}`, data).then(r => r.data),
  delete: (id) => api.delete(`/entries/${id}`),
};

export const tagsApi = {
  list: () => api.get('/tags').then(r => r.data),
  create: (data) => api.post('/tags', data).then(r => r.data),
  update: (id, data) => api.put(`/tags/${id}`, data).then(r => r.data),
  delete: (id) => api.delete(`/tags/${id}`),
  addToEntry: (entryId, tagId) => api.post(`/tags/entries/${entryId}/tags`, { tagId }),
  removeFromEntry: (entryId, tagId) => api.delete(`/tags/entries/${entryId}/tags/${tagId}`),
};

export const searchApi = {
  fulltext: (q, limit) => api.get('/search/fulltext', { params: { q, limit } }).then(r => r.data),
  semantic: (query, topK) => api.post('/search', { query, topK }).then(r => r.data),
  ask: (query) => api.post('/search/ask', { query }).then(r => r.data),
};

export const importExportApi = {
  importEvernote: (file) => {
    const form = new FormData();
    form.append('file', file);
    return api.post('/import/evernote', form).then(r => r.data);
  },
  exportEvernote: () => {
    window.open('/api/export/evernote', '_blank');
  },
  exportMarkdown: ({ from, to, type } = {}) => {
    const params = new URLSearchParams();
    if (from) params.set('from', from);
    if (to)   params.set('to',   to);
    if (type) params.set('type', type);
    const qs = params.toString();
    window.open(`/api/export/markdown${qs ? '?' + qs : ''}`, '_blank');
  },
};
