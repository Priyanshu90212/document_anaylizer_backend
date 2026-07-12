import { InjectQueue } from '@nestjs/bullmq';
import { HttpException, Injectable } from '@nestjs/common';
import { SupabaseClient } from '@supabase/supabase-js';
import { Queue } from 'bullmq';
import { randomUUID } from 'crypto';
import calculateHash from 'helpers/createHashDocument';
import { AiService } from 'src/ai/ai.service';
import { ParserService } from 'src/service/parser.service';
import { SupabaseService } from 'src/service/supabase.service';
@Injectable()
export class DocumentsService {
  private readonly client: SupabaseClient;
  constructor(
    private readonly supabaseService: SupabaseService,
    @InjectQueue('document-processing')
    private readonly documentQueue: Queue,
    private readonly aiService: AiService,
    private readonly parserService: ParserService,
  ) {
    this.client = this.supabaseService.getClient();
  }
  async create(createDocumentDto: any) {
    try {
      // const client = this.client
      // const hashed_file_name = calculateHash(createDocumentDto.buffer);

      // let getImage = (
      //   await client.storage.from('Documents').exists(hashed_file_name)
      // ).data;
      // let existRecord = await client
      //   .from('documents_meta')
      //   .select('id')
      //   .eq('document_file_hash', hashed_file_name)
      //   .maybeSingle();
      // if (getImage || existRecord.data?.id) {
      //   return {
      //     data: {
      //       message: 'Already Exist',
      //     },
      //   };
      // }
      // const { data: uploadData, error: uploadError } = await client.storage
      //   .from('Documents')
      //   .upload(hashed_file_name, createDocumentDto.buffer, {
      //     contentType: createDocumentDto.mimetype,
      //     upsert: false,
      //   });
      // const payload = {
      //   document_file_hash: hashed_file_name,
      //   original_name: createDocumentDto.originalname,
      //   mime_type: createDocumentDto.mimetype,
      //   file_size: createDocumentDto.size,
      //   blob_storage_path: uploadData?.fullPath,
      // };

      // const { data, error } = await client
      //   .from('documents_meta')
      //   .insert(payload).select().single();

      // if (uploadError || error) {
      //    throw new Error('Invalid Problem in While Uploading Document.');
      // }
      // console.log(data);
      await this.documentQueue.add('process-document', {
        documentId: 'cd668a6c-3353-4657-a5f6-1150b74c2198',
      });

      return {
        data: {
          id: '40',
          status: 'PROCESSING',
        },
      };
    } catch (error: any) {
      throw new Error(error.message);
    }
  }

  async generateSummary(id: string) {
    let current_record = await this.client
      .from('documents_meta')
      .select()
      .eq('id', id)
      .single();
    let data = current_record.data;
    let points: any;
    if (data) {
      let { data: upload } = await this.client.storage
        .from('Documents')
        .download(data.document_file_hash);
      if (upload) {
        let buffer = Buffer.from(await upload.arrayBuffer());
        let extracted = this.parserService.extract(buffer, data.mime_type);
        points = await this.aiService.chat(`
                 Analyze the following document.
                Return ONLY valid JSON in this format:
             {
               "summary": "Short summary",
               "points": String[]
               ]
             }
             Document:
             ${extracted}`);
      }
    }

    if (data) {
     let {data: summaryData, error: summaryError} = await this.client.from('summary_points').insert({
         document_id: data.id,
         document_hash_id: data.document_file_hash,
         summary_points: points
      });
    }
  }

  findAll() {
    return `This action returns all documents`;
  }

  findOne(id: number) {
    return `This action returns a #${id} document`;
  }

  update(id: number, updateDocumentDto: any) {
    return `This action updates a #${id} document`;
  }

  remove(id: number) {
    return `This action removes a #${id} document`;
  }
}
