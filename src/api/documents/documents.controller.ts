import { Controller, Get, Post, Body, Patch, Param, Delete, UploadedFile, UseInterceptors, Res, Req, Query, ParseFilePipe, FileTypeValidator, BadRequestException, MaxFileSizeValidator } from '@nestjs/common';
import { DocumentsService } from './documents.service';
import type { Express, Request, Response } from 'express';
import { FileInterceptor } from '@nestjs/platform-express';
import { debug } from 'console';

@Controller('api/documents')
export class DocumentsController {
  constructor(private readonly documentsService: DocumentsService) {}
  
  @Post()
  @UseInterceptors(FileInterceptor("file"))
  create(@UploadedFile(new ParseFilePipe({validators: [new MaxFileSizeValidator({
    maxSize: 2 * 1024 * 1024
  }) , new FileTypeValidator({
    fileType: /(pdf|csv|vnd.openxmlformats-officedocument.wordprocessingml.document|plain|vnd.openxmlformats-officedocument.spreadsheetml.sheet)$/,
    })], exceptionFactory(error) {
      return new BadRequestException(
       {
          type:  'Only PDF, CSV, DOCX, TXT, and XLSX files are allowed.',
          size: "Only less than 2mb file exist."
       },
      );
    },})) file: any) {
    return this.documentsService.create(file);
  }

  @Get()
  findAll() {
    // return this.documentsService.findAll();
  }

  @Post("/chat_ai")
  async chat_ai(
      @Query('documentId') documentId: string,
      @Body('message') message: string,
    ) {
     try {
       console.log('ggg')
       let AIresponse = await this.documentsService.chatMessageAI(message, documentId);
        return {
           aiMessage: AIresponse.ai_message
        }
     } catch (error: any) {
        return {
           error: error.message
        }
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
