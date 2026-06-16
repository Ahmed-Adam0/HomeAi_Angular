import { Component, inject, signal, ViewChild, ElementRef, afterNextRender, effect } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ChatService } from '../../../features/ai/services/chat.service';
import { AuthService } from '../../../features/auth/services/auth.service';
import { ChatMessage } from '../../../features/ai/interfaces/chat-message.interface';

@Component({
  selector: 'app-chatbot-widget',
  imports: [FormsModule],
  templateUrl: './chatbot-widget.component.html',
  styleUrl: './chatbot-widget.component.css',
})
export class ChatbotWidget {
  private readonly chatService = inject(ChatService);
  private readonly authService = inject(AuthService);

  @ViewChild('messagesContainer') private readonly messagesContainer!: ElementRef<HTMLElement>;

  readonly isOpen = signal(false);
  readonly messages = this.chatService.messages;
  readonly loading = this.chatService.loading;

  messageInput = '';

  constructor() {
    effect(() => {
      this.chatService.messages();
      afterNextRender(() => this.scrollToBottom());
    });
  }

  toggleChat(): void {
    this.isOpen.update(v => !v);
  }

  closeChat(): void {
    this.isOpen.set(false);
  }

  sendMessage(): void {
    const text = this.messageInput.trim();
    if (!text) return;

    this.messageInput = '';
    const userId = this.authService.currentUser()?.id ?? 'guest-user';
    this.chatService.sendChatMessage(userId, text);
  }

  trackById(_index: number, message: ChatMessage): string {
    return message.id;
  }

  private scrollToBottom(): void {
    try {
      this.messagesContainer.nativeElement.scrollTop = this.messagesContainer.nativeElement.scrollHeight;
    } catch {
      // noop
    }
  }
}
