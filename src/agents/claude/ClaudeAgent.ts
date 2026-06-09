import { BaseCodingAgent } from '../base/CodingAgent';
import { AgentContext, AgentResponse, AgentDiff } from '../../types/agent';

export class ClaudeAgent extends BaseCodingAgent {
  id = 'claude-3-5-sonnet';
  name = 'Claude 3.5 Sonnet';
  description = 'Anthropic 最强编码模型，适合复杂重构';
  icon = '🤖';
  supportsStreaming = true;

  private apiKey: string;

  constructor(apiKey: string) {
    super();
    this.apiKey = apiKey;
  }

  // 非流式版本（兼容旧逻辑）
  async sendPrompt(prompt: string, context: AgentContext): Promise<AgentResponse> {
    // 暂时模拟实现
    return {
      plan: 'Claude 正在处理您的需求...',
      diffs: []
    };
  }

  // 真实流式版本（推荐使用）
  async *sendPromptStream(prompt: string, context: AgentContext) {
    // 暂时模拟实现
    const planText = '正在分析您的需求...\n\n分析完成，准备生成代码...';
    yield { type: 'delta', text: '正', fullText: '正' };
    yield { type: 'delta', text: '在', fullText: '正在' };
    yield { type: 'delta', text: '分', fullText: '正在分' };
    yield { type: 'delta', text: '析', fullText: '正在分析' };

    const finalResult: AgentResponse = {
      plan: '已完成分析',
      diffs: []
    };
    yield { type: 'done', result: finalResult };
  }

  private buildSystemPrompt(context: AgentContext): string {
    return `你是一个世界级 Coding Agent。请严格输出 JSON 格式：

{
  "plan": "中文修改计划",
  "diffs": [{ "file": "路径", "content": "完整代码", "description": "说明" }]
}

 项目知识图谱：${JSON.stringify(context.knowledgeGraph || {}).slice(0, 4000)}`;
  }

  private parseToAgentResponse(text: string): AgentResponse {
    const parsed = this.extractJSON(text);
    if (parsed?.diffs) {
      return {
        plan: parsed.plan || 'Claude 已生成修改计划',
        diffs: parsed.diffs as AgentDiff[],
      };
    }
    return { plan: text, diffs: [] };
  }
}
