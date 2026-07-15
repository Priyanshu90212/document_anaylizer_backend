import { Injectable } from '@nestjs/common';
import Csv, { parse } from 'csv-parse';
import Xlsx from 'xlsx';
import Docx from 'mammoth';
import pdf from 'pdf-parse';
import mammoth from 'mammoth';
import { SupabaseService } from './supabase.service';

@Injectable()
export class ParserService {
  constructor(private readonly supabaseService: SupabaseService) {}
  async extractDocument(
    document_file_hash: string,
    mime_type: string,
  ) {
    const { data: file, error } = await this.supabaseService
      .getClient()
      .storage.from('Documents')
      .download(document_file_hash);
    if (error) throw error;
    if (!file) throw new Error('File not found');
    const buffer = Buffer.from(await file.arrayBuffer());
    return this.extract(buffer, mime_type);
  }
  async extract(buffer: Buffer, mimeType: string): Promise<string> {
    switch (mimeType) {
      case 'application/pdf':
        return this.parsePdf(buffer);
      case 'text/csv':
        return this.parseCsv(buffer);
      case 'text/plain':
        return this.parseTxt(buffer);
      case 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet':
        return this.parseXlsx(buffer);
      case 'application/vnd.openxmlformats-officedocument.wordprocessingml.document':
        return this.parseDocx(buffer);
      default:
        throw new Error('Unsupported document type');
    }
  }

  private async parsePdf(buffer: Buffer) {
    const data = await pdf(buffer);
    return data.text;
  }
  private async parseCsv(buffer: Buffer) {
    const records = parse(buffer.toString('utf-8'));
    return JSON.stringify(records);
  }
  private async parseXlsx(buffer: Buffer) {
    const workbook = Xlsx.read(buffer);
    let text = '';
    workbook.SheetNames.forEach((sheet) => {
      text += Xlsx.utils.sheet_to_csv(workbook.Sheets[sheet]);
    });
    return text;
  }
  private async parseDocx(buffer: Buffer) {
    let data = await mammoth.extractRawText({ buffer });
    return data.value;
  }
  private async parseTxt(buffer: Buffer) {
    return buffer.toString('utf-8');
  }
}
