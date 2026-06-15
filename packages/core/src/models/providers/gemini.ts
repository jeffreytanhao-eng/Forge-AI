import { ModelProvider, ModelOption, ChatMessage, ChatOptions, ChatChunk, AgentResponse } from '../provider.js';

export class GeminiProvider implements ModelProvider {
  readonly id = 'gemini';
  readonly name = 'Google Gemini';
  readonly online = true;

  private apiKey: string;

  constructor(apiKey: string = '') {
    this.apiKey = apiKey;
  }

  setApiKey(key: string): void {
    this.apiKey = key;
  }

  async listModels(): Promise<ModelOption[]> {
    return [
      { id: 'gemini-2.5-pro', name: 'Gemini 2.5 Pro', provider: 'gemini', online: true },
      { id: 'gemini-2.5-flash', name: 'Gemini 2.5 Flash', provider: 'gemini', online: true },
      { id: 'gemini-2.0-flash', name: 'Gemini 2.0 Flash', provider: 'gemini', online: true },
    ];
  }

  async *chat(messages: ChatMessage[], options?: ChatOptions): AsyncGenerator<ChatChunk, AgentResponse, unknown> {
    const systemMsg = messages.find(m => m.role === 'system');
    const chatMessages = messages.filter(m => m.role !== 'system');

    const contents = chatMessages.map(m => ({
      role: m.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: m.content }],
    }));

    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${this.apiKey}`;

    const body: any = {
      contents,
      generationConfig: {
        temperature: options?.temperature ?? 0.7,
        maxOutputTokens: options?.maxTokens ?? 4096,
      },
    };

    if (systemMsg) {
      body.systemInstruction = { parts: [{ text: systemMsg.content }] };
    }

    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Gemini API error: ${response.status} ${errorText}`);
    }

    const data = await response.json();
    const content = data.candidates?.[0]?.content?.parts?.[0]?.text || '';

    yield { type: 'delta', text: content, fullText: content };
    const result: AgentResponse = {
      plan: content,
      diffs: [],
      usage: {
        inputTokens: data.usageMetadata?.promptTokenCount || 0,
        outputTokens: data.usageMetadata?.candidatesTokenCount || 0,
        model: 'gemini-2.5-flash',
      },
    };
    yield { type: 'done', result };
    return result;
  }

  async validateConfig(): Promise<boolean> {
    if (!this.apiKey) return false;
    try {
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models?key=${this.apiKey}`
      );
      return response.ok;
    } catch {
      return false;
    }
  }
}