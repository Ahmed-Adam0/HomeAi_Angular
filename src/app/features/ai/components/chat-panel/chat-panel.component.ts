import { Component, inject, signal, ViewChild, ElementRef, AfterViewChecked, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AiService } from '../../services/ai.service';

@Component({
  selector: 'app-chat-panel',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './chat-panel.component.html',
  styleUrl: './chat-panel.component.css'
})
export class ChatPanel implements OnInit, AfterViewChecked {
  protected readonly aiService = inject(AiService);
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
}
