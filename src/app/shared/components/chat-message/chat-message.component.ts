import { Component, inject, computed, input, ChangeDetectionStrategy } from '@angular/core';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { ChatMessage } from '../../../features/ai/interfaces/chat-message.interface';
import { SpeechService } from '../../../features/ai/services/speech.service';
import { TranslatePipe } from '../../pipes/translate.pipe';

@Component({
  selector: 'app-chat-message',
  standalone: true,
  imports: [TranslatePipe],
  templateUrl: './chat-message.component.html',
  styleUrl: './chat-message.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ChatMessageComponent {
  message = input.required<ChatMessage>();
  
  protected readonly speechService = inject(SpeechService);
  private readonly sanitizer = inject(DomSanitizer);

  readonly parsedContent = computed<SafeHtml>(() => {
    const rawContent = this.message().content || '';
    const parsedHtml = this.parseMarkdown(rawContent);
    return this.sanitizer.bypassSecurityTrustHtml(parsedHtml);
  });

  toggleAudio(audioEl: HTMLAudioElement): void {
    if (audioEl.paused) {
      void audioEl.play();
    } else {
      audioEl.pause();
    }
  }

  toggleSpeech(): void {
    const msg = this.message();
    if (this.speechService.currentlyPlayingId() === msg.id) {
      this.speechService.stop();
    } else if (msg.content) {
      void this.speechService.speak(msg.id, msg.content);
    }
  }

  formatTimestamp(timestamp: Date | string | number): string {
    if (!timestamp) return '';
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }

  private parseMarkdown(text: string): string {
    if (!text) return '';

    // Step 1: Escape HTML tags to prevent XSS/injection attacks
    let html = text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');

    // Step 2: Handle Headings
    html = html.replace(/^### (.*?)$/gm, '<h5>$1</h5>');
    html = html.replace(/^## (.*?)$/gm, '<h4>$1</h4>');
    html = html.replace(/^# (.*?)$/gm, '<h3>$1</h3>');

    // Step 3: Handle Bold and Italic formatting
    html = html.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
    html = html.replace(/\*(.*?)\*/g, '<em>$1</em>');
    html = html.replace(/__(.*?)__/g, '<strong>$1</strong>');
    html = html.replace(/_(.*?)_/g, '<em>$1</em>');

    // Step 4: Handle Bullet lists
    let inBulletList = false;
    const lines = html.split('\n');
    const processedLines = lines.map(line => {
      const bulletMatch = line.match(/^(\s*)[-*+]\s+(.*)$/);
      if (bulletMatch) {
        let content = `<li>${bulletMatch[2]}</li>`;
        if (!inBulletList) {
          inBulletList = true;
          return `<ul>${content}`;
        }
        return content;
      } else {
        if (inBulletList) {
          inBulletList = false;
          return `</ul>${line}`;
        }
        return line;
      }
    });
    if (inBulletList) {
      processedLines.push('</ul>');
    }
    html = processedLines.join('\n');

    // Step 5: Handle Numbered lists
    let inNumberedList = false;
    const lines2 = html.split('\n');
    const processedLines2 = lines2.map(line => {
      const numMatch = line.match(/^(\s*)\d+\.\s+(.*)$/);
      if (numMatch) {
        let content = `<li>${numMatch[2]}</li>`;
        if (!inNumberedList) {
          inNumberedList = true;
          return `<ol>${content}`;
        }
        return content;
      } else {
        if (inNumberedList) {
          inNumberedList = false;
          return `</ol>${line}`;
        }
        return line;
      }
    });
    if (inNumberedList) {
      processedLines2.push('</ol>');
    }
    html = processedLines2.join('\n');

    // Step 6: Preserve line breaks for non-list tags
    const lines3 = html.split('\n');
    html = lines3.map(line => {
      const trimmed = line.trim();
      if (trimmed === '' || 
          trimmed.startsWith('<ul') || trimmed.startsWith('</ul') || 
          trimmed.startsWith('<ol') || trimmed.startsWith('</ol') || 
          trimmed.startsWith('<li') || trimmed.startsWith('<h')) {
        return line;
      }
      return line + '<br>';
    }).join('\n');

    return html;
  }
}
