# ForgeAI 项目评估与下一步开发计划

## 1. 当前状态评估

### 完成度

| 维度 | 状态 | 详情 |
|------|------|------|
| Core 包 | ✅ 100% | 类型系统、Agent 框架(Registry/Base/Mock/Doubao)、文件扫描、测试(24 个) |
| CLI 包 | ✅ 100% | Ink 交互界面、Agent 选择器、Diff 预览、知识图谱注入、流式支持 |
| Web 前端 | ✅ 90% | 7 个标签页、13 个 API 端点(含 Anthropic 真实SDK)、Tailwind v4 |
| 知识图谱 | ⚠️ 需更新 | 构建于代码清理之前，包含已删除文件的节点 |
| 构建 | ✅ 100% | 三包构建通过，Core 12 测试全过 |
| 代码质量 | ✅ 已完成 | 类型统一、any 消除、死代码清理、Mock 分离 |

### 知识图谱时效性

图表构建时间：2026-06-10 08:39 UTC
最后代码变更（ccb2b94）：在图表构建之后

**差异分析：**
- 已删除但仍在图中的文件：`VibeApp.tsx`、`VibeArchitectureViewer.tsx`、`agents/index.ts`、`types/agent.ts`、`core/utils/index.ts`
- 已新增但图中文档未覆盖的文件：`vitest.config.ts`、`__tests__/` 目录、`ui/AgentSelector.tsx`、`ui/DiffPreview.tsx`
- 类型变更未反映：`CodingAgent` 添加了 `icon` 字段

→ **需要增量更新（graphify --update）**

## 2. 下一步开发计划

### Phase A: 知识图谱更新（立即，无依赖）

| 步骤 | 操作 | 说明 |
|------|------|------|
| A1 | `graphify --update` | 增量更新图谱，反映最近的文件变更 |
| A2 | 验证图谱差异 | 确认已删除文件节点被移除，新文件被加入 |

### Phase B: 测试示例编写（与 Phase A 并行）

在 Core 包中新增 3 个集成/端到端测试样例，验证完整的 Agent 工作流：

| 步骤 | 测试 | 说明 |
|------|------|------|
| B1 | **Agent 注册 + 选择 + 调用 全链路** | 注册 MockAgent → 通过 Registry 获取 → sendPrompt → 验证响应格式 |
| B2 | **CLI vibe 命令端到端** | 模拟 `forge vibe "test"` 输入 → 验证扫描 → 调用 → Diff 输出流程 |
| B3 | **知识图谱文件扫描集成** | `scanWorkspace` → 返回文件列表 → 验证扩展名过滤和截断逻辑 |

### Phase C: 功能增强（下一步开发）

| 优先级 | 功能 | 说明 |
|--------|------|------|
| 🔴 高 | **ForgeAI 自身代码作为测试用例** | 运行 `forge vibe` 对本项目的一个简单问题发起修改，验证全流程可用性 |
| 🟡 中 | **CLI 多 Agent 模式增强** | --agent 参数支持 `all`（多个 Agent 并行调用，投票选择最佳方案） |
| 🟡 中 | **DoubaoAgent 实际连接测试** | 配置真实 `DOUBAO_API_KEY`，验证流式和非流式调用 |
| 🟢 低 | **Web 端 E2E 测试** | 使用 Playwright 或 Vitest 模拟浏览器交互 |
| 🟢 低 | **TurboRepo pipeline 完善** | 配置 build → test → lint 的 pipeline 依赖链 |

## 3. 测试样例设计

### 样例 1: Agent 全链路集成测试 (E2E)

```typescript
// packages/core/src/__tests__/agent-workflow.test.ts
import { describe, it, expect } from 'vitest';
import { AgentRegistry, MockAgent } from '@forge-ai/core';
import { scanWorkspace } from '@forge-ai/core';

describe('Agent 全链路集成测试', () => {
  it('完整流程：注册 → 选择 → 调用 → 响应 → 应用', async () => {
    // 1. 注册 Agent
    const registry = AgentRegistry.getInstance();
    registry.register(new MockAgent());

    // 2. 选择 Agent
    const agent = registry.getAgent('mock');
    expect(agent).toBeDefined();

    // 3. 扫描项目文件
    const files = await scanWorkspace(process.cwd(), 5, 300);
    expect(files.length).toBeGreaterThan(0);

    // 4. 调用 Agent
    const result = await agent!.sendPrompt('创建一个测试文件', {
      workspaceFiles: files,
    });

    // 5. 验证响应
    expect(result.plan).toBeTruthy();
    expect(result.diffs.length).toBeGreaterThan(0);
    expect(result.diffs[0].file).toBeTruthy();
    expect(result.diffs[0].content).toBeTruthy();
    expect(result.usage?.inputTokens).toBeTypeOf('number');
  });
});
```

### 样例 2: CLI 命令集成测试

```typescript
// packages/cli/src/__tests__/vibe-workflow.test.ts
// 测试 CLI 启动 → 文件扫描 → Agent 调用 → Diff 输出的全流程
// 注：这种测试适合使用 execa 或 child_process 来运行 CLI

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { execSync } from 'child_process';
import path from 'path';
import fs from 'fs';
import { scanWorkspace } from '@forge-ai/core';

describe('CLI vibe 工作流测试', () => {
  const testDir = path.join(__dirname, '../../.test-tmp');
  const testFile = path.join(testDir, 'hello.txt');

  beforeAll(() => {
    fs.mkdirSync(testDir, { recursive: true });
    fs.writeFileSync(testFile, 'Hello World', 'utf-8');
  });

  afterAll(() => {
    fs.rmSync(testDir, { recursive: true, force: true });
  });

  it('文件扫描: 扫描测试目录', async () => {
    const files = await scanWorkspace(testDir, 10, 500);
    const found = files.find(f => f.path.includes('hello.txt'));
    expect(found).toBeDefined();
    expect(found!.content).toContain('Hello World');
  });

  it('文件扫描: 内容截断逻辑', async () => {
    const files = await scanWorkspace(testDir, 10, 5); // 只取 5 字符
    const found = files.find(f => f.path.includes('hello.txt'));
    expect(found!.content).toContain('…（内容已截断）');
  });
});
```

### 样例 3: 图谱上下文集成测试

```typescript
// packages/cli/src/__tests__/knowledge-graph-flow.test.ts
// 测试知识图谱加载到 AgentContext 的完整流程

import { describe, it, expect } from 'vitest';
import { AgentRegistry, MockAgent } from '@forge-ai/core';
import path from 'path';
import fs from 'fs';

describe('知识图谱注入测试', () => {
  it('Mock Agent 接收 worksapceFiles 后返回包含上下文的响应', async () => {
    const agent = AgentRegistry.getAgent('mock');
    expect(agent).toBeDefined();

    const testFiles = [
      { path: 'src/main.ts', content: 'console.log("hello")' },
      { path: 'src/utils.ts', content: 'export function foo() {}' },
    ];

    const result = await agent!.sendPrompt('分析代码结构', {
      workspaceFiles: testFiles,
    });

    // MockAgent 会在 plan 中回显收到的工作区文件信息
    expect(result.plan).toContain('src/main.ts');
    expect(result.plan).toContain('src/utils.ts');
    expect(result.plan).toContain('分析代码结构');
  });

  it('scanWorkspace + Agent 调用 联合测试', async () => {
    const { scanWorkspace } = await import('@forge-ai/core');

    const files = await scanWorkspace(process.cwd(), 3, 200);
    expect(files.length).toBeLessThanOrEqual(3);

    const agent = AgentRegistry.getAgent('mock');
    const result = await agent!.sendPrompt('测试', {
      workspaceFiles: files,
      knowledgeGraph: {
        nodeCount: 370,
        nodes: [{ id: 'test', label: 'TestNode' }],
        edges: [{ source: 'a', target: 'b', relation: 'depends' }],
      },
    });

    expect(result.plan).toContain('knowledgeGraph');
  });
});
```

## 4. 执行顺序

```
时间线
├── Phase A: 图谱更新 (--update)
│   ├── A1: graphify --update     [5-10s]
│   └── A2: 验证差异               [读报告]
│
├── Phase B: 测试样例 (并行于 A)
│   ├── B1: Agent 全链路测试       [创建文件]
│   ├── B2: CLI 工作流测试         [创建文件]
│   └── B3: 图谱上下文测试         [创建文件]
│
└── Phase C: 功能增强 (确认方向后)
    ├── C1: ForgeAI 自测试         [手动运行]
    ├── C2: 多 Agent 并行调用      
    ├── C3: 真实 API 连接测试      
    └── C4: 低优先级项目
```

## 5. 依赖关系

- Phase A、B 无相互依赖，可并行执行
- Phase C1 需要在 Phase A 完成后执行（需要最新图谱）
- Phase C2、C3 可任意顺序