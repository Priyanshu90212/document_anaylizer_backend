import { Injectable, MessageEvent } from "@nestjs/common";
import { Subject } from "rxjs";

@Injectable()
export class ServerSideEventsService {

    private streams = new Map<string, Subject<MessageEvent>>();

getStream(documentId: string) {
  console.log("Opening stream:", documentId);

  if (!this.streams.has(documentId)) {
    console.log("Creating new Subject");
    this.streams.set(documentId, new Subject<MessageEvent>());
  }

  console.log("Current streams:", [...this.streams.keys()]);

  return this.streams.get(documentId)!.asObservable();
}

send(documentId: string, data: any) {
  console.log("Sending to:", documentId);
  console.log("Map keys:", [...this.streams.keys()]);

  const stream = this.streams.get(documentId);

  console.log("Stream object:", stream);

  if (stream) {
    console.log("Calling next()");
    stream.next({ data });
  }
}

    close(documentId: string) {

        this.streams.get(documentId)?.complete();

        this.streams.delete(documentId);
    }

}