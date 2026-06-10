import { describe, it, expect } from 'vitest';
import { MockAgent } from '../agent/mock';

describe('MockAgent', () => {
  const agent = new MockAgent();

  it('基本属性正确', () => {
    expect(agent.id).toBe('mock');
    expect(agent.name).toBe('Mock Agent');
    expect(agent.supportsStreaming).toBe(false);
  });

  it('sendPrompt 返回正确的格式（plan, diffs）', async () => {
    const response = await agent.sendPrompt('测试提示词', {});

    expect(response).toHaveProperty('plan');
    expect(response).toHaveProperty('diffs');
    expect(typeof response.plan).toBe('string');

    expect(Array.isArray(response.diffs)).toBe(true);
    expect(response.diffs.length).toBeGreaterThan(0);

    const diff = response.diffs[0];
    expect(diff).toHaveProperty('file');
    expect(diff).toHaveProperty('content');
    expect(diff).toHaveProperty('description');
    expect(diff.file).toBe('example.txt');
  });

  it('sendPrompt 返回的内容包含传入的 prompt', async () => {
    const testPrompt = '帮我写一个Hello World程序';
    const response = await agent.sendPrompt(testPrompt, {});

    expect(response.plan).toContain(testPrompt);
    expect(response.diffs[0].content).toContain(testPrompt);
  });

  it('sendPrompt 返回包含 workspaceFiles 上下文', async () => {
    const context = {
      workspaceFiles: [
        { path: 'src/index.ts', content: 'console.log("hello");' },
        { path: 'src/utils.ts', content: 'export const add = (a: number, b: number) => a + b;' },
      ],
    };
    const response = await agent.sendPrompt('分析工作区文件', context);

    expect(response).toHaveProperty('plan');
    expect(response).toHaveProperty('diffs');
    expect(response.diffs.length).toBeGreaterThan(0);
  });
});