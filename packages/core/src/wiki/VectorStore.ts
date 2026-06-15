import { SearchResult } from './types.js';

export class VectorStore {
  private chunks: Map<string, { id: string; documentId: string; content: string; tokens: string[]; title: string }> = new Map();

  addChunk(id: string, documentId: string, content: string, title: string): void {
    const tokens = this.tokenize(content);
    this.chunks.set(id, { id, documentId, content, tokens, title });
  }

  removeChunksByDocument(documentId: string): void {
    for (const [id, chunk] of this.chunks) {
      if (chunk.documentId === documentId) {
        this.chunks.delete(id);
      }
    }
  }

  clear(): void {
    this.chunks.clear();
  }

  search(query: string, topK: number = 5): SearchResult[] {
    const queryTokens = this.tokenize(query);
    const results: SearchResult[] = [];

    for (const [, chunk] of this.chunks) {
      const bm25Score = this.computeBM25(queryTokens, chunk.tokens);
      if (bm25Score > 0) {
        results.push({
          chunkId: chunk.id,
          documentId: chunk.documentId,
          content: chunk.content.slice(0, 500),
          score: bm25Score,
          title: chunk.title,
        });
      }
    }

    results.sort((a, b) => b.score - a.score);
    return results.slice(0, topK);
  }

  private tokenize(text: string): string[] {
    const cleaned = text.toLowerCase().replace(/[^a-z0-9\u4e00-\u9fff\s]/g, ' ');
    return cleaned.split(/\s+/).filter(t => t.length > 0);
  }

  private computeBM25(queryTokens: string[], docTokens: string[]): number {
    const k1 = 1.5;
    const b = 0.75;
    const avgDocLen = this.averageDocLength();
    const docLen = docTokens.length;
    const totalDocs = this.chunks.size;

    let score = 0;
    const docFreq = new Map<string, number>();

    for (const token of queryTokens) {
      docFreq.set(token, (docFreq.get(token) || 0) + 1);
    }

    for (const [token, qf] of docFreq) {
      const tf = docTokens.filter(t => t === token).length;
      if (tf === 0) continue;

      const idf = Math.log(1 + (totalDocs - qf + 0.5) / (qf + 0.5));
      score += idf * ((tf * (k1 + 1)) / (tf + k1 * (1 - b + b * (docLen / avgDocLen))));
    }

    return score;
  }

  private averageDocLength(): number {
    if (this.chunks.size === 0) return 100;
    let total = 0;
    for (const [, chunk] of this.chunks) {
      total += chunk.tokens.length;
    }
    return total / this.chunks.size;
  }

  getStats(): { chunkCount: number } {
    return { chunkCount: this.chunks.size };
  }
}