import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import OpenAI from 'openai';
@Injectable()
export class AiService {
  private AI: OpenAI;

  constructor(private config: ConfigService) {
    this.AI = new OpenAI({
      apiKey: this.config.get<string>('GROQ_AI_API_KEY'),
      baseURL: 'https://api.groq.com/openai/v1',
    });
  }

  async chat(message: string) {
    const completion = await this.AI.chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      messages: [
        {
          role: 'user',
          content: message,
        },
      ],
    }, {stream: true});

    return completion.choices[0].message.content;
  }
  async chatStream(message: string) {
      return this.AI.chat.completions.create({
    model: "llama-3.3-70b-versatile",
    stream: true,
    messages: [{ role: "user", content: message }],
  });
  }
}
