import { describe, it, expect } from 'vitest';
import { scanWorkspace } from '../utils/file-scanner.js';
import path from 'path';
import fs from 'fs';

describe('scanWorkspace 集成测试', () => {
  it('扫描当前项目返回 .ts 文件', async () => {
    const files = await scanWorkspace(process.cwd(), 20, 500);
    const tsFiles = files.filter(f => f.path.endsWith('.ts'));
    expect(tsFiles.length).toBeGreaterThan(0);
  });

  it('内容截断逻辑工作正常', async () => {
    const files = await scanWorkspace(process.cwd(), 3, 1);
    for (const file of files) {
      expect(file.content).toContain('（内容已截断）');
    }
  });

  it('扫描空目录返回空数组', async () => {
    const emptyDir = path.join(__dirname, '../../.test-empty');
    fs.mkdirSync(emptyDir, { recursive: true });
    const files = await scanWorkspace(emptyDir, 10, 500);
    expect(files.length).toBe(0);
    fs.rmSync(emptyDir, { recursive: true, force: true });
  });

  it('maxFiles 限制生效', async () => {
    const files = await scanWorkspace(process.cwd(), 3, 500);
    expect(files.length).toBeLessThanOrEqual(3);
  });
});