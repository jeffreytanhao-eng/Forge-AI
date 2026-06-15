import { describe, it, expect, beforeAll } from 'vitest';
import { AgentRegistry } from '../agent/registry.js';
import { MockAgent } from '../agent/mock.js';

describe('知识图谱上下文注入测试', () => {
  beforeAll(() => {
    AgentRegistry.register(new MockAgent());
  });

  it('Mock Agent 接收 workspaceFiles 后返回包含文件信息的响应', async () => {
    const agent = AgentRegistry.getAgent('mock');
    expect(agent).toBeDefined();

    const testFiles = [
      { path: 'src/main.ts', content: 'console.log("hello")' },
      { path: 'src/utils.ts', content: 'export function foo() {}' },
    ];

    const result = await agent!.sendPrompt('分析代码结构', {
      workspaceFiles: testFiles,
    });

    expect(result.plan).toContain('src/main.ts');
    expect(result.plan).toContain('src/utils.ts');
    expect(result.plan).toContain('分析代码结构');
  });

  it('Mock Agent 接收 knowledgeGraph 后返回包含图谱信息的响应', async () => {
    const agent = AgentRegistry.getAgent('mock');

    const result = await agent!.sendPrompt('分析项目架构', {
      workspaceFiles: [{ path: 'test.ts', content: 'test' }],
      knowledgeGraph: {
        nodeCount: 370,
        nodes: [
          { id: 'BaseCodingAgent', label: 'BaseCodingAgent', type: 'code' },
          { id: 'AgentRegistry', label: 'AgentRegistry', type: 'code' },
        ],
        edges: [
          { source: 'BaseCodingAgent', target: 'AgentRegistry', relation: 'depends', confidence: 'EXTRACTED' },
        ],
      },
    });

    expect(result.plan).toContain('knowledgeGraph');
    expect(result.plan).toContain('BaseCodingAgent');
    expect(result.plan).toContain('AgentRegistry');
  });

  it('不传知识图谱时不会报错', async () => {
    const agent = AgentRegistry.getAgent('mock');
    const result = await agent!.sendPrompt('简单任务', {
      workspaceFiles: [{ path: 'test.ts', content: 'test' }],
    });

    expect(result.plan).toBeTruthy();
    expect(result.diffs.length).toBeGreaterThan(0);
  });
});