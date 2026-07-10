import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { DocumentsController } from './api/documents/documents.controller';
import { DocumentsModule } from './api/documents/documents.module';
import { DocumentsService } from './api/documents/documents.service';
import { ConfigModule } from '@nestjs/config';
import { SupabaseModule } from './modules/supabase.module';

@Module({
  imports: [DocumentsModule, ConfigModule.forRoot({isGlobal: true}), SupabaseModule],
  controllers: [AppController, DocumentsController],
  providers: [AppService, DocumentsService],
})
export class AppModule {}
