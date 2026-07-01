import { Component, inject, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AiService } from '../../services/ai.service';
import { RoomDesignSessionService } from '../../services/room-design-session.service';
import { TranslatePipe } from '../../../../shared/pipes/translate.pipe';
import { BeforeAfterSliderComponent } from '../../../../shared/components/before-after-slider/before-after-slider.component';

@Component({
  selector: 'app-generated-room',
  standalone: true,
  imports: [CommonModule, TranslatePipe, BeforeAfterSliderComponent],
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
  readonly workspaceImageUrl = computed(() => 
    this.sessionService.session().generatedImageUrl ??
    this.sessionService.previewUrl() ??
    this.aiService.currentRoom().imageUrl
  );

  /** True when the user has uploaded a room but generation has not run yet. */
  readonly isAwaitingGeneration = computed(() => 
    this.sessionService.hasRoom() &&
    !this.sessionService.session().generatedImageUrl
  );

  /** True when the AI has returned a generated result. */
  readonly isGenerated = computed(() => 
    !!this.sessionService.session().generatedImageUrl
  );

  openSummary(): void {
    this.aiService.isSummaryOpen.set(true);
  }
}
