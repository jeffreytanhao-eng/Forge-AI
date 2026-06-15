import { ModelProvider, ModelOption, ChatMessage, ChatOptions, ChatChunk, AgentResponse } from '../provider.js';

export class OpenAIProvider implements ModelProvider {
  readonly id = 'openai';
  readonly name = 'OpenAI';
  readonly online = true;

  private apiKey: string;
  private baseURL: string;

  constructor(apiKey: string = '', baseURL: string = 'https://api.openai.com/v1') {
    this.apiKey = apiKey;
    this.baseURL = baseURL;
  }

  setApiKey(key: string): void {
    this.apiKey = key;
  }

  setBaseURL(url: string): void {
    this.baseURL = url;
  }

  async listModels(): Promise<ModelOption[]> {
    return [
      { id: 'gpt-4o', name: 'GPT-4o', provider: 'openai', online: true },
      { id: 'gpt-4o-mini', name: 'GPT-4o Mini', provider: 'openai', online: true },
      { id: 'gpt-4-turbo', name: 'GPT-4 Turbo', provider: 'openai', online: true },
    ];
  }

  async *chat(messages: ChatMessage[], options?: ChatOptions): AsyncGenerator<ChatChunk, AgentResponse, unknown> {
    const response = await fetch(`${this.baseURL}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify({
        model: options?.maxTokens ? 'gpt-4o' : 'gpt-4o-mini',
        messages,
        temperature: options?.temperature ?? 0.7,
        max_tokens: options?.maxTokens ?? 4096,
        stream: options?.stream ?? false,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`OpenAI API error: ${response.status} ${errorText}`);
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || '';

    yield { type: 'delta', text: content, fullText: content };
    const result: AgentResponse = {
      plan: content,
      diffs: [],
      usage: {
        inputTokens: data.usage?.prompt_tokens || 0,
        outputTokens: data.usage?.completion_tokens || 0,
        model: data.model,
      },
    };
    yield { type: 'done', result };
    return result;
  }

  async validateConfig(): Promise<boolean> {
    if (!this.apiKey) return false;
    try {
      const response = await fetch(`${this.baseURL}/models`, {
        headers: { 'Authorization': `Bearer ${this.apiKey}` },
      });
      return response.ok;
    } catch {
      return false;
    }
  }
}