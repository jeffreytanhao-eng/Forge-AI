import { ModelProvider, ModelOption, ChatMessage, ChatOptions, ChatChunk, AgentResponse } from '../provider.js';

export class AnthropicProvider implements ModelProvider {
  readonly id = 'anthropic';
  readonly name = 'Anthropic Claude';
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
      { id: 'claude-3-5-sonnet-20241022', name: 'Claude 3.5 Sonnet', provider: 'anthropic', online: true },
      { id: 'claude-3-5-haiku-20241022', name: 'Claude 3.5 Haiku', provider: 'anthropic', online: true },
      { id: 'claude-opus-4-20250514', name: 'Claude Opus 4', provider: 'anthropic', online: true },
    ];
  }

  async *chat(messages: ChatMessage[], options?: ChatOptions): AsyncGenerator<ChatChunk, AgentResponse, unknown> {
    const systemMsg = messages.find(m => m.role === 'system');
    const chatMessages = messages.filter(m => m.role !== 'system');

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': this.apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-3-5-sonnet-20241022',
        max_tokens: options?.maxTokens ?? 4096,
        system: systemMsg?.content,
        messages: chatMessages,
        temperature: options?.temperature ?? 0.7,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Anthropic API error: ${response.status} ${errorText}`);
    }

    const data = await response.json();
    const content = data.content?.[0]?.text || '';

    yield { type: 'delta', text: content, fullText: content };
    const result: AgentResponse = {
      plan: content,
      diffs: [],
      usage: {
        inputTokens: data.usage?.input_tokens || 0,
        outputTokens: data.usage?.output_tokens || 0,
        model: data.model,
      },
    };
    yield { type: 'done', result };
    return result;
  }

  async validateConfig(): Promise<boolean> {
    if (!this.apiKey) return false;
    try {
      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': this.apiKey,
          'anthropic-version': '2023-06-01',
        },
        body: JSON.stringify({
          model: 'claude-3-5-haiku-20241022',
          max_tokens: 1,
          messages: [{ role: 'user', content: 'ping' }],
        }),
      });
      return response.ok;
    } catch {
      return false;
    }
  }
}