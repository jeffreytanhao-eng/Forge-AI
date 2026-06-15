import { ParsedDocument, DocumentChunk, SearchResult } from './types.js';
import { builtinParsers, getParserForFile } from './parsers/index.js';
import { VectorStore } from './VectorStore.js';
import * as fs from 'fs/promises';
import * as path from 'path';

interface KnowledgeBaseDocument {
  id: string;
  title: string;
  sourcePath: string;
  fileType: string;
  content: string;
  metadata: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

export class KnowledgeBase {
  private documents: Map<string, KnowledgeBaseDocument> = new Map();
  private vectorStore = new VectorStore();
  private basePath: string;

  constructor(basePath: string = '.forgeai/wiki') {
    this.basePath = basePath;
  }

  async importFile(filePath: string): Promise<KnowledgeBaseDocument> {
    const absolutePath = path.resolve(filePath);
    const content = await fs.readFile(absolutePath, 'utf-8');

    const parser = getParserForFile(filePath, builtinParsers);
    if (!parser) {
      throw new Error(`不支持的文件格式: ${filePath}`);
    }

    const parsed = await parser.parse(filePath, content);
    const now = new Date().toISOString();

    const doc: KnowledgeBaseDocument = {
      id: `doc_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      title: parsed.title,
      sourcePath: absolutePath,
      fileType: parsed.fileType,
      content: parsed.content,
      metadata: parsed.metadata,
      createdAt: now,
      updatedAt: now,
    };

    this.documents.set(doc.id, doc);
    this.indexDocument(doc);

    return doc;
  }

  addDocument(title: string, content: string, fileType: string = 'markdown'): KnowledgeBaseDocument {
    const now = new Date().toISOString();
    const doc: KnowledgeBaseDocument = {
      id: `doc_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      title,
      sourcePath: '',
      fileType,
      content,
      metadata: {},
      createdAt: now,
      updatedAt: now,
    };

    this.documents.set(doc.id, doc);
    this.indexDocument(doc);

    return doc;
  }

  private indexDocument(doc: KnowledgeBaseDocument): void {
    const chunks = this.chunkDocument(doc);
    for (const chunk of chunks) {
      this.vectorStore.addChunk(chunk.id, chunk.documentId, chunk.content, doc.title);
    }
  }

  private chunkDocument(doc: KnowledgeBaseDocument, maxChunkSize: number = 1000): DocumentChunk[] {
    const chunks: DocumentChunk[] = [];
    const paragraphs = doc.content.split(/\n\n+/);

    let currentChunk = '';
    let chunkIndex = 0;

    for (const paragraph of paragraphs) {
      if ((currentChunk + paragraph).length > maxChunkSize && currentChunk.length > 0) {
        chunks.push({
          id: `${doc.id}_chunk_${chunkIndex}`,
          documentId: doc.id,
          content: currentChunk.trim(),
          metadata: { index: chunkIndex },
        });
        chunkIndex++;
        currentChunk = '';
      }
      currentChunk += paragraph + '\n\n';
    }

    if (currentChunk.trim().length > 0) {
      chunks.push({
        id: `${doc.id}_chunk_${chunkIndex}`,
        documentId: doc.id,
        content: currentChunk.trim(),
        metadata: { index: chunkIndex },
      });
    }

    return chunks;
  }

  getDocument(id: string): KnowledgeBaseDocument | undefined {
    return this.documents.get(id);
  }

  getAllDocuments(): KnowledgeBaseDocument[] {
    return Array.from(this.documents.values());
  }

  deleteDocument(id: string): boolean {
    const existed = this.documents.delete(id);
    if (existed) {
      this.vectorStore.removeChunksByDocument(id);
    }
    return existed;
  }

  search(query: string, topK: number = 5): SearchResult[] {
    return this.vectorStore.search(query, topK);
  }

  exportToJSON(): string {
    const data = {
      version: '1.0',
      exportedAt: new Date().toISOString(),
      documents: this.getAllDocuments().map(doc => ({
        id: doc.id,
        title: doc.title,
        fileType: doc.fileType,
        content: doc.content,
        metadata: doc.metadata,
        createdAt: doc.createdAt,
      })),
    };
    return JSON.stringify(data, null, 2);
  }

  importFromJSON(jsonStr: string, merge: boolean = false): number {
    const data = JSON.parse(jsonStr);
    let count = 0;

    if (!data.documents || !Array.isArray(data.documents)) {
      throw new Error('无效的知识库 JSON 格式');
    }

    for (const docData of data.documents) {
      if (!merge && this.documents.has(docData.id)) {
        continue;
      }

      if (merge && this.documents.has(docData.id)) {
        const existing = this.documents.get(docData.id)!;
        existing.content = docData.content;
        existing.metadata = { ...existing.metadata, ...docData.metadata };
        existing.updatedAt = new Date().toISOString();
        this.vectorStore.removeChunksByDocument(docData.id);
        this.indexDocument(existing);
        count++;
        continue;
      }

      const doc: KnowledgeBaseDocument = {
        id: docData.id || `doc_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
        title: docData.title,
        sourcePath: '',
        fileType: docData.fileType || 'markdown',
        content: docData.content,
        metadata: docData.metadata || {},
        createdAt: docData.createdAt || new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      this.documents.set(doc.id, doc);
      this.indexDocument(doc);
      count++;
    }

    return count;
  }

  getStats(): { docCount: number; chunkCount: number } {
    return {
      docCount: this.documents.size,
      chunkCount: this.vectorStore.getStats().chunkCount,
    };
  }
}

export const defaultKnowledgeBase = new KnowledgeBase();