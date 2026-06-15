import { describe, it, expect, beforeAll } from 'vitest';
import { AgentRegistry } from '../agent/registry';
import { MockAgent } from '../agent/mock';
import { scanWorkspace } from '../utils/file-scanner';

describe('Agent 全链路集成测试', () => {
  beforeAll(() => {
    AgentRegistry.register(new MockAgent());
  });

  it('完整流程：注册 → 选择 → 调用 → 响应', async () => {
    const agent = AgentRegistry.getAgent('mock');
    expect(agent).toBeDefined();
    expect(agent!.id).toBe('mock');
    expect(agent!.name).toBe('Mock Agent');

    const files = await scanWorkspace(process.cwd(), 5, 300);
    expect(files.length).toBeGreaterThan(0);

    const result = await agent!.sendPrompt('创建一个测试文件', {
      workspaceFiles: files,
    });

    expect(result.plan).toBeTruthy();
    expect(result.diffs.length).toBeGreaterThan(0);
    expect(result.diffs[0].file).toBeTruthy();
    expect(result.diffs[0].content).toBeTruthy();
    expect(result.diffs[0].description).toBeTruthy();
    expect(result.usage?.inputTokens).toBeTypeOf('number');
  });

  it('未提供上下文时仍能正常返回', async () => {
    const agent = AgentRegistry.getAgent('mock');
    const result = await agent!.sendPrompt('简单任务', {});
    expect(result.plan).toBeTruthy();
    expect(result.diffs.length).toBeGreaterThan(0);
  });

  it('发送 stream 请求返回正确格式', async () => {
    const agent = AgentRegistry.getAgent('mock');
    expect(agent!.supportsStreaming).toBe(true);
    expect(agent!.sendPromptStream).toBeDefined();

    const chunks: any[] = [];
    for await (const chunk of agent!.sendPromptStream!('流式测试', {})) {
      chunks.push(chunk);
    }

    expect(chunks.length).toBeGreaterThan(0);
    const doneChunk = chunks.find(c => c.type === 'done');
    expect(doneChunk).toBeDefined();
    expect(doneChunk!.result.plan).toBeTruthy();
  });
});