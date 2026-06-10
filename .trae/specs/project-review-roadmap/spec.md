# Project Review & Roadmap Spec

## Why

项目已达到 MVP（最小可行产品）状态，但存在类型重复、死代码、零测试覆盖等问题，需要通过系统性审查明确完成度，规划优先级，确保后续迭代方向清晰。

## Current State Summary

### 已实现功能

| 模块 | 功能 | 状态 |
|------|------|------|
| Core 类型系统 | AgentDiff, AgentContext, AgentResponse, CodingAgent 接口 | ✅ 完成 |
| Core Agent 框架 | BaseCodingAgent 抽象类、AgentRegistry 单例 | ✅ 完成 |
| Core Agent 实现 | MockAgent（测试用）、DoubaoAgent（豆包大模型） | ✅ 完成 |
| Core 文件扫描 | scanWorkspace() 扫描 .ts/.tsx/.js/.jsx/.py/.go/.java 代码文件 | ✅ 完成 |
| CLI 入口 | Commander 命令行解析，forge vibe \<prompt\> 命令 | ✅ 完成 |
| CLI Agent 选择 | ink-select-input 交互式选择器，支持 --agent 参数 | ✅ 完成 |
| CLI Diff 预览 | Ink 键盘驱动的变更预览（↑↓ 选择、Enter 接受、A/R/Esc） | ✅ 完成 |
| CLI 流式支持 | 兼容 sendPromptStream 流式调用 | ✅ 完成 |
| CLI 配置持久化 | conf 包存储 defaultAgent | ✅ 完成 |
| 知识图谱 | graphify 图谱构建（370 节点 / 527 边 / 23 社区） | ✅ 完成 |
| CLI 图谱注入 | scanWorkspace + loadKnowledgeGraph 注入 AgentContext | ✅ 完成 |
| Web 前端 | React 19 + Vite 6 + Express 完整前端（7 个标签页） | ✅ 完成 |
| Web Agent 体系 | VibeAgent、ClaudeAgent、独立 AgentRegistry | ✅ 完成 |
| Web API 服务 | 13 个 API 端点（vibe、agent、skill、wiki、anthropic 等） | ✅ 完成 |

### 已知问题

| 问题 | 严重度 | 说明 |
|------|--------|------|
| **Core 与 Web 类型重复** | 🔴 高 | types/agent.ts 与 core types/index.ts 几乎相同 |
| **零测试覆盖** | 🔴 高 | 无任何 *.test.ts / *.spec.ts / 测试配置 |
| **Any 类型泛滥** | 🔴 高 | Web 包大量使用 any，放弃类型检查 |
| **死代码** | 🟡 中 | core/utils/index.ts(空)、VibeArchitectureViewer(未引用)、VibeApp.tsx(未调用)、agents/index.ts(冗余) |
| **Tailwind 自定义颜色** | 🟡 中 | 使用非标准颜色类（slate-850, zinc-350 等）未在 @theme 定义 |
| **API 端点 Mock** | 🟡 中 | /api/anthropic 永远返回 Mock，/api/skill/execute 无真实执行 |
| **Mock 数据体积** | 🟡 中 | mockData.ts 830+ 行，生产构建包含全部 |
| **颜色配置缺失** | 🟢 低 | Tailwind v4 需要 @theme 指令定义自定义颜色 |
| **组件复用** | 🟢 低 | CLI 的 VibeApp.tsx 与 vibeCommand 功能重叠 |

## What Changes (Total Rebuild: ALL items)

VibeApp.tsx 已经是被替代的死代码应移除; core/utils/index.ts 空文件移除; web 中 VibeArchitectureViewer 未在任何路由引用应移除; agents/index.ts 仅有冗余 re-export 应移除; 移除 web/types/agent.ts 改用 core 类型

- **移除死代码**: 清理 4 个无用文件
- **统一类型系统**: 删除 web/types/agent.ts，统一使用 @forge-ai/core 类型
- **引入测试**: 为 core 添加 Vitest + 核心单元测试
- **修复 Tailwind 颜色**: index.css 中定义 @theme 自定义颜色
- **分离 Mock 数据**: 抽离 mockData.ts 到独立的 dev 目录
- **完善 API**: 修复 /api/anthropic 实现真实调用
- **减少 any**: 逐步替换 Web 包中的 any 类型

## Impact

- Affected specs: 项目链路
- Affected code: core/src/utils/index.ts, cli/src/components/VibeApp.tsx, web/src/types/agent.ts, web/src/agents/index.ts, web/src/components/VibeArchitectureViewer.tsx, web/src/data/mockData.ts