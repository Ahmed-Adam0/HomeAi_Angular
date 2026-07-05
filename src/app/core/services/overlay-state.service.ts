import { Injectable, signal } from '@angular/core';

export interface OverlayInstance {
  id: string;
  close: () => void;
}

@Injectable({ providedIn: 'root' })
export class OverlayStateService {
  private readonly overlays = signal<OverlayInstance[]>([]);

  registerOverlay(overlay: OverlayInstance): void {
    this.overlays.update(current => {
      if (current.some(o => o.id === overlay.id)) {
        return current.map(o => o.id === overlay.id ? overlay : o);
      }
      return [...current, overlay];
    });
  }

  unregisterOverlay(id: string): void {
    this.overlays.update(current => current.filter(o => o.id !== id));
  }

  hasActiveOverlays(): boolean {
    return this.overlays().length > 0;
  }

  closeTopmostOverlay(): boolean {
    const currentOverlays = this.overlays();
    if (currentOverlays.length > 0) {
      const topOverlay = currentOverlays[currentOverlays.length - 1]; 
      topOverlay.close();
      this.unregisterOverlay(topOverlay.id);
      return true;
    }
    return false;
  }
}
