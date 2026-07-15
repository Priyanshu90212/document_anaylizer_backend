import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { DocumentsController } from './api/documents/documents.controller';
import { DocumentsModule } from './api/documents/documents.module';
import { DocumentsService } from './api/documents/documents.service';
import { ConfigModule } from '@nestjs/config';
import { SupabaseModule } from './modules/supabase.module';
import { AiService } from './ai/ai.service';
import { AiController } from './ai/ai.controller';
import { BullModule } from '@nestjs/bullmq';
import { RedisModule } from './modules/redis.module';
import { AiModule } from './ai/ai.module';

@Module({
  imports: [ConfigModule.forRoot({isGlobal: true}), 
    DocumentsModule, 
    SupabaseModule, 
    RedisModule,
    AiModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
