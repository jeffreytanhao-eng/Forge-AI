import { DocumentParser, ParsedDocument } from '../types.js';

export class PDFParser implements DocumentParser {
  readonly supportedExtensions = ['.pdf'];

  async parse(filePath: string, _content: string): Promise<ParsedDocument> {
    let pdfParse: any;
    try {
      pdfParse = (await import('pdf-parse')).default;
    } catch {
      return {
        title: filePath,
        content: `[PDF 解析需要安装 pdf-parse 依赖]

PDF 文件: ${filePath}

请运行: pnpm add pdf-parse --filter @forge-ai/core`,
        metadata: { note: 'pdf-parse not installed' },
        sourcePath: filePath,
        fileType: 'pdf',
      };
    }

    const fs = await import('fs/promises');
    const dataBuffer = await fs.readFile(filePath);
    const data = await pdfParse(dataBuffer);

    return {
      title: data.info?.Title || filePath,
      content: data.text || '',
      metadata: {
        pageCount: data.numpages,
        author: data.info?.Author,
        ...data.info,
      },
      sourcePath: filePath,
      fileType: 'pdf',
    };
  }
}