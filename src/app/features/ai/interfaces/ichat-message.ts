export interface IChatMessage {
  id: string;
  sender: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: string;
  attachments?: string[]; // Image URLs uploaded by the user to analyze
}
