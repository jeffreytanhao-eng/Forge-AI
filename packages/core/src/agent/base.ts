import { CodingAgent, AgentContext, AgentResponse } from '../types';

export abstract class BaseCodingAgent implements CodingAgent {
  abstract readonly id: string;
  abstract readonly name: string;
  abstract readonly description: string;
  abstract readonly supportsStreaming: boolean;

  abstract sendPrompt(
    prompt: string,
    context: AgentContext
  ): Promise<AgentResponse>;

  // 默认不实现流式，子类按需覆盖
  sendPromptStream?(
    prompt: string,
    context: AgentContext
  ): AsyncGenerator<any, void, unknown> {
    throw new Error(`${this.name} does not support streaming`);
  }

  protected extractJSON(text: string): any {
    // 支持 ```json ... ``` 或直接 JSON
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
