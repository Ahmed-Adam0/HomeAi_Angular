import { ChatReply } from './chat-reply.interface';

export interface ChatResponse {
  Success: boolean;
  Message: string;
  Data: ChatReply;
}
