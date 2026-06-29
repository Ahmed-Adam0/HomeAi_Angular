import { Component, inject, signal, ViewChild, ElementRef, AfterViewChecked, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AiService, ChatMessage } from '../../services/ai.service';
import { TranslatePipe } from '../../../../shared/pipes/translate.pipe';
import { SpeechService } from '../../services/speech.service';

@Component({
  selector: 'app-chat-panel',
  standalone: true,
  imports: [CommonModule, FormsModule, TranslatePipe],
  templateUrl: './chat-panel.component.html',
  styleUrl: './chat-panel.component.css'
})
export class ChatPanel implements OnInit, AfterViewChecked, OnDestroy {
  protected readonly aiService = inject(AiService);
  protected readonly speechService = inject(SpeechService);
  protected inputMessage = '';

  @ViewChild('scrollContainer') private scrollContainer!: ElementRef;

  ngOnInit(): void {
    this.scrollToBottom();
  }

  ngAfterViewChecked(): void {
    this.scrollToBottom();
  }

  private scrollToBottom(): void {
    try {
      const el = this.scrollContainer.nativeElement;
      el.scrollTop = el.scrollHeight;
    } catch (err) {}
  }

  sendMessage(): void {
    if (!this.inputMessage.trim()) return;
    this.aiService.sendMessage(this.inputMessage);
    this.inputMessage = '';
  }

  openInspirationUpload(): void {
    this.aiService.isInspirationOpen.set(true);
  }

  ngOnDestroy(): void {
    this.speechService.stop();
  }

  toggleSpeech(msg: ChatMessage): void {
    if (this.speechService.currentlyPlayingId() === msg.timestamp) {
      this.speechService.stop();
    } else {
      void this.speechService.speak(msg.timestamp, msg.text);
    }
  }
}
