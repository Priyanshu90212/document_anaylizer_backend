import { InjectQueue } from '@nestjs/bullmq';
import { HttpException, Injectable } from '@nestjs/common';
import { Queue } from 'bullmq';
import { randomUUID } from 'crypto';
import calculateHash from 'helpers/createHashDocument';
import { SupabaseService } from 'src/service/supabase.service';
@Injectable()
export class DocumentsService {
  constructor(private readonly supabaseService: SupabaseService,
     @InjectQueue("document-processing")
     private readonly documentQueue: Queue
) {}
  async create(createDocumentDto: any) {
    try {
      const client = this.supabaseService.getClient();
      const hashed_file_name = calculateHash(createDocumentDto.buffer);

      let getImage = (
        await client.storage.from('Documents').exists(hashed_file_name)
      ).data;
      let existRecord = await client
        .from('documents_meta')
        .select('id')
        .eq('document_file_hash', hashed_file_name)
        .maybeSingle();
      if (getImage || existRecord.data?.id) {
        return {
          data: {
            message: 'Already Exist',
          },
        };
      }
      const { data: uploadData, error: uploadError } = await client.storage
        .from('Documents')
        .upload(hashed_file_name, createDocumentDto.buffer, {
          contentType: createDocumentDto.mimetype,
          upsert: false,
        });
      const payload = {
        document_file_hash: hashed_file_name,
        original_name: createDocumentDto.originalname,
        mime_type: createDocumentDto.mimetype,
        file_size: createDocumentDto.size,
        blob_storage_path: uploadData?.fullPath,
      };

      const { data, error } = await client
        .from('documents_meta')
        .insert(payload).select().single();

      if (uploadError || error) {
         throw new Error('Invalid Problem in While Uploading Document.');
      }
      console.log(data);
      await this.documentQueue.add("process-document", {
        documentId: data?.id
      })
       

      return {
        data: {
          id: '40',
          status: "PROCESSING",
        },
      };
    } catch (error: any) {
      throw new Error(error.message);
    }
  }

  async generateSummary(dto: any) {}

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
