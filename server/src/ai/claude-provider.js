import Anthropic from '@anthropic-ai/sdk';
import { AIProvider } from './ai-provider.js';

export class ClaudeProvider extends AIProvider {
  constructor(apiKey) {
    super();
    this.client = new Anthropic({ apiKey });
  }

  async extractMetadata(text) {
    const message = await this.client.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 1024,
      messages: [
        {
          role: 'user',
          content: `從以下日記/筆記內容中萃取結構化資料，以 JSON 格式回傳，不要有其他文字。

格式：
{
  "mood": "happy|calm|anxious|sad|angry|excited 其中一個，或 null",
  "energy_level": 1到10的整數或 null,
  "topics": ["主題1", "主題2"],
  "people": ["人名1", "人名2"],
  "locations": ["地點1", "地點2"],
  "events": ["事件1", "事件2"],
  "summary": "一句話摘要"
}

內容：
${text}`,
        },
      ],
    });

    try {
      return JSON.parse(message.content[0].text);
    } catch {
      return { topics: [], people: [], locations: [], events: [], summary: '' };
    }
  }

  async chat(query, contextDocs) {
    const context = contextDocs
      .map((doc, i) => `[${i + 1}] ${doc.created_at.slice(0, 10)}\n${doc.content}`)
      .join('\n\n---\n\n');

    const message = await this.client.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 2048,
      messages: [
        {
          role: 'user',
          content: `以下是從日誌系統找到的相關記錄：

${context}

根據以上記錄回答問題：${query}

請直接回答，並在回答末尾標注來源的日期（格式：[來源：YYYY/MM/DD]）。`,
        },
      ],
    });

    return message.content[0].text;
  }

  // Embedding 由 Voyage AI 或 OpenAI 負責，這裡不實作
  async generateEmbedding(text) {
    throw new Error('請使用 EmbeddingProvider 產生向量');
  }
}
