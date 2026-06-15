# ForgeAI 平台实施计划

## 当前状态概览

| # | 目标模块 | 当前完成度 | 优先级 |
|---|---------|-----------|-------|
| 1 | IDE CLI | **90%** - `forge vibe` 命令 + Ink UI | 🔴 P0 |
| 2 | 大模型配置与调用 | **40%** - Web 面板完善，Core 模型层缺失 | 🔴 P0 |
| 3 | Agent 开发与调用 | **60%** - 基础框架完成，SDK/CLI 管理缺失 | 🔴 P0 |
| 4 | Skill Hub | **30%** - Web 面板 + Mock，Core 引擎缺失 | 🟡 P1 |
| 5 | MCP 管理 | **0%** - 完全未实现 | 🟡 P1 |
| 6 | Wiki 知识库 | **30%** - 基础编辑器，Core 解析引擎缺失 | 🟢 P2 |
| 7 | 知识图谱 | **50%** - graphify + Web 视图，Core 构建器缺失 | 🟢 P2 |

---

## 执行策略

### 并行路线图

```
Week 1-2:  P1(基础设施统一) + P5(MCP 独立模块) + P6(Wiki 独立模块)    ← 3 路并行
Week 3-4:  P2(大模型) + P7(知识图谱独立模块)                           ← 2 路并行
Week 5-6:  P3(Agent SDK) + P4(Skill Hub)                             ← 串行于 P2 之后
```

---

## Phase 1: 基础设施统一（第 1-2 周）

### 1.1 统一 Core 与 Web 的双 Agent 注册体系

**目标**: 消除代码重复，Core 成为唯一 Agent 入口

**步骤**:

1. **扩充 Core 的 CodingAgent 接口** — [packages/core/src/types/index.ts](file:///d:/项目/forgeai/packages/core/src/types/index.ts)
   - 新增 `configure(config: AgentConfig): void` — 运行时配置模型/温度等参数
   - 新增 `getStatus(): AgentStatus` — 返回运行状态（idle/running/error）
   - 新增 `AgentConfig` 类型定义
   - 新增 `AgentStatus` 类型定义

2. **废弃 Web 端重复代码**:
   - 删除 `packages/web/src/agents/base/CodingAgent.ts`
   - 删除 `packages/web/src/agents/registry/AgentRegistry.ts`
   - Web 端所有引用改为 `import { BaseCodingAgent, AgentRegistry } from '@forge-ai/core'`

3. **迁移 Web 端的 Agent 实现到 Core**:
   - 将 `packages/web/src/agents/claude/ClaudeAgent.ts` 迁移到 `packages/core/src/agent/claude.ts`
   - 将 `packages/web/src/agents/vibe/VibeAgent.ts` 迁移到 `packages/core/src/agent/vibe.ts`
   - 更新 Web 端 `main.tsx` 中的 Agent 注册代码，改为引用 Core

4. **AgentRegistry 增强**:
   - 新增按能力/分类查询方法 `getByCapability(cap: string): CodingAgent[]`
   - 新增 `getAll(): CodingAgent[]` 方法

5. **测试验证**:
   - 更新 `packages/core/src/__tests__/registry.test.ts` 覆盖新方法
   - 验证 Web 端所有页面正常渲染

**涉及文件**:
- `packages/core/src/types/index.ts` — 类型扩展
- `packages/core/src/agent/registry.ts` — 方法增强
- `packages/core/src/agent/index.ts` — re-export
- `packages/core/src/agent/claude.ts` — 新建
- `packages/core/src/agent/vibe.ts` — 新建
- `packages/web/src/agents/` — 删除重复文件
- `packages/web/src/main.tsx` — 更新引用
- `packages/web/src/App.tsx` — 更新引用
- `packages/web/src/components/AgentStudio.tsx` — 更新引用
- `packages/web/src/stores/useAgentStore.ts` — 更新引用

### 1.2 CLI 命令体系扩展

**目标**: 从单一 `vibe` 命令扩展为完整命令体系

**步骤**:

1. **创建 CLI 配置管理** — [packages/cli/src/commands/config.ts](file:///d:/项目/forgeai/packages/cli/src/commands/config.ts)
   - `forge config show` — 显示当前配置（模型/MCP/Skill 等）
   - `forge config set <key> <value>` — 修改配置项

2. **创建 CLI Agent 管理** — [packages/cli/src/commands/agent.ts](file:///d:/项目/forgeai/packages/cli/src/commands/agent.ts)
   - `forge agent list` — 列出可用 Agent
   - `forge agent use <id>` — 设置默认 Agent（写入 conf）
   - 使用 Ink Table 组件美化输出

3. **更新 CLI 入口** — [packages/cli/src/index.ts](file:///d:/项目/forgeai/packages/cli/src/index.ts)
   - 注册新子命令

4. **测试验证**:
   - 手动运行 `forge agent list` 确认输出正确
   - 运行 `forge config show` 确认配置文件可读写

**涉及文件**:
- `packages/cli/src/commands/config.ts` — 新建
- `packages/cli/src/commands/agent.ts` — 新建
- `packages/cli/src/index.ts` — 更新

---

## Phase 2: 大模型配置与调用（第 3-4 周）

### 2.1 Core 包：模型提供商抽象层

**目标**: 统一模型调用接口，支持在线/离线模型切换

**步骤**:

1. **定义 ModelProvider 接口** — [packages/core/src/models/provider.ts](file:///d:/项目/forgeai/packages/core/src/models/provider.ts)
   ```typescript
   interface ModelProvider {
     readonly id: string;
     readonly name: string;
     readonly online: boolean;
     listModels(): Promise<ModelOption[]>;
     chat(messages: ChatMessage[], options?: ChatOptions): AsyncGenerator<ChatChunk, AgentResponse, unknown>;
     validateConfig(): Promise<boolean>;
   }
   ```

2. **创建 ModelRegistry** — [packages/core/src/models/registry.ts](file:///d:/项目/forgeai/packages/core/src/models/registry.ts)
   - 单例模式，管理所有 ModelProvider
   - `register(provider)` / `get(id)` / `getAll()` / `getOnline()` / `getOffline()`

3. **实现各模型提供商**:
   - [packages/core/src/models/providers/openai.ts](file:///d:/项目/forgeai/packages/core/src/models/providers/openai.ts) — OpenAI 兼容 API
   - [packages/core/src/models/providers/anthropic.ts](file:///d:/项目/forgeai/packages/core/src/models/providers/anthropic.ts) — Claude API
   - [packages/core/src/models/providers/ollama.ts](file:///d:/项目/forgeai/packages/core/src/models/providers/ollama.ts) — 本地 Ollama
   - [packages/core/src/models/providers/gemini.ts](file:///d:/项目/forgeai/packages/core/src/models/providers/gemini.ts) — Google Gemini
   - [packages/core/src/models/providers/index.ts](file:///d:/项目/forgeai/packages/core/src/models/providers/index.ts) — re-export

4. **重构 DoubaoAgent 使用 ModelProvider**:
   - 将 [packages/core/src/agent/doubao.ts](file:///d:/项目/forgeai/packages/core/src/agent/doubao.ts) 内部改为调用 ModelRegistry

5. **Core 类型扩展**:
   - 在 [packages/core/src/types/index.ts](file:///d:/项目/forgeai/packages/core/src/types/index.ts) 新增 `ModelOption`, `ChatMessage`, `ChatOptions`, `ChatChunk` 类型

6. **配置持久化**:
   - [packages/core/src/config/index.ts](file:///d:/项目/forgeai/packages/core/src/config/index.ts) — 配置管理（JSON 文件持久化）
   - 存储当前使用的模型提供商、API Key（加密）、端点地址等

7. **测试验证**:
   - 创建 `packages/core/src/__tests__/model-provider.test.ts`
   - 测试 MockProvider 的 chat 和 listModels
   - 测试 ModelRegistry 注册/查询

### 2.2 CLI 端：离线模型支持

**步骤**:
1. `forge config set model.provider ollama` — 切换到本地模型
2. `forge config set model.endpoint http://localhost:11434` — 配置本地端点
3. `forge vibe "prompt"` 自动读取配置并使用对应模型

### 2.3 Web 端：真实 API 打通

**步骤**:
1. 更新 `ModelHub.tsx` 的"连通性测试"为真实 HTTP ping
2. 模型配置持久化：从 localStorage → Core 的 config 模块
3. 更新 `server.ts` 的 `/api/agent/chat` 等端点，使用 Core 的 ModelRegistry

**涉及文件**:
- `packages/core/src/models/` — 新建目录，5+ 文件
- `packages/core/src/types/index.ts` — 类型扩展
- `packages/core/src/config/index.ts` — 新建
- `packages/core/src/agent/doubao.ts` — 重构
- `packages/web/src/components/ModelHub.tsx` — 更新
- `packages/web/server.ts` — 更新 API 端点
- `packages/cli/src/commands/vibe.tsx` — 更新模型调用

---

## Phase 3: Agent 开发与调用（第 5 周）

### 3.1 Core 包：Agent SDK

**目标**: 提供链式 Agent 构建器，让用户可以自定义 Agent

**步骤**:

1. **AgentBuilder** — [packages/core/src/agent/sdk/AgentBuilder.ts](file:///d:/项目/forgeai/packages/core/src/agent/sdk/AgentBuilder.ts)
   ```typescript
   const agent = new AgentBuilder('my-agent')
     .setModel('gpt-4')
     .setSystemPrompt('你是代码专家')
     .addTool('read_file')
     .addTool('edit_file')
     .addSkill('code_review')
     .build();
   AgentRegistry.register(agent);
   ```

2. **ToolInterface** — [packages/core/src/agent/sdk/ToolInterface.ts](file:///d:/项目/forgeai/packages/core/src/agent/sdk/ToolInterface.ts)
   - 定义工具接口：`name`, `description`, `parameters`, `execute(params): Promise<any>`
   - 内置工具：`read_file`, `edit_file`, `execute_command`, `search_codebase`

3. **AgentRuntime** — [packages/core/src/agent/sdk/AgentRuntime.ts](file:///d:/项目/forgeai/packages/core/src/agent/sdk/AgentRuntime.ts)
   - 执行 Agent 的完整生命周期
   - 工具调用循环（Agent 请求 → 执行工具 → 结果返回 Agent）

4. **导出 SDK** — 更新 `packages/core/src/agent/index.ts`

5. **测试验证**:
   - `packages/core/src/__tests__/agent-sdk.test.ts`
   - 测试 AgentBuilder 构建流程
   - 测试 Tool 注册与执行

### 3.2 CLI 端：Agent 管理

**步骤**:
1. 更新 `packages/cli/src/commands/agent.ts`：
   - `forge agent create` — 交互式向导（Ink 表单：名称、模型、System Prompt、工具选择）
   - 创建的 Agent 保存到配置文件
   - Web 端的 Agent 导出的 JSON 可在 CLI 端导入

### 3.3 Web 端：AgentStudio 增强

**步骤**:
1. AgentStudio 的"沙箱对话"改为使用 Core AgentRuntime 执行真实连续对话
2. 新增 Agent 版本管理（每次编辑保存历史版本）
3. 新增 Agent 导出/导入按钮（JSON 格式）

**涉及文件**:
- `packages/core/src/agent/sdk/AgentBuilder.ts` — 新建
- `packages/core/src/agent/sdk/ToolInterface.ts` — 新建
- `packages/core/src/agent/sdk/AgentRuntime.ts` — 新建
- `packages/cli/src/commands/agent.ts` — 更新
- `packages/web/src/components/AgentStudio.tsx` — 更新

---

## Phase 4: Skill Hub 能力（第 6 周）

### 4.1 Core 包：Skill 引擎

**目标**: 支持 Skill 的注册、执行、组合

**步骤**:

1. **Skill 接口** — [packages/core/src/skill/Skill.ts](file:///d:/项目/forgeai/packages/core/src/skill/Skill.ts)
   ```typescript
   interface Skill {
     id: string;
     name: string;
     version: string;
     description: string;
     category: SkillCategory;
     parameters: SkillParameter[];
     execute(context: SkillContext): AsyncGenerator<SkillChunk, SkillResult, unknown>;
   }
   ```

2. **SkillRegistry** — [packages/core/src/skill/SkillRegistry.ts](file:///d:/项目/forgeai/packages/core/src/skill/SkillRegistry.ts)
   - 注册/注销/查询 Skill
   - 支持按分类和标签过滤

3. **SkillRuntime** — [packages/core/src/skill/SkillRuntime.ts](file:///d:/项目/forgeai/packages/core/src/skill/SkillRuntime.ts)
   - 沙箱执行环境
   - 限制资源使用（超时、内存）

4. **内置 Skill**:
   - [packages/core/src/skill/builtin/code-review.ts](file:///d:/项目/forgeai/packages/core/src/skill/builtin/code-review.ts) — 代码审查
   - [packages/core/src/skill/builtin/refactor.ts](file:///d:/项目/forgeai/packages/core/src/skill/builtin/refactor.ts) — 代码重构
   - [packages/core/src/skill/builtin/test-generate.ts](file:///d:/项目/forgeai/packages/core/src/skill/builtin/test-generate.ts) — 测试生成

5. **Web 端 SkillHub 增强**:
   - 更新 [packages/web/server.ts](file:///d:/项目/forgeai/packages/web/server.ts) — `/api/skill/execute` 改为真实调用 SkillRuntime
   - 更新 [packages/web/src/components/SkillHub.tsx](file:///d:/项目/forgeai/packages/web/src/components/SkillHub.tsx) — 显示真实执行输出

6. **测试验证**:
   - `packages/core/src/__tests__/skill-engine.test.ts`
   - 测试内置 Skill 执行
   - 测试 SkillRegistry 注册/查询

### 4.2 CLI 端：Skill 管理

**步骤**:
1. [packages/cli/src/commands/skill.ts](file:///d:/项目/forgeai/packages/cli/src/commands/skill.ts) — 新建
   - `forge skill list` — 列出已安装 Skill（调用 SkillRegistry）
   - `forge skill install <path|url>` — 从本地文件或远程 URL 安装 Skill
   - `forge skill run <name> [params]` — 运行指定 Skill

**涉及文件**:
- `packages/core/src/skill/` — 新建目录，6+ 文件
- `packages/cli/src/commands/skill.ts` — 新建
- `packages/web/server.ts` — 更新 API
- `packages/web/src/components/SkillHub.tsx` — 更新

---

## Phase 5: MCP 管理（第 1-2 周，与 Phase 1 并行）

### 5.1 Core 包：MCP 客户端

**目标**: 遵循 Anthropic MCP 规范，实现标准 MCP 客户端

**步骤**:

1. **MCPClient** — [packages/core/src/mcp/MCPClient.ts](file:///d:/项目/forgeai/packages/core/src/mcp/MCPClient.ts)
   - 支持 stdio 和 HTTP 两种传输模式
   - 实现 `connect()`, `disconnect()`, `listTools()`, `callTool(tool, args)`, `getResources()`
   - 错误处理和重连机制

2. **MCPRegistry** — [packages/core/src/mcp/MCPRegistry.ts](file:///d:/项目/forgeai/packages/core/src/mcp/MCPRegistry.ts)
   - 管理所有 MCP 服务连接
   - 服务状态追踪（connected/disconnected/error）
   - 配置持久化

3. **内置 MCP 服务**:
   - [packages/core/src/mcp/builtin/filesystem.ts](file:///d:/项目/forgeai/packages/core/src/mcp/builtin/filesystem.ts) — 文件系统操作
   - [packages/core/src/mcp/builtin/git.ts](file:///d:/项目/forgeai/packages/core/src/mcp/builtin/git.ts) — Git 操作
   - [packages/core/src/mcp/builtin/terminal.ts](file:///d:/项目/forgeai/packages/core/src/mcp/builtin/terminal.ts) — 终端命令执行

4. **测试验证**:
   - `packages/core/src/__tests__/mcp-client.test.ts` — Mock Stdio 传输测试
   - 测试 `listTools` 和 `callTool` 的基本流程

### 5.2 CLI 端：MCP 管理

**步骤**:
1. [packages/cli/src/commands/mcp.ts](file:///d:/项目/forgeai/packages/cli/src/commands/mcp.ts) — 新建
   - `forge mcp list` — 列出已注册 MCP 服务及状态
   - `forge mcp add <name> [--command] [--args] [--url]` — 添加新 MCP 服务
   - `forge mcp remove <name>` — 移除 MCP 服务
   - `forge mcp test <name> <tool>` — 测试调用 MCP 工具

### 5.3 Web 端：MCP 面板

**步骤**:
1. [packages/web/src/components/MCPManager.tsx](file:///d:/项目/forgeai/packages/web/src/components/MCPManager.tsx) — 新建
   - 可视化 MCP 服务列表（状态指示器：运行/停止/错误）
   - 添加/删除 MCP 服务表单
   - 浏览服务的工具列表
   - 测试调用交互式控制台
2. 更新 [packages/web/src/App.tsx](file:///d:/项目/forgeai/packages/web/src/App.tsx) — 添加 MCP 管理选项卡
3. 更新 [packages/web/server.ts](file:///d:/项目/forgeai/packages/web/server.ts) — 添加 MCP API 端点

**涉及文件**:
- `packages/core/src/mcp/` — 新建目录，5+ 文件
- `packages/cli/src/commands/mcp.ts` — 新建
- `packages/web/src/components/MCPManager.tsx` — 新建
- `packages/web/src/App.tsx` — 更新
- `packages/web/server.ts` — 更新

---

## Phase 6: Wiki 知识库（第 1-2 周，与 Phase 1 并行）

### 6.1 Core 包：文档解析引擎

**目标**: 支持导入 Word/PDF/TXT/MD 文件，提取文本内容

**步骤**:

1. **DocumentParser 基类** — [packages/core/src/wiki/DocumentParser.ts](file:///d:/项目/forgeai/packages/core/src/wiki/DocumentParser.ts)
   ```typescript
   interface DocumentParser {
     supportedExtensions: string[];
     parse(filePath: string): Promise<ParsedDocument>;
   }
   ```

2. **各格式解析器**:
   - [packages/core/src/wiki/parsers/markdown.ts](file:///d:/项目/forgeai/packages/core/src/wiki/parsers/markdown.ts) — .md 解析（直接读取 + frontmatter 解析）
   - [packages/core/src/wiki/parsers/text.ts](file:///d:/项目/forgeai/packages/core/src/wiki/parsers/text.ts) — .txt 解析
   - [packages/core/src/wiki/parsers/pdf.ts](file:///d:/项目/forgeai/packages/core/src/wiki/parsers/pdf.ts) — .pdf 解析（使用 `pdf-parse`）
   - [packages/core/src/wiki/parsers/word.ts](file:///d:/项目/forgeai/packages/core/src/wiki/parsers/word.ts) — .docx 解析（使用 `mammoth`）

3. **安装依赖**:
   - `pnpm add pdf-parse mammoth --filter @forge-ai/core`

4. **KnowledgeBase** — [packages/core/src/wiki/KnowledgeBase.ts](file:///d:/项目/forgeai/packages/core/src/wiki/KnowledgeBase.ts)
   - 文档 CRUD（增删改查）
   - 文档分块（chunking，默认 500 token）
   - 全文搜索（关键词索引）
   - 知识库导出/导入 JSON（支持迁移与合并）
   - 合并策略：相同 ID 覆盖，不同 ID 追加，重复内容去重

5. **VectorStore** — [packages/core/src/wiki/VectorStore.ts](file:///d:/项目/forgeai/packages/core/src/wiki/VectorStore.ts)
   - 向量存储接口
   - 本地实现：内存向量索引（使用 `@xenova/transformers` 或简单的 TF-IDF）
   - 余弦相似度搜索
   - BM25 关键词搜索后备方案

6. **测试验证**:
   - `packages/core/src/__tests__/wiki-parser.test.ts`
   - `packages/core/src/__tests__/knowledge-base.test.ts`

### 6.2 CLI 端：知识库操作

**步骤**:
1. [packages/cli/src/commands/wiki.ts](file:///d:/项目/forgeai/packages/cli/src/commands/wiki.ts) — 新建
   - `forge wiki import <file>` — 导入文档（自动识别格式）
   - `forge wiki query <question>` — 基于知识库问答
   - `forge wiki list` — 列出知识库中文档
   - `forge wiki export <path>` — 导出知识库（迁移用）
   - `forge wiki merge <path>` — 合并另一个知识库

### 6.3 Web 端：WikiKnowledgeBase 增强

**步骤**:
1. 更新 [packages/web/src/components/WikiKnowledgeBase.tsx](file:///d:/项目/forgeai/packages/web/src/components/WikiKnowledgeBase.tsx)
   - 新增 PDF/Word 文件拖拽导入和即时解析
   - 新增文档层级树
   - 新增全文搜索
   - 新增知识库导出/导入按钮
2. 更新 [packages/web/server.ts](file:///d:/项目/forgeai/packages/web/server.ts)
   - `/api/wiki/search` — 全文搜索端点
   - `/api/wiki/export` — 知识库导出
   - `/api/wiki/import` — 知识库导入
   - `/api/wiki/merge` — 知识库合并

**涉及文件**:
- `packages/core/src/wiki/` — 新建目录，7+ 文件
- `packages/cli/src/commands/wiki.ts` — 新建
- `packages/web/src/components/WikiKnowledgeBase.tsx` — 更新
- `packages/web/server.ts` — 更新 API

---

## Phase 7: 知识图谱深度集成（第 3-4 周，与 Phase 2 并行）

### 7.1 Core 包：GraphBuilder

**目标**: 实现 AST 级别的精确代码分析图谱，替代 graphify 的正则近似

**步骤**:

1. **GraphBuilder** — [packages/core/src/graph/GraphBuilder.ts](file:///d:/项目/forgeai/packages/core/src/graph/GraphBuilder.ts)
   - 递归扫描项目文件
   - AST 级别分析（使用 TypeScript Compiler API 解析 .ts/.tsx）
   - 提取 Import/Export 关系、函数调用、类继承
   - 输出标准图谱 JSON 格式（兼容 `graph.json`）

2. **GraphQuery** — [packages/core/src/graph/GraphQuery.ts](file:///d:/项目/forgeai/packages/core/src/graph/GraphQuery.ts)
   - `queryNode(name)` — 查询节点及其邻居
   - `shortestPath(a, b)` — 两节点间最短路径（BFS）
   - `findCommunities()` — 社区发现（Louvain 算法）

3. **GraphCache** — [packages/core/src/graph/GraphCache.ts](file:///d:/项目/forgeai/packages/core/src/graph/GraphCache.ts)
   - 增量更新：文件变更时只重新分析变更文件
   - 缓存结果，避免全量重建

4. **测试验证**:
   - `packages/core/src/__tests__/graph-builder.test.ts`
   - 测试小型项目图谱构建
   - 测试增量更新

### 7.2 CLI 端：图谱查询

**步骤**:
1. [packages/cli/src/commands/graph.ts](file:///d:/项目/forgeai/packages/cli/src/commands/graph.ts) — 新建
   - `forge graph query <node>` — 查询节点及其邻居
   - `forge graph path <a> <b>` — 查询最短路径
   - `forge graph stats` — 图谱统计（节点数/边数/社区数）

2. 更新 [packages/cli/src/commands/vibe.tsx](file:///d:/项目/forgeai/packages/cli/src/commands/vibe.tsx)
   - AgentContext 中注入知识图谱结构（已有 `graph.json` 接入，改为使用 Core GraphQuery）

### 7.3 Web 端：KnowledgeGraphView 增强

**步骤**:
1. 更新 [packages/web/src/components/KnowledgeGraphView.tsx](file:///d:/项目/forgeai/packages/web/src/components/KnowledgeGraphView.tsx)
   - 后端提供真实图谱数据（通过 `/api/graph` 端点）
   - 支持增量更新按钮
   - 节点拖拽交互
   - 点击节点显示代码引用位置
2. 更新 [packages/web/server.ts](file:///d:/项目/forgeai/packages/web/server.ts)
   - `/api/graph/query` — 图谱查询
   - `/api/graph/stats` — 图谱统计
   - `/api/graph/build` — 触发图谱构建
   - `/api/graph/update` — 触发增量更新

**涉及文件**:
- `packages/core/src/graph/` — 新建目录，4+ 文件
- `packages/cli/src/commands/graph.ts` — 新建
- `packages/cli/src/commands/vibe.tsx` — 更新
- `packages/web/src/components/KnowledgeGraphView.tsx` — 更新
- `packages/web/server.ts` — 更新 API

---

## 依赖安装汇总

```
# Phase 1: 无新依赖
# Phase 2: 无新依赖（使用已有 SDK）
# Phase 3: 无新依赖
# Phase 4: 无新依赖
# Phase 5: 无新依赖（使用原生 stdio/HTTP）
# Phase 6:
pnpm add pdf-parse mammoth --filter @forge-ai/core
pnpm add -D @types/pdf-parse --filter @forge-ai/core
# Phase 7: 无新依赖（使用 TypeScript Compiler API 内置）
```

---

## 测试计划

| Phase | 测试文件 | 测试内容 |
|-------|---------|---------|
| P1 | `registry.test.ts` 更新 | AgentRegistry 新增方法 |
| P2 | `model-provider.test.ts` 新建 | ModelProvider chat/listModels |
| P3 | `agent-sdk.test.ts` 新建 | AgentBuilder/Tool/Runtime |
| P4 | `skill-engine.test.ts` 新建 | Skill 注册/执行 |
| P5 | `mcp-client.test.ts` 新建 | MCPClient connect/listTools/callTool |
| P6 | `wiki-parser.test.ts` 新建 | 文档解析 |
| P6 | `knowledge-base.test.ts` 新建 | 知识库 CRUD/搜索/导入导出 |
| P7 | `graph-builder.test.ts` 新建 | 图谱构建/查询/增量更新 |

---

## 里程碑检查点

| 里程碑 | 时间 | 验收标准 |
|--------|------|---------|
| **M1** 基础设施统一 | 第 1 周末 | Core 为唯一 Agent 入口，Web 无重复代码；CLI 有 `agent list`/`config show` 命令 |
| **M2** MCP 可用 | 第 2 周末 | `forge mcp list/add/remove` 命令可用；Web 有 MCP 管理面板 |
| **M3** Wiki 可用 | 第 2 周末 | 支持导入 .md/.txt/.pdf/.docx；`forge wiki import/query` 命令可用 |
| **M4** 模型配置可用 | 第 4 周末 | ModelProvider 支持 OpenAI/Anthropic/Ollama；CLI/Web 可切换模型 |
| **M5** 知识图谱增强 | 第 4 周末 | Core GraphBuilder 可构建 AST 级别图谱；增量更新；CLI/Web 可查询 |
| **M6** Agent SDK 完成 | 第 5 周末 | AgentBuilder 链式 API 可用；`forge agent create` 向导 |
| **M7** Skill Hub 完成 | 第 6 周末 | Skill 引擎完整；`forge skill list/install/run` 可用 |