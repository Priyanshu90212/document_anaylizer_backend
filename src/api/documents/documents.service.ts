import { HttpException, Injectable } from '@nestjs/common';
import { randomUUID } from 'crypto';
import calculateHash from 'helpers/createHashDocument';
import { SupabaseService } from 'src/service/supabase.service';

@Injectable()
export class DocumentsService {
  constructor(private readonly supabaseService: SupabaseService) {}
  async create(createDocumentDto: any) {
    try {
      const client = this.supabaseService.getClient();
      const hashed_file_name = calculateHash(createDocumentDto.buffer);
      console.log(createDocumentDto);

      let getImage = (await client.storage.from("Documents").exists(hashed_file_name)).data;
      let existRecord = await client.from("documents_meta").select("id")
      .eq("document_file_hash", hashed_file_name).maybeSingle();
      if (getImage || existRecord.data?.id) {
           return {
               data: {
                 message: "Already Exist"
               }
           }
      }   
      // const { data, error } = await client.storage
      //   .from('Documents')
      //   .upload(hashed_file_name, createDocumentDto.buffer, {
      //     contentType: createDocumentDto.mimetype,
      //     upsert: false,
      //   });
     const { db_data, db_error } = await this.supabaseService.getClient()
  .from('documents_meta')
  .insert({
    document_file_hash: hashed_file_name,
    original_name: createDocumentDto.original_name,
    mime_type: createDocumentDto.mimetype,
    file_size: createDocumentDto.size,
    // blob_storage_path: data?.fullPath,
  })
  .select() as any;

      // if (error) {
      //   throw new Error(error as any);
      // }
      if (db_error) {
         throw new Error(db_error as any);
      }
      return {
        data: {
            // imageData: data,
            recordData: db_data
        },
      };
    } catch (error: any) {
      throw new Error(error);
    }
  }

  async generateSummary(dto: any) {
       
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
