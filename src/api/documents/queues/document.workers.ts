import { Processor, WorkerHost } from "@nestjs/bullmq";
import { Job } from "bullmq";

@Processor("document-processing")
export class DocumentProcessor extends WorkerHost {
    // constructor(private readonly DocumentService: ) {
    //    super();
    // }
    async process(job: Job, token?: string): Promise<any> {
        const id = job.data.documentId;
        
    }
}