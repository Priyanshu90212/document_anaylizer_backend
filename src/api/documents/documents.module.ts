import { Module } from '@nestjs/common';
import { DocumentsService } from './documents.service';
import { DocumentsController } from './documents.controller';
import { SupabaseModule } from 'src/modules/supabase.module';
import { BullModule } from '@nestjs/bullmq';
import { DocumentProcessor } from './queues/document.workers';

@Module({
  imports: [SupabaseModule, BullModule.registerQueue({
    name: "document-processing"
  })],
  controllers: [DocumentsController],
  providers: [DocumentsService, DocumentProcessor],
})
export class DocumentsModule {
  
}
