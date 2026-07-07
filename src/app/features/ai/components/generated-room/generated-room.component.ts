import { Component, inject, computed, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AiService } from '../../services/ai.service';
import { RoomDesignSessionService } from '../../services/room-design-session.service';
import { TranslatePipe } from '../../../../shared/pipes/translate.pipe';
import { BeforeAfterSliderComponent } from '../../../../shared/components/before-after-slider/before-after-slider.component';
import { NotificationService } from '../../../../shared/services/notification.service';

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
  protected readonly notificationService = inject(NotificationService);

  readonly isDownloading = signal(false);

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

  async downloadImage(): Promise<void> {
    const imageUrl = this.sessionService.session().generatedImageUrl;
    if (!imageUrl) return;

    this.isDownloading.set(true);

    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const filename = `furnimind-ai-room-${year}-${month}-${day}-${hours}-${minutes}.png`;

    try {
      const response = await fetch(imageUrl);
      if (!response.ok) {
        throw new Error(`Failed to fetch image: ${response.statusText}`);
      }
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.warn('CORS/Blob download failed, attempting direct download fallback:', error);
      try {
        const a = document.createElement('a');
        a.href = imageUrl;
        a.download = filename;
        a.target = '_blank';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
      } catch (fallbackError) {
        console.error('Direct download fallback failed:', fallbackError);
        this.notificationService.error('AI.WORKSPACE.DOWNLOAD_ERROR');
      }
    } finally {
      this.isDownloading.set(false);
    }
  }
}

