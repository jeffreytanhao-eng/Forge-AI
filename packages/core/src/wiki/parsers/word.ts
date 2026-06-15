import { DocumentParser, ParsedDocument } from '../types.js';

export class WordParser implements DocumentParser {
  readonly supportedExtensions = ['.docx'];

  async parse(filePath: string, _content: string): Promise<ParsedDocument> {
    let mammoth: any;
    try {
      mammoth = await import('mammoth');
    } catch {
      return {
        title: filePath,
        content: `[Word 解析需要安装 mammoth 依赖]

Word 文件: ${filePath}

请运行: pnpm add mammoth --filter @forge-ai/core`,
        metadata: { note: 'mammoth not installed' },
        sourcePath: filePath,
        fileType: 'docx',
      };
    }

    const fs = await import('fs/promises');
    const buffer = await fs.readFile(filePath);
    const result = await mammoth.extractRawText({ buffer });

    return {
      title: filePath.replace(/\.docx$/, '').split(/[/\\]/).pop() || filePath,
      content: result.value,
      metadata: {
        warnings: result.messages,
      },
      sourcePath: filePath,
      fileType: 'docx',
    };
  }
}