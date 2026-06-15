export interface ParsedDocument {
  title: string;
  content: string;
  metadata: Record<string, unknown>;
  sourcePath: string;
  fileType: string;
}

export interface DocumentChunk {
  id: string;
  documentId: string;
  content: string;
  metadata: Record<string, unknown>;
  embedding?: number[];
}

export interface DocumentParser {
  supportedExtensions: string[];
  parse(filePath: string, content: string): Promise<ParsedDocument>;
}

export interface SearchResult {
  chunkId: string;
  documentId: string;
  content: string;
  score: number;
  title: string;
}