export interface ToolParameter {
  name: string;
  description: string;
  type: 'string' | 'number' | 'boolean' | 'object';
  required?: boolean;
}

export interface Tool {
  name: string;
  description: string;
  parameters: ToolParameter[];
  execute(params: Record<string, unknown>): Promise<string>;
}

export class ReadFileTool implements Tool {
  name = 'read_file';
  description = '读取文件内容';
  parameters: ToolParameter[] = [
    { name: 'path', description: '文件路径', type: 'string', required: true },
  ];

  async execute(params: Record<string, unknown>): Promise<string> {
    const fs = await import('fs/promises');
    const filePath = params.path as string;
    try {
      const content = await fs.readFile(filePath, 'utf-8');
      return content;
    } catch (err) {
      return `Error reading file: ${err instanceof Error ? err.message : 'Unknown error'}`;
    }
  }
}

export class EditFileTool implements Tool {
  name = 'edit_file';
  description = '编辑文件内容';
  parameters: ToolParameter[] = [
    { name: 'path', description: '文件路径', type: 'string', required: true },
    { name: 'content', description: '新文件内容', type: 'string', required: true },
  ];

  async execute(params: Record<string, unknown>): Promise<string> {
    const fs = await import('fs/promises');
    const filePath = params.path as string;
    const content = params.content as string;
    try {
      await fs.writeFile(filePath, content, 'utf-8');
      return `Successfully wrote ${filePath}`;
    } catch (err) {
      return `Error writing file: ${err instanceof Error ? err.message : 'Unknown error'}`;
    }
  }
}

export class ExecuteCommandTool implements Tool {
  name = 'execute_command';
  description = '执行终端命令';
  parameters: ToolParameter[] = [
    { name: 'command', description: '要执行的命令', type: 'string', required: true },
  ];

  async execute(params: Record<string, unknown>): Promise<string> {
    const { exec } = await import('child_process');
    const command = params.command as string;
    return new Promise((resolve) => {
      exec(command, { timeout: 30000 }, (err, stdout, stderr) => {
        if (err) {
          resolve(`Error: ${err.message}\n${stderr}`);
        } else {
          resolve(stdout || '(no output)');
        }
      });
    });
  }
}

export class SearchCodebaseTool implements Tool {
  name = 'search_codebase';
  description = '在代码库中搜索文本';
  parameters: ToolParameter[] = [
    { name: 'pattern', description: '搜索模式', type: 'string', required: true },
    { name: 'path', description: '搜索路径', type: 'string', required: false },
  ];

  async execute(params: Record<string, unknown>): Promise<string> {
    const fs = await import('fs/promises');
    const { join } = await import('path');
    const pattern = params.pattern as string;
    const searchPath = join(process.cwd(), (params.path as string) || '');

    async function searchDir(dir: string, depth: number = 0): Promise<string[]> {
      if (depth > 5) return [];
      const results: string[] = [];
      try {
        const entries = await fs.readdir(dir, { withFileTypes: true });
        for (const entry of entries) {
          const fullPath = join(dir, entry.name);
          if (entry.isDirectory()) {
            if (!entry.name.startsWith('.') && entry.name !== 'node_modules') {
              const nested = await searchDir(fullPath, depth + 1);
              results.push(...nested);
            }
          } else if (entry.isFile()) {
            try {
              const content = await fs.readFile(fullPath, 'utf-8');
              if (content.includes(pattern)) {
                results.push(fullPath);
              }
            } catch {}
          }
        }
      } catch {}
      return results;
    }

    const matches = await searchDir(searchPath);
    if (matches.length === 0) return 'No matches found';
    return `Found ${matches.length} matches:\n${matches.join('\n')}`;
  }
}

export const builtinTools: Tool[] = [
  new ReadFileTool(),
  new EditFileTool(),
  new ExecuteCommandTool(),
  new SearchCodebaseTool(),
];