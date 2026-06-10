import { BaseCodingAgent } from './base';
import { AgentResponse, AgentContext } from '../types';

export class MockAgent extends BaseCodingAgent {
  readonly id = 'mock';
  readonly name = 'Mock Agent';
  readonly description = 'Mock Agent for testing';
  readonly supportsStreaming = false;

  async sendPrompt(prompt: string, context: AgentContext): Promise<AgentResponse> {
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    return {
      plan: `这是一个 Mock 响应，您的提示是：${prompt}\n\n我将创建一个示例文件。`,
      diffs: [
        {
          file: 'example.txt',
          content: `Hello from Mock Agent!\n\n提示词：${prompt}\n`,
          description: '创建示例文件'
        }
      ]
    };
  }
}
