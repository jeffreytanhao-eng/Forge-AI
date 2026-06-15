import { CodingAgent, AgentConfig, AgentStatus, AgentContext, AgentResponse } from '../types/index.js';

export abstract class BaseCodingAgent implements CodingAgent {
  abstract readonly id: string;
  abstract readonly name: string;
  abstract readonly description: string;
  abstract readonly supportsStreaming: boolean;
  icon?: string;

  protected status: AgentStatus = 'idle';
  protected config: AgentConfig = {};

  abstract sendPrompt(
    prompt: string,
    context: AgentContext
  ): Promise<AgentResponse>;

  sendPromptStream?(
    prompt: string,
    context: AgentContext
  ): AsyncGenerator<any, void, unknown> {
    throw new Error(`${this.name} does not support streaming`);
  }

  configure(config: AgentConfig): void {
    this.config = { ...this.config, ...config };
  }

  getStatus(): AgentStatus {
    return this.status;
  }

  protected extractJSON(text: string): any {
    const jsonMatch =
      text.match(/```json\s*([\s\S]*?)\s*```/) ||
      text.match(/\{[\s\S]*"diffs"[\s\S]*\}/);

    if (jsonMatch) {
      try {
        return JSON.parse(jsonMatch[1] || jsonMatch[0]);
      } catch {
        return null;
      }
    }
    return null;
  }
}
