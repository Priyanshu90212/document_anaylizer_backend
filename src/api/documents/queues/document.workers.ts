import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { AiService } from 'src/ai/ai.service';
import { SupabaseService } from 'src/service/supabase.service';
import { DocumentsService } from '../documents.service';
import { ServerSideEventsService } from 'src/Server_side_events/SSE.service';

@Processor('document-processing')
export class DocumentProcessor extends WorkerHost {
  constructor(
    private readonly supabaseService: SupabaseService,
    private readonly aiService: AiService,
    private readonly documentService: DocumentsService,
    private readonly ServerEventsService: ServerSideEventsService,
  ) {
    super();
  }
  async process(job: Job): Promise<any> {
    const { documentId } = job.data;
    switch (job.name) {
      case 'process-document':
        return await this.generateSummary(documentId);

      case 'add-chat':
        return await this.addChat(
          documentId, 
          job.data.message,
          job.data.message_sender,
        );

      default:
        throw new Error(`Unknown job: ${job.name}`);
    }
  }
  async generateSummary(id: string) {
    return this.documentService.generateSummary(id);
  }
  async addChat(id: string, message: string, message_sender: string) {
    const document = await this.documentService.getDocumentById(id);
    const client = this.supabaseService.getClient();

    await client.from('users_to_document_ai_chat').insert({
      document_id: document.id,
      document_hash_id: document.document_file_hash,
      messages: message,
      message_sender,
    });
  }
}
