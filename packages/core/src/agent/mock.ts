import { BaseCodingAgent } from './base.js';
import { AgentResponse, AgentContext } from '../types/index.js';

export class MockAgent extends BaseCodingAgent {
  readonly id = 'mock';
  readonly name = 'Mock Agent';
  readonly description = 'Mock Agent for testing';
  readonly supportsStreaming = true;
  icon = '🧪';

  async sendPrompt(prompt: string, context: AgentContext = {}): Promise<AgentResponse> {
    this.status = 'running';
    await new Promise(resolve => setTimeout(resolve, 1000));

    let plan = `这是一个 Mock 响应，您的提示是：${prompt}`;

    if (context.workspaceFiles && context.workspaceFiles.length > 0) {
      plan += `\n\n上下文文件：\n${context.workspaceFiles.map(f => `- ${f.path}`).join('\n')}`;
    }

    if (context.knowledgeGraph) {
      const kg = context.knowledgeGraph;
      plan += `\n\n知识图谱 (knowledgeGraph)：\n节点数：${kg.nodeCount}\n`;
      if (kg.nodes) {
        plan += `节点：${kg.nodes.map((n: any) => n.id).join(', ')}`;
      }
    }

    plan += `\n\n我将创建一个示例文件。`;

    let diffsContent = `Hello from Mock Agent!\n\n提示词：${prompt}\n`;
    if (context.workspaceFiles && context.workspaceFiles.length > 0) {
      diffsContent += `\n文件列表：\n${context.workspaceFiles.map(f => `- ${f.path}: ${f.content || ''}`).join('\n')}`;
    }

    this.status = 'idle';
    return {
      plan,
      diffs: [
        {
          file: 'example.txt',
          content: diffsContent,
          description: '创建示例文件'
        }
      ],
      usage: {
        inputTokens: prompt.length + JSON.stringify(context).length,
        outputTokens: plan.length + diffsContent.length,
        model: 'mock-model'
      }
    };
  }

  async *sendPromptStream(prompt: string, context: AgentContext) {
    const result = await this.sendPrompt(prompt, context);

    yield {
      type: 'delta' as const,
      text: result.plan,
      fullText: result.plan,
    };

    yield {
      type: 'done' as const,
      result,
    };
  }
}
