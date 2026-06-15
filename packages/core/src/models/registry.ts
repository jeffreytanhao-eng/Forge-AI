import { ModelProvider, ModelOption } from './provider.js';

class ModelRegistryClass {
  private providers = new Map<string, ModelProvider>();

  register(provider: ModelProvider): void {
    if (this.providers.has(provider.id)) {
      console.warn(`Model provider "${provider.id}" already registered. Overwriting.`);
    }
    this.providers.set(provider.id, provider);
  }

  get(id: string): ModelProvider | undefined {
    return this.providers.get(id);
  }

  getAll(): ModelProvider[] {
    return Array.from(this.providers.values());
  }

  getOnline(): ModelProvider[] {
    return this.getAll().filter(p => p.online);
  }

  getOffline(): ModelProvider[] {
    return this.getAll().filter(p => !p.online);
  }

  async listAllModels(): Promise<ModelOption[]> {
    const results: ModelOption[] = [];
    for (const provider of this.providers.values()) {
      try {
        const models = await provider.listModels();
        results.push(...models);
      } catch {
        console.warn(`Failed to list models from provider: ${provider.id}`);
      }
    }
    return results;
  }
}

export const ModelRegistry = new ModelRegistryClass();