import { Controller, Sse } from '@nestjs/common';
import { Observable, interval, map } from 'rxjs';

@Controller('summary-points')
export class ServerSideEventsController {
  @Sse()
  stream(): Observable<MessageEvent | any> {
    return interval(1000).pipe(
      map((count) => ({
        data: {
          message: `Hello ${count}`,
        },
      })),
    );
  }
}