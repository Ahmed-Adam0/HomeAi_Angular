import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, finalize, catchError, EMPTY } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { API_URLS } from '../../../core/constants';
import { ChatRequest } from '../interfaces/chat-request.interface';
import { ChatResponse } from '../interfaces/chat-response.interface';
import { ChatMessage } from '../interfaces/chat-message.interface';

@Injectable({
  providedIn: 'root',
})
export class ChatService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = environment.apiUrl;

  readonly messages = signal<ChatMessage[]>([]);
  readonly loading = signal(false);
  readonly conversationId = signal<string | null>(null);

  sendMessage(request: ChatRequest): Observable<ChatResponse> {
    return this.http.post<ChatResponse>(
      `${this.apiUrl}${API_URLS.AI.CHAT}`,
      request,
    );
  }

  sendChatMessage(userId: string, message: string): void {
    if (!message.trim()) return;

    const userMessage: ChatMessage = {
      id: crypto.randomUUID(),
      content: message,
      sender: 'user',
      timestamp: new Date(),
    };

    this.messages.update(current => [...current, userMessage]);
    this.loading.set(true);

    const request: ChatRequest = {
      userId,
      message,
      conversationId: this.conversationId() ?? undefined,
    };

    this.sendMessage(request)
      .pipe(
        finalize(() => this.loading.set(false)),
        catchError(() => {
          this.messages.update(current => [
            ...current,
            {
              id: crypto.randomUUID(),
              content: "Sorry, I couldn't process your request right now.",
              sender: 'bot',
              timestamp: new Date(),
            },
          ]);
          return EMPTY;
        }),
      )
      .subscribe(response => {
        this.messages.update(current => [
          ...current,
          {
            id: crypto.randomUUID(),
            content: response.data.reply,
            sender: 'bot',
            timestamp: new Date(),
          },
        ]);
      });
  }

  clearChat(): void {
    this.messages.set([]);
    this.conversationId.set(null);
  }
}
