import { ModelProvider, ModelOption, ChatMessage, ChatOptions, ChatChunk, AgentResponse } from '../provider.js';

export class OllamaProvider implements ModelProvider {
  readonly id = 'ollama';
  readonly name = 'Ollama (本地)';
  readonly online = false;

  private baseURL: string;

  constructor(baseURL: string = 'http://localhost:11434') {
    this.baseURL = baseURL;
  }

  setBaseURL(url: string): void {
    this.baseURL = url;
  }

  async listModels(): Promise<ModelOption[]> {
    try {
      const response = await fetch(`${this.baseURL}/api/tags`);
      if (!response.ok) return this.getDefaultModels();
      const data = await response.json();
      return (data.models || []).map((m: any) => ({
        id: m.name,
        name: m.name,
        provider: 'ollama',
        online: false,
      }));
    } catch {
      return this.getDefaultModels();
    }
  }

  private getDefaultModels(): ModelOption[] {
    return [
      { id: 'llama3', name: 'Llama 3', provider: 'ollama', online: false },
      { id: 'codellama', name: 'Code Llama', provider: 'ollama', online: false },
      { id: 'qwen2.5-coder', name: 'Qwen 2.5 Coder', provider: 'ollama', online: false },
      { id: 'deepseek-coder', name: 'DeepSeek Coder', provider: 'ollama', online: false },
    ];
  }

  async *chat(messages: ChatMessage[], options?: ChatOptions): AsyncGenerator<ChatChunk, AgentResponse, unknown> {
    const response = await fetch(`${this.baseURL}/v1/chat/completions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: options?.maxTokens ? 'llama3' : 'codellama',
        messages,
        temperature: options?.temperature ?? 0.7,
        max_tokens: options?.maxTokens ?? 4096,
        stream: false,
      }),
    });

    if (!response.ok) {
      throw new Error(`Ollama API error: ${response.status}`);
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
    try {
      const response = await fetch(`${this.baseURL}/api/tags`);
      return response.ok;
    } catch {
      return false;
    }
  }
}