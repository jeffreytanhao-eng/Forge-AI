import { describe, it, expect } from 'vitest';
import path from 'path';
import { scanWorkspace } from '../utils/file-scanner.js';

describe('scanWorkspace', () => {
  const testDir = path.resolve(__dirname, '..');

  it('扫描当前目录返回文件', async () => {
    const files = await scanWorkspace(testDir, 10, 800);

    expect(Array.isArray(files)).toBe(true);
    expect(files.length).toBeGreaterThan(0);

    for (const file of files) {
      expect(file).toHaveProperty('path');
      expect(file).toHaveProperty('content');
      expect(typeof file.path).toBe('string');
      expect(typeof file.content).toBe('string');
    }
  });

  it('maxFiles 限制', async () => {
    const files = await scanWorkspace(testDir, 3, 800);

    expect(files.length).toBeLessThanOrEqual(3);
  });

  it('maxContentLength 截断', async () => {
    const shortLimit = 50;
    const files = await scanWorkspace(testDir, 5, shortLimit);

    for (const file of files) {
      if (file.content.length > shortLimit) {
        expect(file.content).toContain('（内容已截断）');
      }
    }
  });

  it('扫描不存在的目录返回空数组', async () => {
    const files = await scanWorkspace('/nonexistent/path', 10, 800);
    expect(Array.isArray(files)).toBe(true);
    expect(files.length).toBe(0);
  });
});