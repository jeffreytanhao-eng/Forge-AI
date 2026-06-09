import Anthropic from '@anthropic-ai/sdk';
import { BaseCodingAgent } from '../base/CodingAgent';
import { AgentContext, AgentResponse, AgentDiff } from '../../types/agent';

/**
 * Claude Agent - 基于 Anthropic 官方 SDK
 * 支持真实流式输出（推荐使用 sendPromptStream）
 */
export class ClaudeAgent extends BaseCodingAgent {
  id = 'claude-3-5-sonnet';
  name = 'Claude 3.5 Sonnet';
  description = 'Anthropic 最强编码模型，适合大型重构与复杂逻辑';
  icon = '🤖';
  supportsStreaming = true;

  private client: Anthropic;

  constructor(apiKey: string) {
    super();
    this.client = new Anthropic({ apiKey });
  }

  /**
   * 非流式版本（兼容旧逻辑）
   */
  async sendPrompt(prompt: string, context: AgentContext): Promise<AgentResponse> {
    const systemPrompt = this.buildSystemPrompt(context);

    const response = await this.client.messages.create({
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: 8192,
      system: systemPrompt,
      messages: [{ role: 'user', content: prompt }],
    });

    const text = response.content[0].type === 'text' ? response.content[0].text : '';
    return this.parseResponse(text);
  }

  /**
   * 真实流式版本（推荐）
   * 使用 Anthropic 官方 streaming 接口
   */
  async *sendPromptStream(prompt: string, context: AgentContext) {
    const systemPrompt = this.buildSystemPrompt(context);

    const stream = this.client.messages.stream({
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: 8192,
      system: systemPrompt,
      messages: [{ role: 'user', content: prompt }],
    });

    let accumulatedText = '';

    try {
      for await (const event of stream) {
        if (event.type === 'content_block_delta' && event.delta.type === 'text_delta') {
          accumulatedText += event.delta.text;

          // 实时 yield 当前累积内容
          yield {
            type: 'delta' as const,
            text: event.delta.text,
            fullText: accumulatedText,
          };
        }
      }

      // 流式结束后，尝试解析最终结果
      const finalResult = this.parseResponse(accumulatedText);

      yield {
        type: 'done' as const,
        result: finalResult,
      };
    } catch (error) {
      console.error('Claude streaming error:', error);
      yield {
        type: 'error' as const,
        error: error instanceof Error ? error.message : 'Unknown streaming error',
      };
    }
  }

  // ==================== 私有方法 ====================

  private buildSystemPrompt(context: AgentContext): string {
    return `你是一个世界级的 Coding Agent。
请严格按照以下 JSON 格式返回（不要添加任何额外文字或解释）：

{
  "plan": "本次修改的简要计划（用中文描述）",
  "diffs": [
    {
      "file": "相对文件路径",
      "content": "完整的新文件代码",
      "description": "本次修改的简要说明"
    }
  ]
}

当前项目知识图谱摘要：
${JSON.stringify(context.knowledgeGraph || {}).slice(0, 5000)}

当前工作区文件列表：
${context.workspaceFiles?.map((f: any) => f.path).join(', ')}`;
  }

  private parseResponse(text: string): AgentResponse {
    // 尝试提取 JSON（支持被 markdown 包裹的情况）
    const jsonMatch = text.match(/```json\s*([\s\S]*?)\s*```/) ||
                      text.match(/\{[\s\S]*"diffs"[\s\S]*\}/);

    if (jsonMatch) {
      try {
        const parsed = JSON.parse(jsonMatch[1] || jsonMatch[0]);
        if (parsed.diffs && Array.isArray(parsed.diffs)) {
          return {
            plan: parsed.plan || 'Claude 已生成修改计划',
            diffs: parsed.diffs as AgentDiff[],
          };
        }
      } catch (e) {
        console.warn('JSON 解析失败，原始内容：', text);
      }
    }

    // 解析失败时的兜底处理
    return {
      plan: text.length > 300 ? text.substring(0, 300) + '...' : text,
      diffs: [],
    };
  }
}
