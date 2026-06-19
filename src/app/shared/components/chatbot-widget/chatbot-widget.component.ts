import {
  Component,
  inject,
  signal,
  ViewChild,
  ElementRef,
  afterNextRender,
  effect,
  ChangeDetectionStrategy,
  OnDestroy,
  PLATFORM_ID,
} from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { ChatService } from '../../../features/ai/services/chat.service';
import { AuthService } from '../../../features/auth/services/auth.service';
import { ChatMessage } from '../../../features/ai/interfaces/chat-message.interface';

/** Type declaration for the Web Speech API (vendor-prefixed in most browsers). */
interface SpeechRecognitionInstance extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  start(): void;
  stop(): void;
  abort(): void;
  onresult: ((event: SpeechRecognitionEvent) => void) | null;
  onerror: ((event: SpeechRecognitionErrorEvent) => void) | null;
  onend: (() => void) | null;
}

interface SpeechRecognitionEvent {
  readonly results: SpeechRecognitionResultList;
  readonly resultIndex: number;
}

interface SpeechRecognitionResultList {
  readonly length: number;
  item(index: number): SpeechRecognitionResult;
  [index: number]: SpeechRecognitionResult;
}

interface SpeechRecognitionResult {
  readonly length: number;
  readonly isFinal: boolean;
  item(index: number): SpeechRecognitionAlternative;
  [index: number]: SpeechRecognitionAlternative;
}

interface SpeechRecognitionAlternative {
  readonly transcript: string;
  readonly confidence: number;
}

interface SpeechRecognitionErrorEvent extends Event {
  readonly error: string;
  readonly message: string;
}

@Component({
  selector: 'app-chatbot-widget',
  imports: [],
  templateUrl: './chatbot-widget.component.html',
  styleUrl: './chatbot-widget.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ChatbotWidget implements OnDestroy {
  private readonly chatService = inject(ChatService);
  private readonly authService = inject(AuthService);
  private readonly platformId = inject(PLATFORM_ID);

  @ViewChild('messagesContainer') private readonly messagesContainer!: ElementRef<HTMLElement>;
  @ViewChild('messageTextarea') private readonly messageTextarea!: ElementRef<HTMLTextAreaElement>;

  readonly isOpen = signal(false);
  readonly messages = this.chatService.messages;
  readonly loading = this.chatService.loading;
  readonly isRecording = this.chatService.isRecording;
  readonly messageInput = signal('');
  readonly voiceSupported = signal(false);

  private recognition: SpeechRecognitionInstance | null = null;

  constructor() {
    // Auto-scroll when messages change
    effect(() => {
      this.chatService.messages();
      afterNextRender(() => this.scrollToBottom());
    });

    // Detect Web Speech API support
    if (isPlatformBrowser(this.platformId)) {
      const windowRef = window as unknown as Record<string, unknown>;
      this.voiceSupported.set(
        'SpeechRecognition' in window || 'webkitSpeechRecognition' in window
      );

      if (this.voiceSupported()) {
        const SpeechRecognitionCtor = (windowRef['SpeechRecognition'] ?? windowRef['webkitSpeechRecognition']) as
          | (new () => SpeechRecognitionInstance)
          | undefined;

        if (SpeechRecognitionCtor) {
          this.recognition = new SpeechRecognitionCtor();
          this.recognition.continuous = false;
          this.recognition.interimResults = false;
          this.recognition.lang = 'en-US';

          this.recognition.onresult = (event: SpeechRecognitionEvent) => {
            const transcript = event.results[0]?.[0]?.transcript ?? '';
            if (transcript) {
              this.messageInput.set(transcript);
            }
          };

          this.recognition.onerror = () => {
            this.chatService.isRecording.set(false);
          };

          this.recognition.onend = () => {
            this.chatService.isRecording.set(false);
          };
        }
      }
    }
  }

  ngOnDestroy(): void {
    if (this.recognition && this.isRecording()) {
      this.recognition.abort();
      this.chatService.isRecording.set(false);
    }
  }

  toggleChat(): void {
    this.isOpen.update(v => !v);
    if (this.isOpen()) {
      afterNextRender(() => {
        this.scrollToBottom();
        this.messageTextarea?.nativeElement?.focus();
      });
    }
  }

  closeChat(): void {
    this.isOpen.set(false);
  }

  onInputChange(event: Event): void {
    const textarea = event.target as HTMLTextAreaElement;
    this.messageInput.set(textarea.value);
    this.autoResizeTextarea(textarea);
  }

  onKeydown(event: KeyboardEvent): void {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      this.sendMessage();
    }
  }

  sendMessage(): void {
    const text = this.messageInput().trim();
    if (!text || this.loading()) return;

    this.messageInput.set('');
    this.resetTextareaHeight();

    const userId = this.authService.currentUser()?.id ?? 'guest-user';
    this.chatService.sendChatMessage(userId, text);
  }

  toggleRecording(): void {
    if (!this.recognition) return;

    if (this.isRecording()) {
      this.stopRecording();
    } else {
      this.startRecording();
    }
  }

  trackById(_index: number, message: ChatMessage): string {
    return message.id;
  }

  formatTimestamp(date: Date): string {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }

  private startRecording(): void {
    if (!this.recognition) return;

    try {
      this.chatService.isRecording.set(true);
      this.recognition.start();
    } catch {
      this.chatService.isRecording.set(false);
    }
  }

  private stopRecording(): void {
    if (!this.recognition) return;

    this.recognition.stop();
    this.chatService.isRecording.set(false);
  }

  private scrollToBottom(): void {
    try {
      const el = this.messagesContainer?.nativeElement;
      if (el) {
        el.scrollTop = el.scrollHeight;
      }
    } catch {
      // noop — element not yet rendered
    }
  }

  private autoResizeTextarea(textarea: HTMLTextAreaElement): void {
    textarea.style.height = 'auto';
    textarea.style.height = Math.min(textarea.scrollHeight, 120) + 'px';
  }

  private resetTextareaHeight(): void {
    const textarea = this.messageTextarea?.nativeElement;
    if (textarea) {
      textarea.style.height = 'auto';
    }
  }
}
