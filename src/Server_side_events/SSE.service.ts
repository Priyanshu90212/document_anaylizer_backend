import { Injectable, MessageEvent } from "@nestjs/common";
import { Subject } from "rxjs";

@Injectable()
export class ServerSideEventsService {

    private streams = new Map<string, Subject<MessageEvent>>();

getStream(channel: string) {

  if (!this.streams.has(channel)) {
    this.streams.set(channel, new Subject<MessageEvent>());
  }

  return this.streams.get(channel)!.asObservable();
}

   send(channel: string, data: any) {
  console.log("📤 SEND:", channel);

  const stream = this.streams.get(channel);

  console.log("STREAM EXISTS:", !!stream);

  if (!stream) {
    console.log("❌ NO STREAM FOR:", channel);
    return;
  }

  console.log("✅ SENDING:", data);

  stream.next({
    data
  });
}

    close(channel: string) {
        this.streams.get(channel)?.complete();
        this.streams.delete(channel);
    }

}