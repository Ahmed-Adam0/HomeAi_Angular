import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AiService } from '../../services/ai.service';
import { RoomDesignSessionService } from '../../services/room-design-session.service';
import { TranslatePipe } from '../../../../shared/pipes/translate.pipe';

@Component({
  selector: 'app-generated-room',
  standalone: true,
  imports: [CommonModule, TranslatePipe],
  templateUrl: './generated-room.component.html',
  styleUrl: './generated-room.component.css'
})
export class GeneratedRoom {
  protected readonly aiService = inject(AiService);
  protected readonly sessionService = inject(RoomDesignSessionService);

  /**
   * The image URL to show in the main workspace.
   *
   * Priority order:
   *   1. generatedImageUrl — returned by the future AI generation backend
   *   2. previewUrl        — the user's uploaded room (frontend-only for now)
   *   3. aiService demo    — the static demo room (shown when no upload exists)
   *
   * TODO: Once the generation endpoint is connected, generatedImageUrl will
   * automatically take priority here with no template changes needed.
   */
  get workspaceImageUrl(): string {
    return (
      this.sessionService.session().generatedImageUrl ??
      this.sessionService.previewUrl() ??
      this.aiService.currentRoom().imageUrl
    );
  }

  /** True when the user has uploaded a room but generation has not run yet. */
  get isAwaitingGeneration(): boolean {
    return (
      this.sessionService.hasRoom() &&
      !this.sessionService.session().generatedImageUrl
    );
  }

  /** True when the AI has returned a generated result. */
  get isGenerated(): boolean {
    return !!this.sessionService.session().generatedImageUrl;
  }

  selectHotspot(id: number, event: Event): void {
    event.stopPropagation();
    this.aiService.selectHotspot(id);
  }

  openSummary(): void {
    this.aiService.isSummaryOpen.set(true);
  }
}
