import { DocumentParser, ParsedDocument } from '../types.js';

export class TextParser implements DocumentParser {
  readonly supportedExtensions = ['.txt'];

  async parse(filePath: string, content: string): Promise<ParsedDocument> {
    const lines = content.split('\n');
    const title = lines[0]?.trim() || filePath;

    return {
      title,
      content,
      metadata: { lineCount: lines.length },
      sourcePath: filePath,
      fileType: 'text',
    };
  }
}