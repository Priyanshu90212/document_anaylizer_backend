import { Controller, Get, Post, Body, Patch, Param, Delete, UploadedFile, UseInterceptors, Res, Req } from '@nestjs/common';
import { DocumentsService } from './documents.service';
import type { Express, Request, Response } from 'express';
import { FileInterceptor } from '@nestjs/platform-express';
import { debug } from 'console';

@Controller('api/documents')
export class DocumentsController {
  constructor(private readonly documentsService: DocumentsService) {}
  
  @Post()
  @UseInterceptors(FileInterceptor("file"))
  create(@UploadedFile() file: any) {
    return this.documentsService.create(file);
  }

  @Get()
  findAll() {
    // return this.documentsService.findAll();
  }

  @Post("/chat_ai")
  async chat_ai(
      @Param('documentId') documentId: string,
      @Body('message') message: string,
    ) {
     try {
       
       console.log(message)
       let AIresponse = await this.documentsService.chatMessageAI(message, documentId);
   
       console.log(AIresponse.ai_message);
       return {
           aiMessage: AIresponse.ai_message
       }
     } catch (error: any) {
      return {
        error: error.message
      }
        // res.json({error: error.message})
      }
    
  }

  // @Get(':id')
  // findOne(@Param('id') id: string) {
  //   return this.documentsService.findOne(+id);
  // }

  // @Patch(':id')
  // update(@Param('id') id: string, @Body() updateDocumentDto: any) {
  //   return this.documentsService.update(+id, updateDocumentDto);
  // }

  // @Delete(':id')
  // remove(@Param('id') id: string) {
  //   return this.documentsService.remove(+id);
  // }
}
