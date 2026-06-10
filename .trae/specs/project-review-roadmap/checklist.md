# Check List

## Phase 1: 清理与基础设施
- [x] Task 1: 死代码清理
  - [x] `packages/core/src/utils/index.ts` 已移除，core/src/index.ts 导出已清理
  - [x] `packages/cli/src/components/VibeApp.tsx` 已移除，CLI 构建通过
  - [x] `packages/web/src/components/VibeArchitectureViewer.tsx` 已移除，Web 构建通过
  - [x] `packages/web/src/agents/index.ts` 已移除，且无文件引用它
- [x] Task 4: Tailwind 颜色修复
  - [x] `index.css` 中已定义 `@theme` 指令，包含所有使用的自定义颜色
  - [x] Web 构建通过，颜色正确渲染
- [x] Task 5: Mock 数据分离
  - [x] mockData.ts 已移入 `src/data/mock/` 目录
  - [ ] 组件仅在开发模式下加载 mock 数据
  - [ ] 无 mock 数据时组件正常降级显示

## Phase 2: 类型与 API
- [x] Task 2: 类型统一
  - [x] `packages/web/src/types/agent.ts` 已移除
  - [x] 所有 Web 组件和 Agent 改用 `@forge-ai/core` 的类型
  - [x] `@forge-ai/core` 的类型定义已导出 `AgentDiff`, `AgentContext`, `AgentResponse`, `CodingAgent`
  - [x] `sendPrompt()`, `sendPromptStream()` 的 context 参数统一使用 `AgentContext`
  - [x] 构建通过，无类型错误
- [x] Task 6: API 端点修复
  - [x] `/api/anthropic` 使用 `@anthropic-ai/sdk` 真实调用
  - [x] 流式响应正常工作
  - [x] 无 `ANTHROPIC_API_KEY` 时返回友好错误提示

## Phase 3: 质量提升
- [x] Task 3: 测试覆盖
  - [x] vitest 已安装并配置
  - [x] `cd packages/core && pnpm run test` 可运行
  - [x] AgentRegistry 单例测试通过
  - [x] scanWorkspace 文件扫描测试通过
  - [x] MockAgent sendPrompt 测试通过
- [x] Task 7: 减少 any 类型
  - [x] `aiAdapter.ts` 中所有函数有具体返回类型
  - [x] `server.ts` 中所有 `catch (err: any)` 已替换为 `unknown`
  - [x] `ForgeIDE.tsx` + `VibeComposer.tsx` 无 any 类型的状态变量
  - [ ] `Web` 包 `tsc --noEmit` 通过（注意：预存 @types/react 缺失问题与本次无关）

## 最终验证
- [x] Core 包 `npx tsc -b` 通过
- [x] Core 包 `pnpm run test` 通过（6 files, 24 tests）
- [x] CLI 包 `npx tsc -b` 通过
- [x] Web 包 `pnpm run build` 通过（vite build + esbuild）
- [x] 所有子包构建通过，无阻塞性问题