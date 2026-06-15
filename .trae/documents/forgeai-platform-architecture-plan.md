# ForgeAI 平台架构规划

## 目标概览

| # | 目标 | 当前状态 | 优先级 |
|---|------|---------|--------|
| 1 | IDE CLI | ✅ 基础 vibe 命令 | 🔴 P0 |
| 2 | 在线/离线大模型配置 | 🟡 前端面板 + Mock | 🔴 P0 |
| 3 | Agent 开发与调用 | 🟡 基础框架 | 🔴 P0 |
| 4 | Skill Hub | 🟡 前端面板 + Mock | 🟡 P1 |
| 5 | MCP 管理 | ❌ 未实现 | 🟡 P1 |
| 6 | Wiki 知识库 | 🟡 基础编辑器 | 🟢 P2 |
| 7 | 知识图谱 | 🟡 graphify + 前端视图 | 🟢 P2 |

---

## Phase 1: 基础设施统一（2 周）

### 1.1 统一双 Agent 注册体系

**问题**: Web 和 CLI 各有独立的 AgentRegistry，Agent 无法跨端共享。

**方案**:
```
之前:  CLI → core/AgentRegistry     Web → web/agents/registry/AgentRegistry
之后:  全平台 → core/AgentRegistry（唯一入口）
```

**步骤**:
- [ ] 扩充 core `CodingAgent` 接口，新增 Agent 生命周期方法：
  - `configure(config: AgentConfig): void` — 运行时配置（model/temperature/etc）
  - `getStatus(): AgentStatus` — 返回运行状态
- [ ] `AgentRegistry` 新增按能力分类/查询方法
- [ ] 废弃 Web 独立的 `AgentRegistry`，Web 端改为引用 `@forge-ai/core`
- [ ] 迁移 `VibeAgent` 和 `ClaudeAgent` 到 core 包

### 1.2 统一类型系统（已完成）

✅ 上一轮已完成 `web/types/agent.ts` 移除、所有 Web 组件改用 `@forge-ai/core` 类型。

### 1.3 CLI 命令体系扩展

**当前**: 仅有 `forge vibe <prompt>`

**扩展为**:
```
forge                  # 交互式 TUI 主界面（默认）
forge init             # 初始化项目配置
forge vibe <prompt>    # Vibe Coding（已有）
forge agent            # Agent 管理子命令
  agent list           # 列出可用 Agent
  agent use <id>       # 设置默认 Agent
  agent create         # 交互式创建新 Agent
forge skill            # Skill 管理子命令
  skill list           # 列出已安装 Skill
  skill install <url>  # 从远程安装 Skill
  skill run <name>     # 运行指定 Skill
forge mcp              # MCP 管理子命令
  mcp list             # 列出 MCP 服务
  mcp add <name>       # 添加 MCP 服务
forge wiki             # Wiki 知识库子命令
  wiki query <q>       # 查询知识库
  wiki import <file>   # 导入文档
forge config           # 配置管理
  config show          # 查看配置
  config set <key>     # 设置配置项
```

---

## Phase 2: 大模型配置与调用（2 周）

### 2.1 Core 包：模型提供商抽象层

**新增** `packages/core/src/models/`：

```
models/
  provider.ts     # ModelProvider 接口
  registry.ts     # ModelRegistry 单例
  providers/
    openai.ts     # OpenAI 兼容 API
    doubao.ts     # 豆包（已有，重构到此目录）
    anthropic.ts  # Anthropic Claude
    ollama.ts     # 本地 Ollama
    gemini.ts     # Google Gemini
```

**ModelProvider 接口**:
```typescript
interface ModelProvider {
  readonly id: string;
  readonly name: string;
  readonly online: boolean;    // true=云端, false=本地
  listModels(): Promise<ModelOption[]>;
  chat(
    messages: ChatMessage[],
    options?: ChatOptions
  ): AsyncGenerator<ChatChunk, AgentResponse, unknown>;
  validateConfig(): Promise<boolean>;  // 连通性测试
}
```

### 2.2 CLI 端：离线模型支持

- `forge config set model.provider ollama`
- `forge config set model.endpoint http://localhost:11434`
- `forge vibe "prompt"` 自动使用配置的模型

### 2.3 Web 端：真实 API 打通

- ModelHub 的"连通性测试"改为真实 HTTP ping
- vLLM 本地部署页面的启动/停止改为真实进程管理（通过子进程或 Docker API）
- 模型配置持久化：从 localStorage → core 的 conf 或后端 API

---

## Phase 3: Agent 开发与调用（2 周）

### 3.1 Core 包：Agent SDK

**新增** `packages/core/src/agent/sdk/`：

```
sdk/
  AgentBuilder.ts       # 链式 Agent 构建器
  ToolInterface.ts      # 工具接口
  AgentRuntime.ts       # Agent 运行时（沙箱执行）
  CodeInterpreter.ts    # 代码解释器（安全执行 Python/JS）
```

**AgentBuilder 用法示例**:
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

### 3.2 CLI 端：Agent 管理

`forge agent create` → 交互式向导创建 Agent → 保存到配置文件
`forge agent use <id>` → 切换默认 Agent

### 3.3 Web 端：AgentStudio 增强

- AgentStudio 的"沙箱对话"改为真实连续对话
- 新增 Agent 版本管理（每次编辑保存历史版本）
- 新增 Agent 导出/导入（JSON 格式跨平台共享）

---

## Phase 4: Skill Hub 能力（1.5 周）

### 4.1 Core 包：Skill 引擎

**新增** `packages/core/src/skill/`：

```
skill/
  Skill.ts              # Skill 接口定义
  SkillRegistry.ts      # Skill 注册表
  SkillRuntime.ts       # 沙箱执行环境
  builtin/              # 内置 Skill
    code-review.ts
    refactor.ts
    test-generate.ts
```

**Skill 接口**:
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

### 4.2 CLI 端：Skill 管理

- `forge skill list` — 列出已安装 Skill
- `forge skill install <url>` — 从 registry 或 URL 安装
- `forge skill run <name>` — 运行指定 Skill（输出到终端）

### 4.3 Web 端：SkillHub 增强

- Skill 执行改为真实后端调用（非 Mock）
- 新增 Skill 市场浏览（从远程 registry 发现 Skill）
- 新增 Skill 组合（拖拽多个 Skill 组成 Pipeline）

---

## Phase 5: MCP 管理（1.5 周）

### 5.1 什么是 MCP（Model Context Protocol）

MCP 是 Anthropic 提出的开放协议，让 AI 应用通过标准接口连接外部工具和数据源（数据库、API、文件系统等）。每个 MCP 服务是一个独立进程，通过 stdio 或 HTTP 与 AI 交互。

### 5.2 Core 包：MCP 客户端

**新增** `packages/core/src/mcp/`：

```
mcp/
  MCPClient.ts          # MCP 客户端（连接 stdio/HTTP 服务）
  MCPServer.ts          # MCP 服务接口
  MCPRegistry.ts        # MCP 服务注册表
  builtin/              # 内置 MCP 服务
    filesystem.ts       # 文件系统访问
    git.ts              # Git 操作
    terminal.ts         # 终端命令执行
```

**MCPClient 用法**:
```typescript
const mcp = new MCPClient({
  command: 'node',
  args: ['mcp-server-filesystem.js'],
  // 或通过 HTTP: { url: 'http://localhost:3100' }
});

await mcp.connect();
const tools = await mcp.listTools();
const result = await mcp.callTool('read_file', { path: './src/index.ts' });
```

### 5.3 CLI 端：MCP 管理

- `forge mcp list` — 列出已注册 MCP 服务
- `forge mcp add <name>` — 添加新 MCP 服务（通过 stdio 或 HTTP）
- `forge mcp remove <name>` — 移除 MCP 服务
- MCP 服务配置持久化到 `forge config`

### 5.4 Web 端：MCP 面板

- 新增 MCP 管理页面/标签页
- 可视化查看 MCP 服务状态（运行/停止）
- 浏览 MCP 服务提供的工具列表
- 测试调用 MCP 工具的交互式控制台

---

## Phase 6: Wiki 知识库（1.5 周）

### 6.1 Core 包：文档解析引擎

**新增** `packages/core/src/wiki/`：

```
wiki/
  DocumentParser.ts     # 文档解析器基类
  parsers/
    markdown.ts         # .md 解析
    text.ts             # .txt 解析
    pdf.ts              # .pdf 解析（PDF.js 或 pdf-parse）
    word.ts             # .docx 解析（mammoth 库）
  KnowledgeBase.ts      # 知识库管理器
  VectorStore.ts        # 向量存储接口
```

**文档解析**:
- `.md/.txt` — 直接读取文本
- `.pdf` — 使用 `pdf-parse` 提取文本
- `.docx` — 使用 `mammoth` 或 `docx` 库转为 Markdown

### 6.2 向量化与检索

- 解析后的文档内容分块（chunk，默认 500 token）
- 使用本地 `transformers.js` 或远程 API 生成嵌入向量
- 支持向量相似度搜索（余弦相似度）
- 关键词全文搜索（BM25 后备方案）

### 6.3 CLI 端：知识库查询

- `forge wiki import <file>` — 导入文档到知识库
- `forge wiki query <question>` — 基于知识库问答
- `forge wiki list` — 列出知识库中文档

### 6.4 Web 端：WikiKnowledgeBase 增强

- 新增 PDF/Word 文件导入和即时解析
- 新增文档层级树（parentId 实现）
- 新增全文搜索后端 API
- 新增文档间链接/引用
- 新增知识库迁移（导出/导入 JSON 格式）
- 新增知识库合并（两个知识库合并去重）

---

## Phase 7: 知识图谱深度集成（1.5 周）

### 7.1 Core 包：GraphBuilder

**新增** `packages/core/src/graph/`：

```
graph/
  GraphBuilder.ts       # 图谱构建器（AST 级别）
  GraphQuery.ts         # 图谱查询 DSL
  ImportAnalyzer.ts     # Import 关系提取
  CommunityDetector.ts  # 社区发现（调用 graphify 或自研）
  GraphCache.ts         # 增量更新缓存
```

**相比当前 graphify 的增强**:
- 实时增量更新（文件变更时自动更新部分图谱）
- AST 级别的精确解析（vs graphify 的正则近似）
- 导出为标准格式（兼容 graphify 的 graph.json 格式）
- CLI 端可直接查询图谱

### 7.2 CLI 端：图谱查询

- 知识图谱文件扫描（已有） + 图谱结构注入 AgentContext
- `forge graph query <node>` — 查询节点及其邻居
- `forge graph path <a> <b>` — 查询两节点间最短路径

### 7.3 Web 端：KnowledgeGraphView 增强

- 后端提供真实图谱数据（非前端正则生成）
- 支持增量更新（非全量重建）
- 节点拖拽交互
- 点击节点显示代码引用位置
- 图谱与 Wiki 知识库联动（文档节点与代码节点的关系可视化）

---

## 架构总图

```
┌─────────────────────────────────────────────────────────┐
│                     ForgeAI 平台                          │
├───────────────────────┬─────────────────────────────────┤
│     CLI (Ink)         │         Web (React 19)           │
│                       │                                  │
│  ┌─────────────────┐  │  ┌───────────────────────────┐   │
│  │ forge vibe       │  │  │ ForgeIDE (Monaco)          │   │
│  │ forge agent      │  │  │ ModelHub (模型配置)        │   │
│  │ forge skill      │  │  │ AgentStudio (Agent开发)    │   │
│  │ forge mcp        │  │  │ SkillHub (Skill管理)       │   │
│  │ forge wiki       │  │  │ MCP Manager (MCP管理)     │   │
│  │ forge graph      │  │  │ WikiKnowledgeBase          │   │
│  │ forge config     │  │  │ KnowledgeGraphView         │   │
│  └──────┬──────────┘  │  └──────────┬────────────────┘   │
│         │             │            │                      │
└─────────┼─────────────┴────────────┼──────────────────────┘
          │                          │
          └──────────┬───────────────┘
                     │
          ┌──────────▼───────────────────┐
          │       @forge-ai/core          │
          │                               │
          │  ┌─────────────────────────┐  │
          │  │ Agent 体系               │  │
          │  │  - AgentRegistry         │  │
          │  │  - AgentBuilder          │  │
          │  │  - AgentRuntime          │  │
          │  │  - BaseCodingAgent        │  │
          │  │  - Mock/Doubao/OpenAI/   │  │
          │  │    Anthropic/Ollama      │  │
          │  └─────────────────────────┘  │
          │                               │
          │  ┌─────────────────────────┐  │
          │  │ 模型提供商               │  │
          │  │  - ModelProvider 接口    │  │
          │  │  - ModelRegistry         │  │
          │  │  - OpenAI/Anthropic/     │  │
          │  │    Ollama/Gemini         │  │
          │  └─────────────────────────┘  │
          │                               │
          │  ┌─────────────────────────┐  │
          │  │ Skill 引擎              │  │
          │  │  - SkillRegistry        │  │
          │  │  - SkillRuntime         │  │
          │  │  - Builtin Skills       │  │
          │  └─────────────────────────┘  │
          │                               │
          │  ┌─────────────────────────┐  │
          │  │ MCP 客户端              │  │
          │  │  - MCPClient           │  │
          │  │  - MCPRegistry          │  │
          │  │  - Builtin MCP servers  │  │
          │  └─────────────────────────┘  │
          │                               │
          │  ┌─────────────────────────┐  │
          │  │ Wiki 知识库             │  │
          │  │  - DocumentParser       │  │
          │  │  - KnowledgeBase        │  │
          │  │  - VectorStore          │  │
          │  └─────────────────────────┘  │
          │                               │
          │  ┌─────────────────────────┐  │
          │  │ 知识图谱                │  │
          │  │  - GraphBuilder         │  │
          │  │  - GraphQuery           │  │
          │  │  - GraphCache           │  │
          │  └─────────────────────────┘  │
          │                               │
          │  ┌─────────────────────────┐  │
          │  │ 文件扫描 + 工具函数      │  │
          │  └─────────────────────────┘  │
          └───────────────────────────────┘
```

---

## 执行排期

| Phase | 内容 | 并行度 | 依赖 |
|-------|------|--------|------|
| **P1** | 基础设施统一 | CLI + Core 并行 | 无 |
| **P2** | 大模型配置与调用 | 模型层串行，CLI/Web 并行于其后 | 依赖 P1 |
| **P3** | Agent 开发与调用 | Core SDK → CLI + Web 并行 | 依赖 P1,P2 |
| **P4** | Skill Hub | Core SDK → CLI + Web 并行 | 依赖 P3（AgentRuntime） |
| **P5** | MCP 管理 | 独立于其他模块，可并行 | 依赖 P1 |
| **P6** | Wiki 知识库 | Core 解析器 → CLI + Web 并行 | 可独立于 P3/P4/P5 |
| **P7** | 知识图谱 | Core 构建器 → CLI + Web 并行 | 可独立于 P3/P4/P5 |

**推荐执行顺序**:

```
Week 1-2:  P1(基础) + P5(MCP，独立) + P6(Wiki，独立)    ← 3 路并行
Week 3-4:  P2(模型) + P7(图谱，独立)                     ← 2 路并行
Week 5-6:  P3(Agent) + P4(Skill)                         ← 串行于 P2 之后
```

---

## 技术选型说明

| 模块 | 选型 | 理由 |
|------|------|------|
| PDF 解析 | `pdf-parse` | 纯 JS 无外部依赖，Node 16+ 兼容 |
| DOCX 解析 | `mammoth` | 将 .docx 转为 Markdown，保留格式 |
| 向量嵌入 | `@xenova/transformers` (本地) 或 OpenAI API (云端) | 双模式：离线用小模型，在线用高质量 |
| 向量存储 | `chromadb` 或 `lancedb` | 轻量级嵌入式向量数据库 |
| MCP 协议 | 原生 stdio/HTTP | 遵循 Anthropic MCP 规范 |
| 图谱更新 | graphify --update + 自研增量 | graphify 做全量，自研做增量 |