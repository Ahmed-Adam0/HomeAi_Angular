import { Injectable, inject, signal } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, finalize, catchError, EMPTY } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { API_URLS } from '../../../core/constants';
import { ChatRequest } from '../interfaces/chat-request.interface';
import { ChatResponse } from '../interfaces/chat-response.interface';
import { ChatMessage } from '../interfaces/chat-message.interface';
import { NotificationService } from '../../../shared/services/notification.service';

/** Maps HTTP status codes to user-friendly error messages for the chatbot. */
const ERROR_MESSAGES: Record<number, string> = {
  400: 'Invalid message. Please check your input and try again.',
  408: 'Request was cancelled. Please try again.',
  500: 'An unexpected error occurred. Please try later.',
  502: 'AI response failure. Please try again shortly.',
  503: 'FurniMind AI is temporarily unavailable. Please try again in a moment.',
  504: 'AI request timed out. Please try again.',
};

const DEFAULT_ERROR = 'Something went wrong. Please try later.';

@Injectable({
  providedIn: 'root',
})
export class ChatService {
  private readonly http = inject(HttpClient);
  private readonly notificationService = inject(NotificationService);
  private readonly apiUrl = environment.apiUrl;

  readonly messages = signal<ChatMessage[]>([]);
  readonly loading = signal(false);
  readonly conversationId = signal<string | null>(null);
  readonly isRecording = signal(false);

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
        catchError((error: HttpErrorResponse) => {
          const errorMessage = ERROR_MESSAGES[error.status] ?? DEFAULT_ERROR;

          this.notificationService.error(errorMessage);

          this.messages.update(current => [
            ...current,
            {
              id: crypto.randomUUID(),
              content: errorMessage,
              sender: 'bot',
              timestamp: new Date(),
            },
          ]);
          return EMPTY;
        }),
      )
      .subscribe(response => {
        if (response.Data?.Reply) {
          this.messages.update(current => [
            ...current,
            {
              id: crypto.randomUUID(),
              content: response.Data.Reply,
              sender: 'bot',
              timestamp: new Date(),
            },
          ]);
        }
      });
  }

  clearChat(): void {
    this.messages.set([]);
    this.conversationId.set(null);
  }
}
