import { BaseCodingAgent } from './base.js';
import { AgentContext, AgentResponse, AgentDiff } from '../types/index.js';

interface DoubaoMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

interface DoubaoChoice {
  message?: { content: string };
  delta?: { content?: string };
}

interface DoubaoResponse {
  choices: DoubaoChoice[];
  usage?: {
    prompt_tokens: number;
    completion_tokens: number;
  };
}

export class DoubaoAgent extends BaseCodingAgent {
  readonly id = 'doubao';
  readonly name = '豆包大模型';
  readonly description = '字节跳动豆包大模型，性价比高，中文能力强';
  readonly supportsStreaming = true;

  private apiKey: string;
  private model: string;
  private baseURL = 'https://ark.cn-beijing.volces.com/api/v3';

  constructor(apiKey: string, model: string = 'ep-20240606123456-xxxxx') {
    super();
    this.apiKey = apiKey;
    this.model = model; // 你的豆包 Endpoint ID
  }

  async sendPrompt(prompt: string, context: AgentContext): Promise<AgentResponse> {
    const messages = this.buildMessages(prompt, context);

    const response = await fetch(`${this.baseURL}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify({
        model: this.model,
        messages,
        temperature: 0.6,
        max_tokens: 8192,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`豆包 API 调用失败: ${response.status} ${errorText}`);
    }

    const data: DoubaoResponse = await response.json();
    const content = data.choices[0]?.message?.content || '';

    return this.parseResponse(content, data.usage);
  }

  async *sendPromptStream(prompt: string, context: AgentContext) {
    const messages = this.buildMessages(prompt, context);

    const response = await fetch(`${this.baseURL}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify({
        model: this.model,
        messages,
        temperature: 0.6,
        max_tokens: 8192,
        stream: true,
      }),
    });

    if (!response.ok || !response.body) {
      throw new Error(`豆包流式调用失败: ${response.status}`);
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder('utf-8');
    let buffer = '';
    let accumulatedText = '';

    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });

        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const dataStr = line.slice(6);
            if (dataStr === '[DONE]') continue;

            try {
              const data = JSON.parse(dataStr);
              const deltaContent = data.choices?.[0]?.delta?.content;

              if (deltaContent) {
                accumulatedText += deltaContent;
                yield {
                  type: 'delta' as const,
                  text: deltaContent,
                  fullText: accumulatedText,
                };
              }
            } catch {
              // 忽略解析错误
            }
          }
        }
      }

      // 流式结束后解析最终结果
      const finalResult = this.parseResponse(accumulatedText);
      yield {
        type: 'done' as const,
        result: finalResult,
      };
    } finally {
      reader.releaseLock();
    }
  }

  // ==================== 私有方法 ====================

  private buildMessages(prompt: string, context: AgentContext): DoubaoMessage[] {
    const systemPrompt = `你是一个专业的 Vibe Coding Agent。
请严格按照以下 JSON 格式返回（不要添加任何额外文字）：

{
  "plan": "本次修改的简要计划（中文）",
  "diffs": [
    {
      "file": "相对文件路径",
      "content": "完整的新文件代码",
      "description": "修改说明"
    }
  ]
}

当前项目知识图谱摘要：${JSON.stringify(context.knowledgeGraph || {}).slice(0, 4000)}`;

    return [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: prompt },
    ];
  }

  private parseResponse(text: string, usage?: any): AgentResponse {
    const parsed = this.extractJSON(text);

    if (parsed?.diffs && Array.isArray(parsed.diffs)) {
      return {
        plan: parsed.plan || '豆包已生成修改计划',
        diffs: parsed.diffs as AgentDiff[],
        usage: usage
          ? {
              inputTokens: usage.prompt_tokens,
              outputTokens: usage.completion_tokens,
              model: this.model,
            }
          : undefined,
      };
    }

    return {
      plan: text.length > 400 ? text.substring(0, 400) + '...' : text,
      diffs: [],
    };
  }
}
