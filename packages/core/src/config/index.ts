export interface ForgeConfig {
  defaultAgent?: string;
  model?: {
    provider?: string;
    apiKey?: string;
    endpoint?: string;
    modelName?: string;
    temperature?: number;
    maxTokens?: number;
  };
  mcp?: {
    autoConnect?: boolean;
  };
  wiki?: {
    basePath?: string;
  };
}

function getNodeRequire(): NodeRequire | null {
  try {
    return Function('return require')() as NodeRequire;
  } catch {
    return null;
  }
}

class ForgeConfigManager {
  private config: ForgeConfig = {};

  private ensureLoaded(): void {
    const _require = getNodeRequire();
    if (!_require || typeof process === 'undefined') return;
    if (Object.keys(this.config).length > 0) return;

    try {
      const p = _require('path') as typeof import('path');
      const fs = _require('fs') as typeof import('fs');
      const home = process.env.HOME || process.env.USERPROFILE || '.';
      const configDir = p.join(home, '.forgeai');
      const configFile = p.join(configDir, 'config.json');

      if (!fs.existsSync(configDir)) {
        fs.mkdirSync(configDir, { recursive: true });
      }
      if (fs.existsSync(configFile)) {
        const data = fs.readFileSync(configFile, 'utf-8');
        this.config = JSON.parse(data);
      }
    } catch {
      this.config = {};
    }
  }

  private ensureSaved(): void {
    const _require = getNodeRequire();
    if (!_require || typeof process === 'undefined') return;

    try {
      const p = _require('path') as typeof import('path');
      const fs = _require('fs') as typeof import('fs');
      const home = process.env.HOME || process.env.USERPROFILE || '.';
      const configDir = p.join(home, '.forgeai');
      const configFile = p.join(configDir, 'config.json');

      if (!fs.existsSync(configDir)) {
        fs.mkdirSync(configDir, { recursive: true });
      }
      fs.writeFileSync(configFile, JSON.stringify(this.config, null, 2), 'utf-8');
    } catch (err) {
      console.error('Failed to save config:', err);
    }
  }

  get<T>(key: string): T | undefined {
    this.ensureLoaded();
    const keys = key.split('.');
    let current: any = this.config;
    for (const k of keys) {
      if (current === undefined || current === null) return undefined;
      current = current[k];
    }
    return current as T;
  }

  set(key: string, value: any): void {
    this.ensureLoaded();
    const keys = key.split('.');
    let current: any = this.config;
    for (let i = 0; i < keys.length - 1; i++) {
      if (!current[keys[i]]) {
        current[keys[i]] = {};
      }
      current = current[keys[i]];
    }
    current[keys[keys.length - 1]] = value;
    this.ensureSaved();
  }

  getAll(): ForgeConfig {
    this.ensureLoaded();
    return { ...this.config };
  }

  get path(): string {
    this.ensureLoaded();
    const _require = getNodeRequire();
    if (!_require || typeof process === 'undefined') return '';
    try {
      const p = _require('path') as typeof import('path');
      const home = process.env.HOME || process.env.USERPROFILE || '.';
      return p.join(home, '.forgeai', 'config.json');
    } catch {
      return '';
    }
  }
}

export const forgeConfig = new ForgeConfigManager();