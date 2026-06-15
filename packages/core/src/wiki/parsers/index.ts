import { DocumentParser } from '../types.js';
import { MarkdownParser } from './markdown.js';
import { TextParser } from './text.js';
import { PDFParser } from './pdf.js';
import { WordParser } from './word.js';

export const builtinParsers: DocumentParser[] = [
  new MarkdownParser(),
  new TextParser(),
  new PDFParser(),
  new WordParser(),
];

export function getParserForFile(filePath: string, parsers: DocumentParser[] = builtinParsers): DocumentParser | undefined {
  const ext = filePath.toLowerCase().split('.').pop();

  if (!ext) return undefined;

  return parsers.find(p =>
    p.supportedExtensions.includes(`.${ext}`)
  );
}