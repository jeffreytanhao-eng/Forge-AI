import { create } from 'zustand';

export type ModelProvider = 'gemini' | 'ollama' | 'openai';

interface ModelState {
  currentProvider: ModelProvider;
  modelName: string;
  baseUrl?: string;
  apiKey?: string;
  setProvider: (provider: ModelProvider, config?: any) => void;
}

export const useModelStore = create<ModelState>((set) => ({
  currentProvider: 'gemini',
  modelName: 'gemini-1.5-flash',
  setProvider: (provider, config = {}) => 
    set({ currentProvider: provider, ...config }),
}));