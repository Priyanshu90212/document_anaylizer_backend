import { Processor, WorkerHost } from "@nestjs/bullmq";
import { Job } from "bullmq";
import { AiService } from "src/ai/ai.service";
import { SupabaseService } from "src/service/supabase.service";
import { DocumentsService } from "../documents.service";

@Processor("document-processing")
export class DocumentProcessor extends WorkerHost {
    constructor(
        private readonly supabaseService: SupabaseService,
        private readonly aiService: AiService,
        private readonly documentService: DocumentsService,
    ) {
        super();
    }
    async process(job: Job, token?: string): Promise<any> {
        const id = job.data.documentId;

        this.generateSummary(id);
    }
    async generateSummary(id: string) {
         return this.documentService.generateSummary(id);
    }
}