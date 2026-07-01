import { Injectable, signal, computed } from '@angular/core';

/**
 * Represents the current AI Design Session.
 *
 * roomFile            — The raw File selected by the user (frontend-only for now)
 * roomPreviewUrl      — Blob URL created from the file for instant preview
 *
 * The following fields are reserved for future backend integration:
 * conversationId      — Links the session to a Chat conversation thread
 * requestId           — Unique ID for the room generation request
 * roomId              — Assigned by the backend after the room image is uploaded
 * uploadedImageUrl    — CDN URL of the original room image stored by the backend
 * generatedImageUrl   — CDN URL of the AI-generated result image
 * status              — Lifecycle state of the session
 */
export interface RoomDesignSession {
  roomFile: File | null;
  roomPreviewUrl: string | null;

  // Reserved for future backend integration
  // TODO: Replace local room state with the future Room Upload endpoint.
  // These fields will be populated by the backend once the API is available.
  conversationId?: string;
  requestId?: string;
  roomId?: string;
  uploadedImageUrl?: string;
  generatedImageUrl?: string;
  status?: 'idle' | 'uploading' | 'processing' | 'completed' | 'failed';

  roomDimensions?: {
    width: number;
    length: number;
    height: number;
  };
}

// TODO:
// Replace local room state with the future Room Upload endpoint.
// roomId and uploadedImageUrl will be populated by the backend.
// Swap the body of setRoom() to call the upload API, then set the server-returned URLs.

@Injectable({
  providedIn: 'root',
})
export class RoomDesignSessionService {
  /** Internal mutable signal holding the full session state. */
  private readonly _session = signal<RoomDesignSession>({
    roomFile: null,
    roomPreviewUrl: null,
  });

  /** Public read-only view of the session state. */
  readonly session = this._session.asReadonly();

  /** Convenience computed: true when a room image has been selected. */
  readonly hasRoom = computed(() => this._session().roomFile !== null);

  /** Convenience computed: the preview URL for template binding. */
  readonly previewUrl = computed(() => this._session().roomPreviewUrl);

  /**
   * Store the selected room image in session state.
   *
   * Creates a Blob URL for instant preview without any network call.
   *
   * @param file - The image File selected by the user.
   *
   * TODO: When the Room Upload endpoint is ready, replace with:
   *   async setRoom(file: File): Promise<void> {
   *     const response = await uploadRoomApi(file);
   *     this._session.update(s => ({
   *       ...s,
   *       roomFile: file,
   *       roomPreviewUrl: URL.createObjectURL(file),
   *       roomId: response.roomId,
   *       uploadedImageUrl: response.imageUrl,
   *     }));
   *   }
   */
  setRoom(file: File): void {
    // Revoke any previous Blob URL to prevent memory leaks.
    this.revokeCurrentPreviewUrl();

    const previewUrl = URL.createObjectURL(file);

    this._session.update(current => ({
      ...current,
      roomFile: file,
      roomPreviewUrl: previewUrl,
    }));
  }

  /**
   * Store room dimensions in session state.
   *
   * TODO: These values will be included in the future Room Generation API call.
   */
  setRoomDimensions(width: number, length: number, height: number): void {
    this._session.update(current => ({
      ...current,
      roomDimensions: { width, length, height },
    }));
  }

  /**
   * Clear the current room image and all preview state.
   * Revokes the Blob URL to release memory.
   */
  clearRoom(): void {
    this.revokeCurrentPreviewUrl();
    this._session.update(current => ({
      ...current,
      roomFile: null,
      roomPreviewUrl: null,
      roomDimensions: undefined,
    }));
  }

  /** Mark session as uploading */
  setStatusUploading(): void {
    this._session.update(current => ({
      ...current,
      status: 'uploading',
    }));
  }

  /** Set upload result after successful API call */
  setUploadResult(roomId: string, uploadedImageUrl: string): void {
    this._session.update(current => ({
      ...current,
      roomId,
      uploadedImageUrl,
      status: 'completed',
    }));
  }

  /** Set generated image URL from AI backend */
  setGeneratedImageUrl(url: string): void {
    this._session.update(current => ({
      ...current,
      generatedImageUrl: url
    }));
  }

  /**
   * Full session reset — clears all fields including reserved backend fields.
   * Call this when starting a completely new session.
   */
  resetSession(): void {
    this.revokeCurrentPreviewUrl();
    this._session.set({
      roomFile: null,
      roomPreviewUrl: null,
      conversationId: undefined,
      requestId: undefined,
      roomId: undefined,
      uploadedImageUrl: undefined,
      generatedImageUrl: undefined,
      status: undefined,
      roomDimensions: undefined,
    });
  }

  // ─── Private helpers ────────────────────────────────────────────────────────

  private revokeCurrentPreviewUrl(): void {
    const current = this._session().roomPreviewUrl;
    if (current) {
      URL.revokeObjectURL(current);
    }
  }
}
