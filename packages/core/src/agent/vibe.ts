import { BaseCodingAgent } from './base.js';
import { AgentContext, AgentResponse } from '../types/index.js';

export type ModelCallFn = (prompt: string, context: AgentContext) => Promise<AgentResponse>;

export class VibeAgent extends BaseCodingAgent {
  readonly id = 'vibe';
  readonly name = 'Forge Vibe（自研）';
  readonly description = '基于知识图谱的原生 Vibe Coding Agent';
  readonly supportsStreaming = false;
  icon = '⚡';

  private modelCall: ModelCallFn | null = null;

  constructor(modelCall?: ModelCallFn) {
    super();
    if (modelCall) {
      this.modelCall = modelCall;
    }
  }

  setModelCall(fn: ModelCallFn): void {
    this.modelCall = fn;
  }

  async sendPrompt(prompt: string, context: AgentContext): Promise<AgentResponse> {
    this.status = 'running';
    try {
      if (this.modelCall) {
        const result = await this.modelCall(prompt, context);
        this.status = 'idle';
        return result;
      }

      const workspaceContext = context.workspaceFiles
        ? context.workspaceFiles.map(f => `- ${f.path}: ${(f.content || '').slice(0, 200)}`).join('\n')
        : '';

      return {
        plan: `Vibe Agent 已分析请求：${prompt}\n\n上下文文件：\n${workspaceContext || '无'}`,
        diffs: [],
        usage: { inputTokens: prompt.length, outputTokens: 0, model: 'vibe-default' }
      };
    } catch (error) {
      this.status = 'error';
      console.error('VibeAgent 执行失败:', error);
      throw new Error('Vibe Agent 调用失败');
    }
  }
}