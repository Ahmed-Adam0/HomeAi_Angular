import { Component, inject, signal, computed, ElementRef, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { TranslatePipe } from '../../../../shared/pipes/translate.pipe';
import { RoomDesignSessionService } from '../../services/room-design-session.service';
import { NAV_ROUTES } from '../../../../core/constants';

/** Maximum accepted file size: 10 MB */
const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024;

@Component({
  selector: 'app-room-upload',
  standalone: true,
  imports: [CommonModule, FormsModule, TranslatePipe],
  templateUrl: './room-upload.component.html',
  styleUrl: './room-upload.component.css',
})
export class RoomUpload {
  private readonly router = inject(Router);
  protected readonly sessionService = inject(RoomDesignSessionService);

  @ViewChild('fileInput') private fileInput!: ElementRef<HTMLInputElement>;

  /** Whether the user is currently dragging a file over the drop zone */
  protected isDragging = signal(false);

  /** Validation error message (shown when file is invalid) */
  protected errorMessage = signal<string | null>(null);

  /** Room dimension inputs (meters) */
  protected width = signal<number | null>(null);
  protected length = signal<number | null>(null);
  protected height = signal<number | null>(null);

  /** Computes whether the form is fully valid for navigation */
  protected isFormValid = computed(() => {
    const hasImage = this.sessionService.hasRoom();
    const w = this.width();
    const l = this.length();
    const h = this.height();
    return (
      hasImage &&
      w !== null && w >= 1 &&
      l !== null && l >= 1 &&
      h !== null && h >= 1
    );
  });

  // ─── Drag & Drop handlers ──────────────────────────────────────────────────

  onDragOver(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.isDragging.set(true);
  }

  onDragLeave(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.isDragging.set(false);
  }

  onDrop(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.isDragging.set(false);

    const file = event.dataTransfer?.files?.[0];
    if (file) {
      this.processFile(file);
    }
  }

  // ─── Browse button handler ─────────────────────────────────────────────────

  openFilePicker(): void {
    this.fileInput.nativeElement.click();
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (file) {
      this.processFile(file);
    }
    // Reset so the same file can be re-selected
    input.value = '';
  }

  // ─── Clear / change image ─────────────────────────────────────────────────

  clearRoom(): void {
    this.sessionService.clearRoom();
    this.errorMessage.set(null);
  }

  // ─── Navigation ───────────────────────────────────────────────────────────

  /**
   * Entry point for proceeding to the AI Chat page.
   *
   * Saves local room dimensions and performs client-side navigation.
   *
   * TODO: When the Room Upload endpoint is ready, expand this method to:
   *   async startDesign(): Promise<void> {
   *     await this.roomUploadApiService.upload(
   *       this.sessionService.session().roomFile!,
   *       this.sessionService.session().roomDimensions!
   *     );
   *     this.router.navigate([NAV_ROUTES.AI_CHAT]);
   *   }
   */
  startDesign(): void {
    if (!this.isFormValid()) return;

    this.sessionService.setRoomDimensions(
      this.width()!,
      this.length()!,
      this.height()!
    );

    void this.router.navigate([NAV_ROUTES.AI_CHAT]);
  }

  // ─── Private helpers ──────────────────────────────────────────────────────

  private processFile(file: File): void {
    this.errorMessage.set(null);

    if (!file.type.startsWith('image/')) {
      this.errorMessage.set('AI.ROOM_UPLOAD.ERROR_TYPE');
      return;
    }

    if (file.size > MAX_FILE_SIZE_BYTES) {
      this.errorMessage.set('AI.ROOM_UPLOAD.ERROR_SIZE');
      return;
    }

    this.sessionService.setRoom(file);
  }
}
