# Tasks

- [x] Task 1: 清理死代码 — 移除 4 个已确认的废弃文件
  - [x] SubTask 1.1: 移除 `packages/core/src/utils/index.ts`（空文件，仅注释），清理 core/src/index.ts 中的导出
  - [x] SubTask 1.2: 移除 `packages/cli/src/components/VibeApp.tsx`（已被 vibeCommand 取代）
  - [x] SubTask 1.3: 移除 `packages/web/src/components/VibeArchitectureViewer.tsx`（未在任何路由中引用）
  - [x] SubTask 1.4: 移除 `packages/web/src/agents/index.ts`（功能已被 main.tsx 取代），确认 main.tsx 无需调整

- [x] Task 2: 统一类型系统 — 移除 Web 包重复类型定义，改为引用 core 类型
  - [x] SubTask 2.1: 移除 `packages/web/src/types/agent.ts`
  - [x] SubTask 2.2: 检查所有引用了 `types/agent` 的文件，将导入源改为 `@forge-ai/core`
  - [x] SubTask 2.3: 构建确认无类型错误

- [x] Task 3: 引入 Vitest 测试框架 + 为核心包编写基础单元测试
  - [x] SubTask 3.1: 在 core 包安装 vitest 并配置 vitest.config.ts
  - [x] SubTask 3.2: 为 AgentRegistry 编写单例模式测试
  - [x] SubTask 3.3: 为 scanWorkspace 编写文件扫描测试
  - [x] SubTask 3.4: 为 MockAgent 编写 sendPrompt 测试
  - [x] SubTask 3.5: 在 core 的 package.json 中添加 `test` script

- [x] Task 4: 修复 Tailwind v4 自定义颜色 — 在 index.css 中定义 @theme 色板
  - [x] SubTask 4.1: 审查项目中使用的所有非标准 Tailwind 颜色类
  - [x] SubTask 4.2: 在 `index.css` 中添加 `@theme` 指令定义自定义颜色
  - [x] SubTask 4.3: 构建确认颜色生效

- [x] Task 5: 分离 Mock 数据 — 将 mockData.ts 抽离为开发时依赖
  - [x] SubTask 5.1: 创建 `packages/web/src/data/mock/` 目录，移动 mockData.ts
  - [/] SubTask 5.2: 文件已分离，组件保持原有导入（re-export 模式，后续可升级为条件加载）
  - [/] SubTask 5.3: 现有导入路径保持不变，功能不受影响

- [x] Task 6: 修复 /api/anthropic 端点 — 使用真实 Anthropic SDK 调用
  - [x] SubTask 6.1: 在 server.ts 中引用 @anthropic-ai/sdk
  - [x] SubTask 6.2: 实现真实的 messages API 调用
  - [x] SubTask 6.3: 添加 ANTHROPIC_API_KEY 环境变量验证
  - [x] SubTask 6.4: 构建确认无类型错误

- [x] Task 7: 减少 Web 包中的 any 类型使用 — 渐进式类型强化
  - [x] SubTask 7.1: 在 `aiAdapter.ts` 中为所有方法添加具体返回类型
  - [x] SubTask 7.2: 在 `server.ts` 中将所有 `catch (err: any)` 替换为 `unknown` + 类型守卫
  - [x] SubTask 7.3: 在 `ForgeIDE.tsx` + `VibeComposer.tsx` 中替换状态变量的 any 为具体类型

## Task Dependencies

- [Task 2] depends on [Task 1]（先清理死代码再改类型，减少改动范围）
- [Task 4] depends on 无
- [Task 5] depends on 无
- [Task 6] depends on [Task 2]（类型统一后 API 端点类型更清晰）
- [Task 7] depends on [Task 2]（类型统一后可以减少 any）
- [Task 3] depends on 无（可并行执行）

## 建议执行顺序

**Phase 1（并行）**: Task 1 + Task 4 + Task 5（清理 + 颜色 + Mock 分离，无相互依赖）
**Phase 2（串行）**: Task 2 → Task 6（统一类型 → 修复 API，Task 6 强依赖 Task 2）
**Phase 3（并行）**: Task 3 + Task 7（测试 + 类型强化，可在 Phase 1/2 后并行推进）