declare module 'pdf-parse' {
  interface PDFInfo {
    Title?: string;
    Author?: string;
    Subject?: string;
    Keywords?: string;
    [key: string]: unknown;
  }

  interface PDFData {
    numpages: number;
    numrender: number;
    info: PDFInfo;
    metadata: unknown;
    text: string;
    version: string;
  }

  function pdfParse(dataBuffer: Buffer): Promise<PDFData>;
  export default pdfParse;
}

declare module 'mammoth' {
  interface MammothResult {
    value: string;
    messages: Array<{ type: string; message: string }>;
  }

  interface MammothOptions {
    buffer?: Buffer;
    path?: string;
  }

  export function extractRawText(options: MammothOptions): Promise<MammothResult>;
}