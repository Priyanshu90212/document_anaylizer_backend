import { Body, Controller, Post } from '@nestjs/common';
import { AiService } from './ai.service';

@Controller('ai')
export class AiController {
    constructor (private readonly AiService: AiService) {

    }
    @Post('chat')
    async chat(@Body() body: any) {
       const response = await this.AiService.chat(body.message);

       return {
          response
       }
    }
}
