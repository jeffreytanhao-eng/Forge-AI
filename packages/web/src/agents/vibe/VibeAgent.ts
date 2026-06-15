import { VibeAgent as CoreVibeAgent, AgentContext, AgentResponse } from '@forge-ai/core';
import { AIAdapter } from '../../utils/aiAdapter';
import { WorkspaceFile } from '../../types';

export class VibeAgent extends CoreVibeAgent {
  constructor() {
    super(async (prompt: string, context: AgentContext) => {
      try {
        const files: WorkspaceFile[] = (context.workspaceFiles || []).map(f => ({
          path: f.path,
          content: f.content,
          name: f.path.split('/').pop() || f.path,
          type: 'file' as const,
        }));
        const result = await AIAdapter.sendVibePrompt(prompt, files);

        if (result && result.diffs) {
          return {
            plan: result.plan || 'Vibe Agent 已生成修改计划',
            diffs: result.diffs,
            usage: result.usage,
          };
        }

        if (Array.isArray(result)) {
          return {
            plan: 'Vibe Agent 已生成代码变更',
            diffs: result,
          };
        }

        return {
          plan: typeof result === 'string' ? result : 'Vibe Agent 处理完成',
          diffs: [],
        };
      } catch (error) {
        console.error('VibeAgent 执行失败:', error);
        throw new Error('自研 Vibe Agent 调用失败，请检查配置或重试');
      }
    });
  }
}