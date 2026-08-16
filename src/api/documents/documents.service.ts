import { InjectQueue } from '@nestjs/bullmq';
import { HttpException, Injectable } from '@nestjs/common';
import { SupabaseClient } from '@supabase/supabase-js';
import { Queue, tryCatch } from 'bullmq';
import { randomUUID } from 'crypto';
import calculateHash from 'helpers/createHashDocument';
import { AiService } from 'src/ai/ai.service';
import { ServerSideEventsService } from 'src/Server_side_events/SSE.service';
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
    private readonly SSeService: ServerSideEventsService,
  ) {
    this.client = this.supabaseService.getClient();
  }
  async create(createDocumentDto: any) {
    try {
      const client = this.client;
      const hashed_file_name = calculateHash(createDocumentDto.buffer);
      let getImage = (
        await client.storage.from('Documents').exists(hashed_file_name)
      ).data;
      let existRecord = await client
        .from('documents_meta')
        .select('id')
        .eq('document_file_hash', hashed_file_name)
        .maybeSingle();
      if (getImage && existRecord.success) {
       return {
  exist: true,
  success: false,
  message: "This record already exists. Please check the existing record before creating a new one.",
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
        .insert(payload)
        .select()
        .single();

      if (uploadError || error) {
        throw new Error('Invalid Problem in While Uploading Document.');
      }
      await this.documentQueue.add('process-document', {
        documentId: data.id,
      });

      return {
        id: data.id,
        status: "PROCESSING"
      };
    } catch (error: any) {
      throw new Error(error.message);
    }
  }

  async generateSummary(id: string) {
    
    let data = await this.getDocumentById(id);
    let points: any;
    if (data) {
      let extracted = await this.parserService.extractDocument(
        data.document_file_hash,
        data.mime_type,
      );
      points = await this.aiService.chatStream(`
           Analyze the following document.

Format your response using valid Markdown.

Structure:

# Document Summary

Write 1-2 concise paragraphs summarizing the document.

## Key Points

- Point 1
- Point 2
- Point 3
- Point 4

## Important Information (only if applicable)

Use a table if the document contains structured data.

## Conclusion (only if applicable)

Write a short concluding paragraph.

Formatting rules:
- Use Markdown only.
- Do NOT return JSON.
- Do NOT use Markdown code fences.
- Use headings (#, ##, ###).
- Use bullet lists (-).
- Use numbered lists when there is a sequence.
- Use **bold** only for important terms.
- Use *italic* only when necessary.
- Use tables whenever they improve readability.
- Use blockquotes (>) only for important notes or warnings.
- Keep paragraphs short (2–4 sentences).
- Leave one blank line between sections.
- Start immediately with "# Document Summary".

Document:
${extracted}`);
    }

let fullResponse = '';
console.log(points, "points")
for await (const chunk of points  ) {
  const content = chunk.choices[0]?.delta?.content;

  if (!content) continue;

  fullResponse += content;
  console.log(content, "content")

  this.SSeService.send(`summary:${id}`, {
    event: 'chunk',
    chunk: content,
  });
}
    this.SSeService.send(`summary:${id}`, {
    event: 'completed',
  });

    if (fullResponse) {
      let { data: summaryData, error: summaryError } = await this.client
        .from('summary_points')
        .insert({
          document_id: data.id,
          document_hash_id: data.document_file_hash,
          summary_points: fullResponse,
        });

      if (!summaryError) {
        return {
          status: 'COMPLETED',
          data: summaryData,
        };
      }
    }
  }

  async chatMessageAI(message: string, documentId: string) {
    let document = await this.getDocumentById(documentId);
    let extractedText = await this.parserService.extractDocument(
      document.document_file_hash,
      document.mime_type,
    );
    console.log(extractedText, 'Ai Response');

    this.documentQueue.add('add-chat', {
      documentId: documentId,
      message: message,
      message_sender: 'USER',
    });
    const prompt = `
            You are an AI assistant.
            
            User message:
            ${message}
            
            Reference document:
            ${extractedText}
            
            Instructions:
            - Answer the user's message using the document as the primary source.
            - If the answer is not in the document, say you don't have enough information.
            - Keep the response conversational and natural.
            - Do not make up facts.
            `;
    const aiResponse = await this.aiService.chatStream(prompt);

    let fullResponse = '';

   for await (const chunk of aiResponse) {
     const content = chunk.choices[0]?.delta?.content;

     if (!content) continue;

     fullResponse += content;
     this.SSeService.send(`chat:${documentId}`, {
         event: "chunk-ai-chat",
         data: content
      })    
   }
    this.SSeService.send(`chat:${documentId}`, {
         event: "completed-chat"
    })  
    // SSE server sent events sending streams to frontend.
    

    this.documentQueue.add('add-chat', {
      documentId: documentId,
      message: fullResponse,
      message_sender: 'AI_ASSITANT',
    });
    return {
        success: true
    };
  }
  async getDocumentById(id: string) {
    let current_record = await this.client
      .from('documents_meta')
      .select()
      .eq('id', id)
      .single();
    // console.log(id)
    // console.log(current_record);
    let data = current_record.data;

    return data;
  }

  async getSummaryPoints(id: string) {
     let {data, error} = await this.client.from("summary_points").select("*").eq("document_id", id).single()

     if (error) {
        console.log(error)
     }

     return data;
  }

  async getChatsPerId(id: string) { 
       
       let {data, error} = await this.client.from('users_to_document_ai_chat').select("*").eq("document_id", id);

       if (error) {
          console.log(error);
       }

       return data;
  }

  async getRecentInformation() {
      let {data: getUploadedFiles, error: getFileError} = 
      await this.client.from("documents_meta")
      .select().order('created_at', {ascending: false}).limit(2);

      let {data: chatData, error: chatError} = await this.client
      .from('users_to_document_ai_chat')
      .select().order('created_at', {ascending: false}).limit(2);

      if (chatError || getFileError) {
         return {
             error: 'Unable to Get Recent Data'
         }
      }

      return {
          chatData,
          getUploadedFiles
      }

  }
  // async formatizer(id: string) {
  //   const document = await this.getDocumentById(id);
  //   console.log(document);
  //   const text = await this.parserService.extractDocument(
  //     document.document_file_hash,
  //     document.mime_type,
  //   );

  //   const prompt = `
  //      You are an expert document formatter.

  //      Document Metadata:
  //      - MIME Type: ${document.mime_type}

  //      Your task is to transform the extracted document into clean, structured Markdown while preserving every piece of information.

  //      Rules:
  //      - Preserve 100% of the content. Do NOT summarize, omit, or invent information.
  //      - Return ONLY the formatted Markdown.
  //      - Fix common OCR and extraction issues:
  //        - Broken line breaks
  //        - Extra whitespace
  //        - Split words caused by extraction
  //        - Duplicate lines
  //      - Maintain the original reading order.
  //      - Use appropriate Markdown structure:
  //        - # Main title
  //        - ## Sections
  //        - ### Subsections
  //        - Bullet lists
  //        - Numbered lists
  //        - Blockquotes where appropriate
  //        - Markdown tables when the original content is tabular
  //      - Format key-value data as:
  //        - **Field:** Value
  //      - Preserve:
  //        - Dates
  //        - Numbers
  //        - IDs
  //        - URLs
  //        - Email addresses
  //        - Phone numbers
  //        - Technical terms
  //      - If the document is poorly extracted, infer the most logical structure without changing the meaning.
  //      - If the MIME type indicates a spreadsheet or CSV, preserve rows and columns as Markdown tables.
  //      - If the MIME type indicates HTML, extract the meaningful content while ignoring unnecessary markup.
  //      - If the document contains code, preserve it in fenced code blocks.
  //      - If a table cannot be reconstructed reliably, represent it as nested bullet points rather than guessing.
  //      - Never add explanations, comments, introductions, or conclusions.
  //      - you can html tag too according to mime type if user proper html style elemement.
  //      Raw Document:
  //      ${text}
  //      `;

  //   const aiResponse = await this.aiService.chat(prompt);
  //   return {
  //     aiResponse
  //   }
  // }

  // findAll() {
  //   return `This action returns all documents`;
  // }

  // findOne(id: number) {
  //   return `This action returns a #${id} document`;
  // }

  // update(id: number, updateDocumentDto: any) {
  //   return `This action updates a #${id} document`;
  // }

  // remove(id: number) {
  //   return `This action removes a #${id} document`;
  // }
}
