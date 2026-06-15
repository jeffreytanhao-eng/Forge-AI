import React, { useState, useRef, useEffect } from 'react';
import { Terminal, ChevronRight } from 'lucide-react';

interface TerminalLine {
  type: 'input' | 'output' | 'system';
  text: string;
}

const COMMANDS: Record<string, string[]> = {
  'help': [
    'Forge AI CLI - 知识图谱驱动的终端 Vibe Coding 工具',
    '',
    '用法: forge <command> [options]',
    '',
    '命令:',
    '  vibe <prompt>     使用自然语言进行代码修改',
    '  agent             管理 AI Agent',
    '  config            管理配置',
    '  mcp               管理 MCP 服务',
    '  wiki              管理 Wiki 知识库',
    '  graph             管理知识图谱',
    '  skill             管理 Skill',
    '',
    '选项:',
    '  -h, --help        显示帮助信息',
    '  -V, --version     显示版本号',
    '  -a, --agent <id>  指定 Agent',
    '',
    '运行 "forge <command> --help" 查看子命令详情',
  ],
  'version': ['Forge AI CLI v0.1.0'],
  'agent': [
    '用法: forge agent <command>',
    '',
    '子命令:',
    '  list              列出所有已注册的 Agent',
    '  use <id>          设置默认 Agent',
    '  create            交互式创建新 Agent',
  ],
  'agent list': [
    '已注册的 Agent:',
    '',
    '  ★ mock       Mock Agent (默认)',
    '    claude     Claude AI Agent',
    '    doubao     豆包 AI Agent',
    '    vibe       Vibe Coding Agent',
  ],
  'config': [
    '用法: forge config <command>',
    '',
    '子命令:',
    '  show              显示当前配置',
    '  set <key> <val>   设置配置项',
  ],
  'config show': [
    '当前配置:',
    '',
    '  defaultAgent: mock',
    '  model.provider: anthropic',
    '  model.apiKey: sk-****',
    '  model.modelName: claude-3-5-sonnet',
    '  mcp.autoConnect: true',
  ],
  'skill': [
    '用法: forge skill <command>',
    '',
    '子命令:',
    '  list              列出所有 Skill',
    '  run <id>          执行 Skill',
    '  install <path>    从文件安装 Skill',
    '  export            导出所有 Skill',
  ],
  'skill list': [
    '已安装的 Skill:',
    '',
    '  code-review     v1.0   代码审查',
    '  refactor        v1.0   代码重构',
    '  test-generate   v1.0   测试生成',
  ],
  'mcp': [
    '用法: forge mcp <command>',
    '',
    '子命令:',
    '  list              列出所有 MCP 服务',
    '  add <id>          添加 MCP 服务',
    '  remove <id>       移除 MCP 服务',
    '  connect           连接所有 MCP 服务',
    '  disconnect        断开所有 MCP 服务',
    '  test <id> <tool>  测试 MCP 工具调用',
  ],
  'mcp list': [
    'MCP 服务列表:',
    '',
    '  filesystem   已连接   stdio',
    '  git          已连接   stdio',
    '  terminal     已连接   stdio',
  ],
  'graph': [
    '用法: forge graph <command>',
    '',
    '子命令:',
    '  build             构建代码知识图谱',
    '  query <name>      查询节点',
    '  path <a> <b>      查找最短路径',
    '  stats             图谱统计',
    '  update            增量更新',
  ],
  'graph stats': [
    '知识图谱统计:',
    '',
    '  总节点数:    1,247',
    '  总边数:      3,892',
    '  社区数:      42',
    '',
    '  节点类型分布:',
    '    function:  523',
    '    class:     187',
    '    interface: 96',
    '    variable:  312',
    '    module:    84',
    '    file:      45',
  ],
  'wiki': [
    '用法: forge wiki <command>',
    '',
    '子命令:',
    '  import <file>     导入文档到知识库',
    '  query <question>  搜索知识库',
    '  list              列出所有文档',
    '  export <path>     导出知识库',
    '  merge <path>      合并知识库',
  ],
  'wiki list': [
    '知识库文档:',
    '',
    '  1. Forge 架构设计        .md   2026-06-12',
    '  2. Agent SDK 文档        .md   2026-06-11',
    '  3. MCP 协议规范          .pdf  2026-06-10',
    '  4. API 参考              .md   2026-06-09',
  ],
  'clear': [],
};

const WELCOME_LINES: TerminalLine[] = [
  { type: 'system', text: '╔══════════════════════════════════════════╗' },
  { type: 'system', text: '║         Forge AI CLI v0.1.0             ║' },
  { type: 'system', text: '║     知识图谱驱动的 Vibe Coding 工具      ║' },
  { type: 'system', text: '╚══════════════════════════════════════════╝' },
  { type: 'system', text: '' },
  { type: 'system', text: '输入 "forge --help" 查看所有可用命令。' },
  { type: 'system', text: '输入 "forge <command> --help" 查看子命令详情。' },
  { type: 'system', text: '输入 "clear" 清屏。' },
  { type: 'system', text: '' },
];

export default function ForgeCLI() {
  const [lines, setLines] = useState<TerminalLine[]>(WELCOME_LINES);
  const [input, setInput] = useState('');
  const [history, setHistory] = useState<string[]>([]);
  const [historyIdx, setHistoryIdx] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);
  const terminalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (terminalRef.current) {
      terminalRef.current.scrollTop = terminalRef.current.scrollHeight;
    }
  }, [lines]);

  const processCommand = (cmd: string) => {
    const trimmed = cmd.trim();
    if (!trimmed) return;

    const newLines: TerminalLine[] = [
      ...lines,
      { type: 'input', text: `$ ${trimmed}` },
    ];

    const normalized = trimmed
      .replace(/^forge\s+/, '')
      .replace(/\s+--help$/, ' --help')
      .trim();

    let output: string[];
    if (trimmed === 'clear') {
      setLines(WELCOME_LINES);
      return;
    } else if (COMMANDS[normalized]) {
      output = COMMANDS[normalized];
    } else if (COMMANDS[normalized.replace(/\s+--help$/, '')]) {
      output = [`forge: '${normalized}' 不是有效的子命令。`, '', `运行 "forge --help" 查看所有命令。`];
    } else if (trimmed.startsWith('forge vibe ')) {
      const prompt = trimmed.slice(11);
      output = [
        `[Vibe Coding] 正在处理: "${prompt}"`,
        '',
        '  1/3  扫描工作区文件... 完成 (42 个文件)',
        '  2/3  加载知识图谱上下文... 完成 (1,247 个节点)',
        '  3/3  调用 Agent (mock)... 完成',
        '',
        '  ┌─ 执行计划 ──────────────────────────────┐',
        '  │  1. 分析当前代码结构                      │',
        '  │  2. 生成代码变更                          │',
        '  │  3. 应用修改到目标文件                    │',
        '  └──────────────────────────────────────────┘',
        '',
        '  变更预览 (共 2 个文件):',
        '    1. src/app.ts — 添加新路由处理',
        '    2. src/utils/helper.ts — 扩展工具函数',
        '',
        '  输入 "forge diff" 查看变更详情。',
      ];
    } else if (trimmed === 'forge diff') {
      output = [
        '  变更详情:',
        '',
        '  ─── src/app.ts ─────────────────────────────',
        '  @@ -12,6 +12,10 @@',
        '   import { Router } from "express";',
        '  +import { authMiddleware } from "./middleware";',
        '  +',
        '  +router.use("/api", authMiddleware);',
        '',
        '  描述: 添加新路由处理',
        '',
        '  ─── src/utils/helper.ts ────────────────────',
        '  @@ -1,3 +1,7 @@',
        '  -export function helper() {',
        '  +export function helper(input?: string) {',
        '  +  if (!input) return "default";',
        '     return input.trim();',
        '',
        '  描述: 扩展工具函数',
        '',
        '  输入 "forge apply" 应用变更。',
      ];
    } else if (trimmed === 'forge apply') {
      output = ['正在应用变更...', '', '  ✓ src/app.ts 已更新', '  ✓ src/utils/helper.ts 已更新', '', '变更已全部应用。'];
    } else if (trimmed === 'forge agent create') {
      output = [
        '正在交互式创建 Agent...',
        '',
        '  ? Agent ID: my-agent',
        '  ? 名称: 我的自定义 Agent',
        '  ? 描述: 自定义开发助手',
        '  ? 系统提示词: 你是一个专业的代码助手...',
        '  ? 选择模型: claude-3-5-sonnet',
        '  ? 启用工具: [ReadFile, EditFile, ExecuteCommand]',
        '',
        '  ✓ Agent "my-agent" 创建成功！',
        '  运行 "forge agent list" 查看。',
      ];
    } else {
      output = [`forge: 未知命令 '${trimmed}'`, `运行 "forge --help" 查看所有命令。`];
    }

    const outputLines: TerminalLine[] = output.map(t => ({ type: 'output', text: t }));
    setLines([...newLines, ...outputLines]);
    setHistory(prev => [...prev, trimmed]);
    setHistoryIdx(-1);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      processCommand(input);
      setInput('');
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (history.length > 0) {
        const newIdx = historyIdx === -1 ? history.length - 1 : Math.max(0, historyIdx - 1);
        setHistoryIdx(newIdx);
        setInput(history[newIdx]);
      }
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (historyIdx >= 0) {
        const newIdx = historyIdx + 1;
        if (newIdx >= history.length) {
          setHistoryIdx(-1);
          setInput('');
        } else {
          setHistoryIdx(newIdx);
          setInput(history[newIdx]);
        }
      }
    }
  };

  return (
    <div className="h-full bg-black flex flex-col" onClick={() => inputRef.current?.focus()}>
      <div className="flex items-center gap-2 px-4 py-2 bg-zinc-900 border-b border-zinc-800 shrink-0">
        <Terminal className="w-4 h-4 text-green-400" />
        <span className="text-green-400 font-mono text-sm font-semibold">Forge AI CLI</span>
        <span className="text-zinc-600 text-xs ml-auto">forge v0.1.0</span>
      </div>
      <div
        ref={terminalRef}
        className="flex-1 overflow-y-auto p-4 font-mono text-sm leading-relaxed"
        style={{ backgroundColor: '#0a0a0a' }}
      >
        {lines.map((line, i) => (
          <div key={i} className="whitespace-pre-wrap">
            {line.type === 'input' ? (
              <span className="text-green-400">
                <span className="text-cyan-400">user@forge</span>
                <span className="text-zinc-500">:</span>
                <span className="text-blue-400">~</span>
                <span className="text-zinc-500">$ </span>
                {line.text.replace('$ ', '')}
              </span>
            ) : line.type === 'system' ? (
              <span className="text-zinc-400">{line.text}</span>
            ) : (
              <span className="text-zinc-300">{line.text}</span>
            )}
          </div>
        ))}
        <div className="flex items-center mt-1">
          <span className="text-green-400 shrink-0">
            <span className="text-cyan-400">user@forge</span>
            <span className="text-zinc-500">:</span>
            <span className="text-blue-400">~</span>
            <span className="text-zinc-500">$ </span>
          </span>
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            className="flex-1 bg-transparent text-green-400 outline-none border-none ml-0 font-mono"
            spellCheck={false}
            autoFocus
            placeholder="输入命令..."
          />
        </div>
      </div>
      <div className="flex items-center gap-3 px-4 py-1.5 bg-zinc-900 border-t border-zinc-800 shrink-0 text-xs font-mono">
        <span className="text-green-400">●</span>
        <span className="text-zinc-500">Agent:</span>
        <span className="text-cyan-400">mock</span>
        <span className="text-zinc-600">|</span>
        <span className="text-zinc-500">MCP:</span>
        <span className="text-green-400">3 已连接</span>
        <span className="text-zinc-600">|</span>
        <span className="text-zinc-500">图谱:</span>
        <span className="text-zinc-300">1,247 节点</span>
      </div>
    </div>
  );
}