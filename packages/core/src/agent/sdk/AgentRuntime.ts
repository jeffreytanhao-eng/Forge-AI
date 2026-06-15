import { CodingAgent, AgentContext, AgentResponse } from '../../types/index.js';
import { Tool, builtinTools } from './ToolInterface.js';

export class AgentRuntime {
  private agent: CodingAgent;
  private conversationHistory: Array<{ role: 'user' | 'assistant'; content: string }> = [];
  private maxHistoryLength = 20;

  constructor(agent: CodingAgent) {
    this.agent = agent;
  }

  async execute(prompt: string, context: AgentContext = {}): Promise<AgentResponse> {
    this.conversationHistory.push({ role: 'user', content: prompt });

    if (this.conversationHistory.length > this.maxHistoryLength) {
      this.conversationHistory = this.conversationHistory.slice(-this.maxHistoryLength);
    }

    const result = await this.agent.sendPrompt(prompt, context);
    this.conversationHistory.push({ role: 'assistant', content: result.plan });
    return result;
  }

  async executeWithTools(prompt: string, context: AgentContext = {}): Promise<AgentResponse> {
    const result = await this.execute(prompt, context);

    for (const diff of result.diffs) {
      const tool = builtinTools.find(t => t.name === 'edit_file');
      if (tool && diff.content) {
        await tool.execute({ path: diff.file, content: diff.content });
      }
    }

    return result;
  }

  async *executeStream(prompt: string, context: AgentContext = {}) {
    if (this.agent.sendPromptStream) {
      yield* this.agent.sendPromptStream(prompt, context);
    } else {
      const result = await this.execute(prompt, context);
      yield { type: 'delta' as const, text: result.plan, fullText: result.plan };
      yield { type: 'done' as const, result };
    }
  }

  getHistory(): Array<{ role: string; content: string }> {
    return [...this.conversationHistory];
  }

  clearHistory(): void {
    this.conversationHistory = [];
  }
}