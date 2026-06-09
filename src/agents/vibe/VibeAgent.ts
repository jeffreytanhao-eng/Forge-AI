import { BaseCodingAgent } from '../base/CodingAgent';
import { AgentContext, AgentResponse } from '../../types/agent';
import { AIAdapter } from '../../utils/aiAdapter'; // 复用项目已有的 AIAdapter

/**
 * VibeAgent
 * 将项目中已有的自研 Vibe Coding 逻辑包装成标准的 CodingAgent
 * 保持与现有 aiAdapter + VibeComposer 的完全兼容
 */
export class VibeAgent extends BaseCodingAgent {
  id = 'vibe';
  name = 'Forge Vibe（自研）';
  description = '基于知识图谱的原生 Vibe Coding Agent';
  icon = '⚡';

  async sendPrompt(prompt: string, context: AgentContext): Promise<AgentResponse> {
    try {
      // 复用现有的 AIAdapter.sendVibePrompt
      const result = await AIAdapter.sendVibePrompt(prompt, context.workspaceFiles || []);

      // 兼容处理：如果原有逻辑直接返回 diffs，则包装成标准格式
      if (result && result.diffs) {
        return {
          plan: result.plan || 'Vibe Agent 已生成修改计划',
          diffs: result.diffs,
          usage: result.usage,
        };
      }

      // 兜底：如果原有返回格式不同，进行简单转换
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
  }
}
