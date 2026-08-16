import { Controller, Get, Post, Body, Patch, Param, Delete, UploadedFile, UseInterceptors, Res, Req, Query, ParseFilePipe, FileTypeValidator, BadRequestException, MaxFileSizeValidator, Sse } from '@nestjs/common';
import { DocumentsService } from './documents.service';
import { FileInterceptor } from '@nestjs/platform-express';
import { ServerSideEventsService } from 'src/Server_side_events/SSE.service';

@Controller('api/documents')
export class DocumentsController {
  constructor(private readonly documentsService: DocumentsService, private readonly SSEevents: ServerSideEventsService) {}
  
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



  @Post("/chat_ai")
  async chat_ai(
      @Query('documentId') documentId: string,
      @Body('message') message: string,
    ) {
     try {
       let AIresponse = await this.documentsService.chatMessageAI(message, documentId);
        return {
           success: AIresponse.success
        }
     } catch (error: any) {
        return {
           error: error.message
        }
      }
    
  } 
@Sse("summary/:id/events")
summaryStream(@Param("id") id: string) {
  return this.SSEevents.getStream(`summary:${id}`);
}

@Sse("chat/:id/events")
chatStream(@Param("id") id: string) {
  return this.SSEevents.getStream(`chat:${id}`);
}

@Get("/document-chats/:id")
async getChatsPerId(@Param('id') documentId: string) {
  try {
     const data = await this.documentsService.getChatsPerId(documentId);
     return {data}  
  } catch (error: any) {
     throw new Error(error.message);
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
  // @Post('/format')
  // async formatizer(
  //     @Query('documentId') documentId: string,
  //   ) {
  //    try {
  //      let AIresponse = await this.documentsService.formatizer(documentId);
  //       return {
  //          formattedString: AIresponse.aiResponse
  //       }
  //    } catch (error: any) {
  //       return {
  //          error: error.message
  //       }
  //     }
    
  // }


  @Post("/get-summary/:id")
async getSummary(@Param('id') id: string) {
  const data = await this.documentsService.getSummaryPoints(id);

  return {
    data
  };
}
@Get("/get-recent-info")
async getRecentInformation() {
    const data = await this.documentsService.getRecentInformation();
    return {
      data
    }
}


}
