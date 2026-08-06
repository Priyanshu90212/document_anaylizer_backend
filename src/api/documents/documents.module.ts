import { Module } from '@nestjs/common';
import { DocumentsService } from './documents.service';
import { DocumentsController } from './documents.controller';
import { SupabaseModule } from 'src/modules/supabase.module';
import { BullModule } from '@nestjs/bullmq';
import { DocumentProcessor } from './queues/document.workers';
import { AiModule } from 'src/ai/ai.module';
import { ParserService } from 'src/service/parser.service';
import { ServerSideEventsService } from 'src/Server_side_events/SSE.service';

@Module({
  imports: [SupabaseModule, BullModule.registerQueue({
    name: "document-processing"
  }), AiModule],
  controllers: [DocumentsController],
  providers: [DocumentsService, DocumentProcessor, ParserService, ServerSideEventsService],
})
export class DocumentsModule {
  
}
