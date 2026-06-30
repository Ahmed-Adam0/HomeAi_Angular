import { Component, Input, Output, EventEmitter, inject, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ShowcaseHotspot } from '../../interfaces/showcase-hotspot.interface';
import { HotspotItemComponent } from '../hotspot-item/hotspot-item.component';
import { TranslationService } from '../../../../shared/i18n/translation.service';

@Component({
  selector: 'app-hotspot-editor',
  standalone: true,
  imports: [CommonModule, HotspotItemComponent],
  templateUrl: './hotspot-editor.component.html',
  styleUrl: './hotspot-editor.component.css'
})
export class HotspotEditorComponent {
  readonly translationService = inject(TranslationService);

  @Input() imageUrl: string | null = null;
  @Input() hotspots: ShowcaseHotspot[] = [];
  @Input() productsList: { value: number; label: string }[] = [];

  @Output() hotspotsChange = new EventEmitter<ShowcaseHotspot[]>();

  @ViewChild('editorContainer') editorContainerEl?: ElementRef<HTMLElement>;

  onContainerClick(event: MouseEvent): void {
    // Avoid double creation when clicking hotspot markers
    const target = event.target as HTMLElement;
    if (target.closest('.hotspot-marker')) {
      return;
    }

    const container = this.editorContainerEl?.nativeElement;
    if (!container) return;

    const rect = container.getBoundingClientRect();
    const x = parseFloat((((event.clientX - rect.left) / rect.width) * 100).toFixed(1));
    const y = parseFloat((((event.clientY - rect.top) / rect.height) * 100).toFixed(1));

    if (x >= 0 && x <= 100 && y >= 0 && y <= 100) {
      this.addHotspot(x, y);
    }
  }

  addHotspot(x: number, y: number): void {
    const newHotspot: ShowcaseHotspot = {
      id: 0,
      x,
      y,
      displayOrder: this.hotspots.length + 1,
      isActive: true
    };
    const updated = [...this.hotspots, newHotspot];
    this.hotspotsChange.emit(updated);
  }

  onDragStart(event: MouseEvent, index: number): void {
    event.stopPropagation();
    event.preventDefault();

    const container = this.editorContainerEl?.nativeElement;
    if (!container) return;

    const onMouseMove = (moveEvent: MouseEvent) => {
      const rect = container.getBoundingClientRect();
      let x = parseFloat((((moveEvent.clientX - rect.left) / rect.width) * 100).toFixed(1));
      let y = parseFloat((((moveEvent.clientY - rect.top) / rect.height) * 100).toFixed(1));

      // Clamp coordinates
      x = Math.max(0, Math.min(100, x));
      y = Math.max(0, Math.min(100, y));

      const updated = [...this.hotspots];
      updated[index] = {
        ...updated[index],
        x,
        y
      };
      this.hotspotsChange.emit(updated);
    };

    const onMouseUp = () => {
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
    };

    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
  }

  updateHotspot(index: number, changes: Partial<ShowcaseHotspot>): void {
    const updated = [...this.hotspots];
    updated[index] = {
      ...updated[index],
      ...changes
    };
    this.hotspotsChange.emit(updated);
  }

  deleteHotspot(index: number): void {
    const updated = this.hotspots.filter((_, i) => i !== index);
    // Auto reorder remaining hotspots
    const reordered = updated.map((h, i) => ({
      ...h,
      displayOrder: i + 1
    }));
    this.hotspotsChange.emit(reordered);
  }
}
