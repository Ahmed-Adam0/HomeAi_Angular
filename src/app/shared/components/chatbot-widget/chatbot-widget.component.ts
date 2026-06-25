import {
  Component,
  inject,
  signal,
  computed,
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
  @ViewChild('previewAudio') private readonly previewAudio?: ElementRef<HTMLAudioElement>;

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
  readonly previewPlaying = signal(false);
  readonly previewCurrentTime = signal(0);
  readonly previewDuration = signal(0);

  readonly previewProgress = computed(() => {
    const duration = this.previewDuration();
    return duration > 0 ? (this.previewCurrentTime() / duration) * 100 : 0;
  });

  readonly canSend = computed(() => {
    if (this.loading()) return false;
    if (this.isRecording()) return true;
    return !!(this.messageInput().trim() || this.recordedAudioBlob());
  });

  private mediaRecorder: MediaRecorder | null = null;
  private mediaStream: MediaStream | null = null;
  private audioChunks: Blob[] = [];
  private durationIntervalId: ReturnType<typeof setInterval> | null = null;
  private sendAfterStop = false;

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
    if (this.loading()) return;

    if (this.isRecording()) {
      this.sendAfterStop = true;
      this.stopRecording();
      return;
    }

    const text = this.messageInput().trim();
    const voiceBlob = this.recordedAudioBlob() || undefined;
    const localAudioUrl = this.recordedAudioUrl() || undefined;

    if (!text && !voiceBlob) return;

    this.dispatchMessage(text || undefined, voiceBlob, localAudioUrl);
  }

  toggleRecording(): void {
    if (!this.voiceSupported()) return;

    if (this.isRecording()) {
      this.finishRecording();
    } else {
      this.startRecording();
    }
  }

  finishRecording(): void {
    if (!this.isRecording()) return;
    this.sendAfterStop = false;
    this.stopRecording();
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
    this.sendAfterStop = false;
    this.resetPreviewPlayer();

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

  togglePreviewPlay(): void {
    const audio = this.previewAudio?.nativeElement;
    if (!audio) return;

    if (audio.paused) {
      void audio.play();
      this.previewPlaying.set(true);
    } else {
      audio.pause();
      this.previewPlaying.set(false);
    }
  }

  onPreviewLoaded(): void {
    const audio = this.previewAudio?.nativeElement;
    if (audio && Number.isFinite(audio.duration)) {
      this.previewDuration.set(audio.duration);
    }
  }

  onPreviewTimeUpdate(): void {
    const audio = this.previewAudio?.nativeElement;
    if (audio) {
      this.previewCurrentTime.set(audio.currentTime);
    }
  }

  onPreviewEnded(): void {
    this.previewPlaying.set(false);
    this.previewCurrentTime.set(0);
    const audio = this.previewAudio?.nativeElement;
    if (audio) {
      audio.currentTime = 0;
    }
  }

  seekPreview(event: MouseEvent): void {
    const bar = event.currentTarget as HTMLElement;
    const audio = this.previewAudio?.nativeElement;
    const duration = this.previewDuration();
    if (!audio || duration <= 0) return;

    const rect = bar.getBoundingClientRect();
    const ratio = Math.min(1, Math.max(0, (event.clientX - rect.left) / rect.width));
    audio.currentTime = ratio * duration;
    this.previewCurrentTime.set(audio.currentTime);
  }

  formatAudioTime(seconds: number): string {
    if (!Number.isFinite(seconds) || seconds < 0) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
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
          const url = URL.createObjectURL(audioBlob);
          this.recordedAudioBlob.set(audioBlob);
          this.recordedAudioUrl.set(url);
          this.chatService.isRecording.set(false);
          this.stopDurationTimer();
          this.resetPreviewPlayer();

          if (this.mediaStream) {
            this.mediaStream.getTracks().forEach(track => track.stop());
            this.mediaStream = null;
          }

          if (this.sendAfterStop) {
            this.sendAfterStop = false;
            const text = this.messageInput().trim();
            if (audioBlob.size > 0) {
              this.dispatchMessage(text || undefined, audioBlob, url);
            }
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

  private dispatchMessage(
    text?: string,
    voiceBlob?: Blob,
    localAudioUrl?: string
  ): void {
    if (!text && !voiceBlob) return;

    this.messageInput.set('');
    this.resetTextareaHeight();

    const userId = this.authService.currentUser()?.id ?? 'guest-user';
    this.chatService.sendChatMessage(
      userId,
      text,
      voiceBlob,
      localAudioUrl
    );

    this.recordedAudioBlob.set(null);
    this.recordedAudioUrl.set(null);
    this.recordingDuration.set(0);
    this.resetPreviewPlayer();
  }

  private resetPreviewPlayer(): void {
    const audio = this.previewAudio?.nativeElement;
    if (audio) {
      audio.pause();
      audio.currentTime = 0;
    }
    this.previewPlaying.set(false);
    this.previewCurrentTime.set(0);
    this.previewDuration.set(0);
  }
}

