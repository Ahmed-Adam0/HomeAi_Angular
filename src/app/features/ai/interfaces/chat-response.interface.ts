import { ChatReply } from './chat-reply.interface';

export interface ChatResponse {
  success: boolean;
  message: string;
  data: ChatReply;
}
