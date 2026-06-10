import fs from 'fs/promises';
import path from 'path';

export interface ScannedFile {
  path: string;
  content: string;
}

const CODE_EXTENSIONS = ['.ts', '.tsx', '.js', '.jsx', '.py', '.go', '.java'];

export async function scanWorkspace(
  rootDir: string = process.cwd(),
  maxFiles: number = 30,
  maxContentLength: number = 800
): Promise<ScannedFile[]> {
  const files: ScannedFile[] = [];

  async function walk(dir: string) {
    if (files.length >= maxFiles) return;

    const entries = await fs.readdir(dir, { withFileTypes: true });

    for (const entry of entries) {
      if (files.length >= maxFiles) break;

      const fullPath = path.join(dir, entry.name);
      const relativePath = path.relative(rootDir, fullPath);

      if (
        entry.name === 'node_modules' ||
        entry.name === '.git' ||
        entry.name === 'dist' ||
        entry.name.startsWith('.')
      ) {
        continue;
      }

      if (entry.isDirectory()) {
        await walk(fullPath);
      } else if (CODE_EXTENSIONS.some(ext => entry.name.endsWith(ext))) {
        try {
          const content = await fs.readFile(fullPath, 'utf-8');
          const truncated = content.length > maxContentLength
            ? content.slice(0, maxContentLength) + '\n...（内容已截断）'
            : content;

          files.push({
            path: relativePath,
            content: truncated,
          });
        } catch {
          // 忽略无法读取的文件
        }
      }
    }
  }

  try {
    await walk(rootDir);
  } catch {
    // 如果目录不存在或无法访问，返回空数组
  }
  return files;
}