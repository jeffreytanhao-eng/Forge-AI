# Check List

## Phase 1: 清理与基础设施
- [ ] Task 1: 死代码清理
  - [ ] `packages/core/src/utils/index.ts` 已移除，core/src/index.ts 导出已清理
  - [ ] `packages/cli/src/components/VibeApp.tsx` 已移除，CLI 构建通过
  - [ ] `packages/web/src/components/VibeArchitectureViewer.tsx` 已移除，Web 构建通过
  - [ ] `packages/web/src/agents/index.ts` 已移除，且无文件引用它
- [ ] Task 4: Tailwind 颜色修复
  - [ ] `index.css` 中已定义 `@theme` 指令，包含所有使用的自定义颜色
  - [ ] Web 构建通过，颜色正确渲染
- [ ] Task 5: Mock 数据分离
  - [ ] mockData.ts 已移入 `src/data/mock/` 目录
  - [ ] 组件仅在开发模式下加载 mock 数据
  - [ ] 无 mock 数据时组件正常降级显示

## Phase 2: 类型与 API
- [ ] Task 2: 类型统一
  - [ ] `packages/web/src/types/agent.ts` 已移除
  - [ ] 所有 Web 组件和 Agent 改用 `@forge-ai/core` 的类型
  - [ ] `@forge-ai/core` 的类型定义已导出 `AgentDiff`, `AgentContext`, `AgentResponse`, `CodingAgent`
  - [ ] `sendPrompt()`, `sendPromptStream()` 的 context 参数统一使用 `AgentContext`
  - [ ] 构建通过，无类型错误
- [ ] Task 6: API 端点修复
  - [ ] `/api/anthropic` 使用 `@anthropic-ai/sdk` 真实调用
  - [ ] 流式响应正常工作
  - [ ] 无 `ANTHROPIC_API_KEY` 时返回友好错误提示

## Phase 3: 质量提升
- [ ] Task 3: 测试覆盖
  - [ ] vitest 已安装并配置
  - [ ] `pnpm --filter @forge-ai/core test` 可运行
  - [ ] AgentRegistry 单例测试通过
  - [ ] scanWorkspace 文件扫描测试通过
  - [ ] MockAgent sendPrompt 测试通过
- [ ] Task 7: 减少 any 类型
  - [ ] `aiAdapter.ts` 中所有函数有具体返回类型
  - [ ] `server.ts` 路由处理函数有 TypeScript 类型
  - [ ] `ForgeIDE.tsx` 中无 `any` 类型的状态变量
  - [ ] `Web` 包 strict 模式无 `any` 类型错误

## 最终验证
- [ ] Core 包 `pnpm run build` 通过
- [ ] CLI 包 `pnpm run build` 通过
- [ ] Web 包 `pnpm run build` 通过
- [ ] TurboRepo `pnpm run build` 全量构建通过
- [ ] 所有子包 `pnpm run type-check` 通过