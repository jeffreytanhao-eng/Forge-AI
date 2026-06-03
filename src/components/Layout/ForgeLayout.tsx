// 注意：这是一个示例更新。请先阅读现有 ForgeLayout.tsx 文件内容，然后手动合并以下 Vibe 集成代码
import { VibeComposer } from '../VibeIDE/VibeComposer';

// 在主 return JSX 中添加右侧面板：
// <VibeComposer workspaceFiles={currentWorkspaceFiles} />

export default function ForgeLayout() {
  // ... 现有代码
  return (
    <div className="flex h-screen">
      {/* 左侧 */}
      <div className="w-64 border-r">文件树</div>
      
      {/* 中央 Monaco */}
      <div className="flex-1">Monaco 编辑器</div>
      
      {/* 新增右侧 Vibe */}
      <VibeComposer workspaceFiles={currentWorkspaceFiles || []} />
    </div>
  );
}