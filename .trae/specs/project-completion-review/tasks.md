# Tasks

- [x] Task 1: Core 包完成度评估
  - [x] SubTask 1.1: 评估 agent 模块 — 确认 4 个 Agent 实现 (Mock/Claude/Doubao/Vibe) 均正常工作
  - [x] SubTask 1.2: 评估 sdk 模块 — 确认 AgentBuilder + AgentRuntime + ToolInterface 完整
  - [x] SubTask 1.3: 评估 models 模块 — 确认 4 个 Provider (OpenAI/Anthropic/Ollama/Gemini) 接口完整
  - [x] SubTask 1.4: 评估 mcp 模块 — 确认 MCPClient(stdio/HTTP) + MCPRegistry + 内置服务
  - [x] SubTask 1.5: 评估 wiki 模块 — 确认 4 个解析器 + KnowledgeBase + VectorStore
  - [x] SubTask 1.6: 评估 graph 模块 — 确认 GraphBuilder(AST) + GraphCache + GraphQuery
  - [x] SubTask 1.7: 评估 skill 模块 — 确认 SkillRegistry + SkillRuntime + 3 个内置 Skill
  - [x] SubTask 1.8: 评估 config 模块 — 确认 forgeConfig 持久化配置
  - [x] SubTask 1.9: 运行 core 包测试并统计通过率 — 12 个测试文件，48 个测试用例，全部通过 ✅
  - [x] SubTask 1.10: 运行 core 包类型检查确认零错误 — tsc --noEmit 零错误 ✅

- [x] Task 2: CLI 包完成度评估
  - [x] SubTask 2.1: 验证 7 个命令注册 (vibe/agent/config/mcp/wiki/graph/skill)
  - [x] SubTask 2.2: 验证 agent 命令 (list/use/create)
  - [x] SubTask 2.3: 验证 config 命令 (show/set)
  - [x] SubTask 2.4: 验证 mcp 命令 (list/add/remove/connect/disconnect/test)
  - [x] SubTask 2.5: 验证 wiki 命令 (import/query/list/export/merge)
  - [x] SubTask 2.6: 验证 graph 命令 (build/query/path/stats/update)
  - [x] SubTask 2.7: 验证 skill 命令 (list/run/install/export)
  - [x] SubTask 2.8: 运行 CLI 类型检查确认零错误 — tsc --noEmit 零错误 ✅

- [x] Task 3: Web 包完成度评估
  - [x] SubTask 3.1: 确认 8 个标签页组件 (CodeX/Model Hub/Agent Studio/Knowledge Graph/Skill Hub/MCP/Wiki/Branding)
  - [x] SubTask 3.2: 确认 MCPManager 面板功能完整
  - [x] SubTask 3.3: 确认 App 路由正确包含 mcp 标签页
  - [x] SubTask 3.4: 确认 Agent 体系已使用 Core AgentRegistry (无 Web 端重复)
  - [x] SubTask 3.5: 运行 Web 类型检查确认零错误 — ✅ 已修复！tsc --noEmit 零错误
  - [x] SubTask 3.6: 检查数据流: 状态管理 (Zustand) → 组件 → API → Core

- [x] Task 4: 测试覆盖评估
  - [x] SubTask 4.1: 统计当前测试数量与覆盖率 — Core 12 个测试文件 48 个测试用例，CLI/Web 零测试
  - [x] SubTask 4.2: 评估测试覆盖缺口 — CLI/Web 无测试覆盖
  - [x] SubTask 4.3: 识别高优先级需要补充测试的模块 — Web API 端点、CLI 命令、Graph 模块

- [x] Task 5: 已知问题验证
  - [x] SubTask 5.1: 检查 Web 包 any 类型分布并统计数量 — ~120+ 处隐式 any，分布在所有 10+ 组件中
  - [x] SubTask 5.2: 检查 API 端点 Mock 实现情况 — /api/skill/execute 仍为 Mock，/api/anthropic 已修复为真实调用
  - [x] SubTask 5.3: 检查 Mock 数据体积与生产构建包含情况 — mockData.ts 已分离到 data/mock/
  - [x] SubTask 5.4: 检查 Tailwind 自定义颜色定义情况 — index.css @theme 已定义
  - [x] SubTask 5.5: 检查死代码残留情况 — 已清理完毕（无残留）

## Task Dependencies

- [Task 1] 无依赖（可独立执行)
- [Task 2] 依赖 [Task 1] 完成以获取 Core 导出 API
- [Task 3] 依赖 [Task 1] 完成以确认 AgentRegistry 统一
- [Task 4] 依赖 [Task 1] 完成以统计测试
- [Task 5] 依赖全部 Task 完成后汇总

## 修复执行记录

以下为遗留问题修复工作，于 2026-06-12 完成：

- [x] **Fix A: Web 类型检查** — 安装 @types/react@19 + @types/react-dom，修复全部 ~150 类型错误
  - Changed: `tsconfig.json` (allowImportingTsExtensions, noEmit, skipLibCheck)
  - Changed: `src/main.tsx` (移除 .tsx 扩展名)
  - Changed: 所有 10+ 组件 (修复隐式 any, props 类型)
  - Changed: `src/types.ts` (扩展 LocalServeInstance)
  - Changed: `VibeComposer.tsx` (AgentResponse vs VibeDiff 对齐)
- [x] **Fix B: /api/skill/execute 真实调用** — 使用 Core SkillRuntime 替代 Mock
  - Changed: `packages/web/server.ts`
- [x] **Fix C: PDF/Word 解析器依赖** — 安装 pdf-parse + mammoth
  - Changed: `packages/core/package.json`
- [x] **Fix D: CI/CD 配置** — 创建 GitHub Actions workflow
  - Added: `.github/workflows/ci.yml`
  - Changed: `turbo.json` (添加 test pipeline)
  - Changed: `package.json` (添加 test script)

## 执行顺序

**Phase 1（并行）**: Task 1 + Task 2 + Task 3（Core / CLI / Web 独立评估）
**Phase 2（串行）**: Task 4（测试覆盖，依赖 Task 1 统计）
**Phase 3（串行）**: Task 5（已知问题汇总，依赖全部前置）