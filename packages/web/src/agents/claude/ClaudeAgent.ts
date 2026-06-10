import { BaseCodingAgent } from '../base/CodingAgent';
import { AgentContext, AgentResponse, AgentDiff } from '@forge-ai/core';

export class ClaudeAgent extends BaseCodingAgent {
  id = 'claude-3-5-sonnet';
  name = 'Claude 3.5 Sonnet';
  description = 'Anthropic 最强编码模型，适合大型重构与复杂逻辑';
  icon = '🤖';
  supportsStreaming = true;

  private apiKey: string;

  constructor(apiKey: string) {
    super();
    this.apiKey = apiKey;
  }

  private buildSystemPrompt(context: AgentContext): string {
    return `你是一个世界级的 Coding Agent。请严格按照以下 JSON 格式返回：

{
  "plan": "本次修改的简要计划（用中文描述）",
  "diffs": [{ "file": "相对文件路径", "content": "完整的新文件代码", "description": "简要说明" }]
}

当前项目知识图谱：${JSON.stringify(context.knowledgeGraph || {}).slice(0, 5000)}`;
  }

  async sendPrompt(prompt: string, context: AgentContext): Promise<AgentResponse> {
    const systemPrompt = this.buildSystemPrompt(context);

    try {
      const response = await fetch('/api/anthropic', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'claude-3-5-sonnet-20241022',
          maxTokens: 8192,
          systemPrompt,
          prompt,
          apiKey: this.apiKey
        })
      });

      if (!response.ok) throw new Error(`API request failed: ${response.status}`);
      const result = await response.json();
      
      return {
        plan: result.plan || 'Claude 已生成修改计划',
        diffs: result.diffs || []
      };
    } catch (error) {
      console.error('ClaudeAgent 执行失败:', error);
      throw new Error('Claude Agent 调用失败');
    }
  }

  async *sendPromptStream(prompt: string, context: AgentContext) {
    try {
      const result = await this.sendPrompt(prompt, context);
      const fullText = result.plan || '正在生成计划...';
      let accumulatedText = '';

      for (let i = 0; i < fullText.length; i++) {
        accumulatedText += fullText[i];
        yield { type: 'delta' as const, text: fullText[i], fullText: accumulatedText };
        await new Promise(r => setTimeout(r, 30));
      }

      yield { type: 'done' as const, result };
    } catch (error) {
      yield {
        type: 'error' as const,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }
}
