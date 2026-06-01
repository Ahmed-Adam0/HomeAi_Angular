import { Component, Input, Output, EventEmitter, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IProductImage } from '../../../products/interfaces/iproduct';
import { TranslationService } from '../../../../shared/i18n/translation.service';

interface ILocalPreview {
  file: File;
  previewUrl: string;
}

@Component({
  selector: 'app-image-uploader',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './image-uploader.component.html',
  styleUrl: './image-uploader.component.css'
})
export class ImageUploader {
  @Input() productId: string | number = '';
  @Input() existingImages: IProductImage[] = [];
  @Input() isUploading = false;

  @Output() uploadFiles = new EventEmitter<File[]>();
  @Output() deleteImage = new EventEmitter<number>();
  @Output() setPrimary = new EventEmitter<number>();
  @Output() filesSelected = new EventEmitter<{ files: File[]; primaryIndex: number }>();

  readonly translationService = inject(TranslationService);

  readonly localPreviews = signal<ILocalPreview[]>([]);
  readonly primaryIndex = signal<number>(0);

  private emitSelectedFiles(): void {
    const files = this.localPreviews().map(p => p.file);
    this.filesSelected.emit({ files, primaryIndex: this.primaryIndex() });
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (!input.files || input.files.length === 0) {
      return;
    }

    const filesArray = Array.from(input.files);
    const newPreviews: ILocalPreview[] = [];
    
    let processed = 0;
    filesArray.forEach((file) => {
      const reader = new FileReader();
      reader.onload = (e: any) => {
        newPreviews.push({
          file,
          previewUrl: e.target.result
        });
        processed++;
        if (processed === filesArray.length) {
          this.localPreviews.update(prev => [...prev, ...newPreviews]);
          // Reset input so the same files can be re-selected if removed
          input.value = '';
          this.emitSelectedFiles();
        }
      };
      reader.readAsDataURL(file);
    });
  }

  removeLocalPreview(index: number, event: MouseEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.localPreviews.update(prev => {
      const updated = prev.filter((_, i) => i !== index);
      // Adjust primaryIndex if needed
      let currentPrimary = this.primaryIndex();
      if (currentPrimary === index) {
        this.primaryIndex.set(0);
      } else if (currentPrimary > index) {
        this.primaryIndex.set(currentPrimary - 1);
      }
      return updated;
    });
    this.emitSelectedFiles();
  }

  onSetPrimaryLocal(index: number, event: MouseEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.primaryIndex.set(index);
    this.emitSelectedFiles();
  }

  onUploadClick(event: MouseEvent): void {
    event.preventDefault();
    event.stopPropagation();
    const filesToUpload = this.localPreviews().map(p => p.file);
    if (filesToUpload.length > 0) {
      this.uploadFiles.emit(filesToUpload);
    }
  }

  clearLocalPreviews(): void {
    this.localPreviews.set([]);
  }

  onDeleteUploaded(imageId: number, event: MouseEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.deleteImage.emit(imageId);
  }

  onSetPrimaryUploaded(imageId: number, event: MouseEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.setPrimary.emit(imageId);
  }
}
