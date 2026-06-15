import { DocumentParser, ParsedDocument } from '../types.js';

export class MarkdownParser implements DocumentParser {
  readonly supportedExtensions = ['.md', '.mdx'];

  async parse(filePath: string, content: string): Promise<ParsedDocument> {
    const metadata: Record<string, unknown> = {};
    let body = content;

    const frontmatterMatch = content.match(/^---\n([\s\S]*?)\n---\n/);
    if (frontmatterMatch) {
      const frontmatter = frontmatterMatch[1];
      for (const line of frontmatter.split('\n')) {
        const sepIndex = line.indexOf(':');
        if (sepIndex > 0) {
          const key = line.slice(0, sepIndex).trim();
          const value = line.slice(sepIndex + 1).trim();
          metadata[key] = value;
        }
      }
      body = content.slice(frontmatterMatch[0].length);
    }

    const titleMatch = body.match(/^#\s+(.+)/);
    const title = metadata['title'] as string || (titleMatch ? titleMatch[1].trim() : filePath);

    return {
      title,
      content: body,
      metadata,
      sourcePath: filePath,
      fileType: 'markdown',
    };
  }
}