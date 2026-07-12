import { Injectable } from "@nestjs/common";
import Csv, { parse } from 'csv-parse';
import Xlsx from  'xlsx';
import Docx from  'mammoth';
import pdf from 'pdf-parse';
import mammoth from "mammoth";

@Injectable()
export class ParserService {

    async extract(buffer: Buffer, mimeType: string) : Promise<string> {
          switch(mimeType) {
              case 'application/pdf': return this.parsePdf(buffer); 
              case 'application/pdf': return this.parsePdf(buffer);
              case 'application/pdf': return this.parsePdf(buffer);
              case 'application/pdf': return this.parsePdf(buffer);
              case 'application/pdf': return this.parsePdf(buffer);
              default: throw new Error('Unsupported document type')
          }
    }

    private async parsePdf(buffer: Buffer) {
         const data = await pdf(buffer);
         return  data.text;

    }
    private async parseCsv(buffer: Buffer) {
       const records = parse(buffer.toString("utf-8"));
       return JSON.stringify(records);
    }
     private async parseXlsx(buffer: Buffer) {
        const workbook = Xlsx.read(buffer);
        let text = '';
        workbook.SheetNames.forEach(sheet => {
             text += Xlsx.utils.sheet_to_csv(workbook.Sheets[sheet]);
        })
        return  text;
    }
     private async parseDocx(buffer: Buffer) {
       let data  = await mammoth.extractRawText({buffer});
       return data.value
    }
     private async parseTxt(buffer: Buffer) {
         return  buffer.toString('utf-8')
    }
}