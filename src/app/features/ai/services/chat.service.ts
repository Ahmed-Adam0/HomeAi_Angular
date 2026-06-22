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

  sendVoiceMessage(
    audioFile: Blob,
    userId: string,
    conversationId?: string
  ): Observable<ChatResponse> {
    const formData = new FormData();
    formData.append('audioFile', audioFile, 'voice-message.wav');
    formData.append('userId', userId);
    if (conversationId) {
      formData.append('conversationId', conversationId);
    }
    return this.http.post<ChatResponse>(
      `${this.apiUrl}${API_URLS.AI.CHAT}/voice`,
      formData,
    );
  }

  sendChatMessage(
    userId: string,
    message?: string,
    voiceBlob?: Blob,
    localAudioUrl?: string
  ): void {
    if (!message?.trim() && !voiceBlob) return;

    this.loading.set(true);

    if (voiceBlob) {
      const userVoiceMessage: ChatMessage = {
        id: crypto.randomUUID(),
        content: '',
        sender: 'user',
        timestamp: new Date(),
        audioUrl: localAudioUrl,
      };
      this.messages.update(current => [...current, userVoiceMessage]);

      const conversationId = this.conversationId() ?? undefined;

      this.sendVoiceMessage(voiceBlob, userId, conversationId)
        .pipe(
          finalize(() => {
            if (!message?.trim()) {
              this.loading.set(false);
            }
          }),
          catchError((error: HttpErrorResponse) => {
            const errorMessage =
              error.error?.message ??
              error.error?.Message ??
              ERROR_MESSAGES[error.status] ??
              DEFAULT_ERROR;

            this.notificationService.error(errorMessage);
            return EMPTY;
          }),
        )
        .subscribe(response => {
          if (response.success && response.data?.reply) {
            this.messages.update(current => [
              ...current,
              {
                id: crypto.randomUUID(),
                content: response.data.reply,
                sender: 'bot',
                timestamp: new Date(),
              },
            ]);
          } else if (!response.success && response.message) {
            this.notificationService.error(response.message);
          }

          if (message?.trim()) {
            this.sendTextChatMessage(userId, message.trim());
          }
        });
    } else if (message?.trim()) {
      this.sendTextChatMessage(userId, message.trim());
    }
  }

  private sendTextChatMessage(userId: string, message: string): void {
    const userTextMessage: ChatMessage = {
      id: crypto.randomUUID(),
      content: message,
      sender: 'user',
      timestamp: new Date(),
    };
    this.messages.update(current => [...current, userTextMessage]);
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
          const errorMessage =
            error.error?.message ??
            error.error?.Message ??
            ERROR_MESSAGES[error.status] ??
            DEFAULT_ERROR;

          this.notificationService.error(errorMessage);
          return EMPTY;
        }),
      )
      .subscribe(response => {
        if (response.success && response.data?.reply) {
          this.messages.update(current => [
            ...current,
            {
              id: crypto.randomUUID(),
              content: response.data.reply,
              sender: 'bot',
              timestamp: new Date(),
            },
          ]);
        } else if (!response.success && response.message) {
          this.notificationService.error(response.message);
        }
      });
  }

  clearChat(): void {
    this.messages.set([]);
    this.conversationId.set(null);
  }
}
