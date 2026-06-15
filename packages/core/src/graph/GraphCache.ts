import * as fs from 'fs';
import * as path from 'path';
import { CodeGraph } from './types.js';

export class GraphCache {
  private cacheDir: string;
  private cache: Map<string, { timestamp: number; hash: string }> = new Map();
  private graph: CodeGraph | null = null;

  constructor(cacheDir: string = '.forgeai/graph-cache') {
    this.cacheDir = cacheDir;
    this.ensureCacheDir();
  }

  private ensureCacheDir(): void {
    try {
      if (!fs.existsSync(this.cacheDir)) {
        fs.mkdirSync(this.cacheDir, { recursive: true });
      }
    } catch {
    }
  }

  private getFileHash(filePath: string): string {
    try {
      const content = fs.readFileSync(filePath, 'utf-8');
      let hash = 0;
      for (let i = 0; i < content.length; i++) {
        const char = content.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash |= 0;
      }
      return String(hash);
    } catch {
      return '';
    }
  }

  getChangedFiles(): string[] {
    const changed: string[] = [];
    const projectRoot = process.cwd();
    const files = this.collectFiles(projectRoot);

    for (const file of files) {
      const ext = path.extname(file);
      if (ext !== '.ts' && ext !== '.tsx') continue;

      const relativePath = path.relative(projectRoot, file);
      const currentHash = this.getFileHash(file);
      const cached = this.cache.get(relativePath);

      if (!cached || cached.hash !== currentHash) {
        changed.push(file);
        this.cache.set(relativePath, {
          timestamp: Date.now(),
          hash: currentHash,
        });
      }
    }

    return changed;
  }

  saveGraph(graph: CodeGraph): void {
    this.graph = graph;
    try {
      const graphPath = path.join(this.cacheDir, 'graph.json');
      fs.writeFileSync(graphPath, JSON.stringify(graph, null, 2), 'utf-8');

      const cachePath = path.join(this.cacheDir, 'file-cache.json');
      const cacheData = Array.from(this.cache.entries()).map(([key, value]) => ({ key, ...value }));
      fs.writeFileSync(cachePath, JSON.stringify(cacheData, null, 2), 'utf-8');
    } catch {
    }
  }

  loadGraph(): CodeGraph | null {
    if (this.graph) return this.graph;
    try {
      const graphPath = path.join(this.cacheDir, 'graph.json');
      if (fs.existsSync(graphPath)) {
        const data = fs.readFileSync(graphPath, 'utf-8');
        this.graph = JSON.parse(data);
      }

      const cachePath = path.join(this.cacheDir, 'file-cache.json');
      if (fs.existsSync(cachePath)) {
        const cacheData = JSON.parse(fs.readFileSync(cachePath, 'utf-8'));
        for (const item of cacheData) {
          this.cache.set(item.key, { timestamp: item.timestamp, hash: item.hash });
        }
      }
    } catch {
    }
    return this.graph;
  }

  clear(): void {
    this.cache.clear();
    this.graph = null;
  }

  private collectFiles(dir: string): string[] {
    const results: string[] = [];
    try {
      const entries = fs.readdirSync(dir, { withFileTypes: true });
      for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);
        if (entry.isDirectory()) {
          if (!entry.name.startsWith('.') && entry.name !== 'node_modules' && entry.name !== 'dist') {
            results.push(...this.collectFiles(fullPath));
          }
        } else if (entry.isFile()) {
          results.push(fullPath);
        }
      }
    } catch {
    }
    return results;
  }
}