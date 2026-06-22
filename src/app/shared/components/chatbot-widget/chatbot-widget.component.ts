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
import { NotificationService } from '../../../shared/services/notification.service';

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
  private readonly notificationService = inject(NotificationService);
  private readonly platformId = inject(PLATFORM_ID);

  @ViewChild('messagesContainer') private readonly messagesContainer!: ElementRef<HTMLElement>;
  @ViewChild('messageTextarea') private readonly messageTextarea!: ElementRef<HTMLTextAreaElement>;

  readonly isOpen = signal(false);
  readonly messages = this.chatService.messages;
  readonly loading = this.chatService.loading;
  readonly isRecording = this.chatService.isRecording;
  readonly messageInput = signal('');
  readonly voiceSupported = signal(false);

  // New signals for recording and previewing voice messages
  readonly recordedAudioBlob = signal<Blob | null>(null);
  readonly recordedAudioUrl = signal<string | null>(null);
  readonly recordingDuration = signal<number>(0);

  private mediaRecorder: MediaRecorder | null = null;
  private mediaStream: MediaStream | null = null;
  private audioChunks: Blob[] = [];
  private durationIntervalId: ReturnType<typeof setInterval> | null = null;

  constructor() {
    // Auto-scroll when messages change
    effect(() => {
      this.chatService.messages();
      this.triggerScroll();
    });

    // Valid injection context usage: registered once during construction phase
    afterNextRender(() => {
      this.scrollToBottom();
    });

    if (isPlatformBrowser(this.platformId)) {
      const hasMicSupport = !!(
        typeof window !== 'undefined' &&
        navigator.mediaDevices &&
        navigator.mediaDevices.getUserMedia
      );
      this.voiceSupported.set(hasMicSupport);
    }
  }

  ngOnDestroy(): void {
    this.clearRecording();
  }

  toggleChat(): void {
    this.isOpen.update(v => !v);
    if (this.isOpen()) {
      this.triggerScrollAndFocus();
    }
  }

  triggerScroll(): void {
    if (isPlatformBrowser(this.platformId)) {
      setTimeout(() => this.scrollToBottom(), 0);
    }
  }

  triggerScrollAndFocus(): void {
    if (isPlatformBrowser(this.platformId)) {
      setTimeout(() => {
        this.scrollToBottom();
        this.messageTextarea?.nativeElement?.focus();
      }, 0);
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
    const voiceBlob = this.recordedAudioBlob() || undefined;
    const localAudioUrl = this.recordedAudioUrl() || undefined;

    if ((!text && !voiceBlob) || this.loading()) return;

    this.messageInput.set('');
    this.resetTextareaHeight();

    const userId = this.authService.currentUser()?.id ?? 'guest-user';
    this.chatService.sendChatMessage(
      userId,
      text || undefined,
      voiceBlob,
      localAudioUrl
    );

    // Clear voice signals immediately so UI resets
    this.recordedAudioBlob.set(null);
    this.recordedAudioUrl.set(null);
  }

  toggleRecording(): void {
    if (!this.voiceSupported()) return;

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

  formatDuration(seconds: number): string {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  }

  clearRecording(): void {
    const url = this.recordedAudioUrl();
    if (url) {
      URL.revokeObjectURL(url);
    }
    this.recordedAudioBlob.set(null);
    this.recordedAudioUrl.set(null);
    this.recordingDuration.set(0);
    this.stopDurationTimer();

    if (this.mediaRecorder && this.mediaRecorder.state !== 'inactive') {
      this.mediaRecorder.stop();
    }
    if (this.mediaStream) {
      this.mediaStream.getTracks().forEach(track => track.stop());
      this.mediaStream = null;
    }
    this.chatService.isRecording.set(false);
  }

  private startRecording(): void {
    if (!isPlatformBrowser(this.platformId) || !this.voiceSupported()) return;

    this.clearRecording();

    navigator.mediaDevices
      .getUserMedia({ audio: true })
      .then(stream => {
        this.mediaStream = stream;
        this.mediaRecorder = new MediaRecorder(stream);
        this.audioChunks = [];

        this.mediaRecorder.ondataavailable = (event) => {
          if (event.data && event.data.size > 0) {
            this.audioChunks.push(event.data);
          }
        };

        this.mediaRecorder.onstop = () => {
          const audioBlob = new Blob(this.audioChunks, { type: 'audio/wav' });
          this.recordedAudioBlob.set(audioBlob);
          this.recordedAudioUrl.set(URL.createObjectURL(audioBlob));
          this.chatService.isRecording.set(false);
          this.stopDurationTimer();

          if (this.mediaStream) {
            this.mediaStream.getTracks().forEach(track => track.stop());
            this.mediaStream = null;
          }
        };

        this.mediaRecorder.start();
        this.chatService.isRecording.set(true);
        this.startDurationTimer();
      })
      .catch(() => {
        this.notificationService.error('Microphone access denied or not available.');
        this.chatService.isRecording.set(false);
      });
  }

  private stopRecording(): void {
    if (this.mediaRecorder && this.mediaRecorder.state !== 'inactive') {
      this.mediaRecorder.stop();
    }
  }

  private startDurationTimer(): void {
    this.recordingDuration.set(0);
    this.durationIntervalId = setInterval(() => {
      this.recordingDuration.update(d => d + 1);
    }, 1000);
  }

  private stopDurationTimer(): void {
    if (this.durationIntervalId) {
      clearInterval(this.durationIntervalId);
      this.durationIntervalId = null;
    }
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

