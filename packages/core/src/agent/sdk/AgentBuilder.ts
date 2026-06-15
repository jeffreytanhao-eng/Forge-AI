import { BaseCodingAgent } from '../base.js';
import { CodingAgent, AgentContext, AgentResponse } from '../../types/index.js';
import { Tool, builtinTools } from './ToolInterface.js';

export class AgentBuilder {
  private id: string;
  private name: string = '';
  private description: string = '';
  private systemPrompt: string = '';
  private modelId: string = '';
  private customTools: Tool[] = [];
  private skillIds: string[] = [];
  private temperature: number = 0.7;
  private maxTokens: number = 4096;

  constructor(id: string) {
    this.id = id;
  }

  setName(name: string): this {
    this.name = name;
    return this;
  }

  setDescription(description: string): this {
    this.description = description;
    return this;
  }

  setSystemPrompt(prompt: string): this {
    this.systemPrompt = prompt;
    return this;
  }

  setModel(modelId: string): this {
    this.modelId = modelId;
    return this;
  }

  addTool(toolName: string): this {
    const tool = builtinTools.find(t => t.name === toolName);
    if (tool) {
      this.customTools.push(tool);
    }
    return this;
  }

  addSkill(skillId: string): this {
    this.skillIds.push(skillId);
    return this;
  }

  setTemperature(temp: number): this {
    this.temperature = temp;
    return this;
  }

  build(): CodingAgent {
    const agentId = this.id;
    const agentName = this.name || this.id;
    const agentDescription = this.description || `Agent ${this.id}`;
    const sysPrompt = this.systemPrompt;
    const model = this.modelId;
    const temp = this.temperature;
    const maxTok = this.maxTokens;
    const selectedTools = [...this.customTools];
    const selectedSkills = [...this.skillIds];

    return new (class extends BaseCodingAgent implements CodingAgent {
      readonly id = agentId;
      readonly name = agentName;
      readonly description = agentDescription;
      readonly supportsStreaming = false;

      async sendPrompt(prompt: string, context: AgentContext): Promise<AgentResponse> {
        const toolsDesc = selectedTools.length > 0
          ? selectedTools.map(t => `- ${t.name}: ${t.description}`).join('\n')
          : '无';

        const skillsContext = context.skills
          ? context.skills
            .filter((s: any) => selectedSkills.includes(s.id || s))
            .map((s: any) => `- ${s.name || s}`)
            .join('\n')
          : '';

        const parts = [`你是 ${agentName}。`];
        if (sysPrompt) parts.push(sysPrompt);
        parts.push(`你使用模型: ${model || '默认'}`);
        parts.push(`温度: ${temp}, 最大Token: ${maxTok}`);

        const systemPromptStr = parts.join('\n');
        const fullPrompt = `${systemPromptStr}\n\n工具可用:\n${toolsDesc}\n${skillsContext ? `\nSkill 上下文:\n${skillsContext}\n` : ''}\n用户请求:\n${prompt}`;

        return {
          plan: `[${agentName}] 处理请求: ${prompt}`,
          diffs: [],
          usage: { inputTokens: fullPrompt.length, outputTokens: 0, model: agentId },
        };
      }
    })();
  }
}

export class ToolRegistry {
  private tools = new Map<string, Tool>();

  register(tool: Tool): void {
    this.tools.set(tool.name, tool);
  }

  get(name: string): Tool | undefined {
    return this.tools.get(name);
  }

  getAll(): Tool[] {
    return Array.from(this.tools.values());
  }
}

export const defaultToolRegistry = new ToolRegistry();

for (const tool of builtinTools) {
  defaultToolRegistry.register(tool);
}