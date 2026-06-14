import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AiService } from '../../services/ai.service';

@Component({
  selector: 'app-generated-room',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './generated-room.component.html',
  styleUrl: './generated-room.component.css'
})
export class GeneratedRoom {
  protected readonly aiService = inject(AiService);

  selectHotspot(id: number, event: Event): void {
    event.stopPropagation();
    this.aiService.selectHotspot(id);
  }

  openSummary(): void {
    this.aiService.isSummaryOpen.set(true);
  }
}
