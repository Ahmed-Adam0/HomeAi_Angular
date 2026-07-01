import { Component, Input, Output, EventEmitter, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ShowcaseSlide } from '../../interfaces/showcase-slide.interface';
import { ShowcaseHotspot } from '../../interfaces/showcase-hotspot.interface';
import { ImageUploadComponent } from '../image-upload/image-upload.component';
import { HotspotEditorComponent } from '../hotspot-editor/hotspot-editor.component';
import { ShowcasePreviewComponent } from '../showcase-preview/showcase-preview.component';
import { TranslationService } from '../../../../shared/i18n/translation.service';
import { AutoDirectionDirective } from '../../../../shared/directives';

@Component({
  selector: 'app-showcase-form',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    ImageUploadComponent,
    HotspotEditorComponent,
    ShowcasePreviewComponent,
    AutoDirectionDirective
  ],
  templateUrl: './showcase-form.component.html',
  styleUrl: './showcase-form.component.css'
})
export class ShowcaseFormComponent implements OnInit {
  private fb = inject(FormBuilder);
  readonly translationService = inject(TranslationService);

  @Input() slide: Partial<ShowcaseSlide> | null = null;
  @Input() productsList: { value: number; label: string }[] = [];
  @Input() isSubmitting = false;

  @Output() submitForm = new EventEmitter<{ formValue: any, imageFile: File | null, hotspots: ShowcaseHotspot[] }>();
  @Output() cancel = new EventEmitter<void>();

  showcaseForm!: FormGroup;
  selectedImageFile: File | null = null;
  selectedImagePreview: string | null = null;
  hotspots: ShowcaseHotspot[] = [];
  imageError = false;

  ngOnInit(): void {
    this.initForm();
  }

  private initForm(): void {
    this.showcaseForm = this.fb.group({
      titleAr: [this.slide?.titleAr || this.slide?.title || '', Validators.required],
      titleEn: [this.slide?.titleEn || this.slide?.title || '', Validators.required],
      subtitleAr: [this.slide?.subtitleAr || this.slide?.subtitle || ''],
      subtitleEn: [this.slide?.subtitleEn || this.slide?.subtitle || ''],
      buttonTextAr: [this.slide?.buttonTextAr || this.slide?.buttonText || ''],
      buttonTextEn: [this.slide?.buttonTextEn || this.slide?.buttonText || ''],
      buttonLink: [this.slide?.buttonLink || '', Validators.required],
      displayOrder: [this.slide?.displayOrder || 1, [Validators.required, Validators.min(1)]],
      isActive: [this.slide?.isActive !== undefined ? this.slide.isActive : true]
    });

    if (this.slide) {
      this.hotspots = this.slide.hotspots ? [...this.slide.hotspots] : [];
    }
  }

  onImageSelected(file: File): void {
    this.selectedImageFile = file;
    this.imageError = false;
    
    const reader = new FileReader();
    reader.onload = (e) => {
      this.selectedImagePreview = e.target?.result as string;
    };
    reader.readAsDataURL(file);
  }

  onHotspotsChanged(updated: ShowcaseHotspot[]): void {
    this.hotspots = updated;
  }

  get previewSlideData(): Partial<ShowcaseSlide> {
    const val = this.showcaseForm?.value || {};
    const isAr = this.translationService.currentLang() === 'ar';
    return {
      title: isAr ? val.titleAr : val.titleEn,
      titleAr: val.titleAr,
      titleEn: val.titleEn,
      subtitle: isAr ? val.subtitleAr : val.subtitleEn,
      subtitleAr: val.subtitleAr,
      subtitleEn: val.subtitleEn,
      buttonText: isAr ? val.buttonTextAr : val.buttonTextEn,
      buttonTextAr: val.buttonTextAr,
      buttonTextEn: val.buttonTextEn,
      buttonLink: val.buttonLink,
      backgroundImageUrl: this.selectedImagePreview || this.slide?.backgroundImageUrl || '',
      hotspots: this.hotspots
    };
  }

  onSubmit(): void {
    if (this.showcaseForm.invalid) {
      this.showcaseForm.markAllAsTouched();
      return;
    }

    const isCreate = !this.slide;
    if (isCreate && !this.selectedImageFile) {
      this.imageError = true;
      return;
    }

    // Validate hotspot coordinates strictly
    const invalidHotspot = this.hotspots.some(h => h.x < 0 || h.x > 100 || h.y < 0 || h.y > 100);
    if (invalidHotspot) {
      return;
    }

    this.submitForm.emit({
      formValue: this.showcaseForm.value,
      imageFile: this.selectedImageFile,
      hotspots: this.hotspots
    });
  }

  onCancel(): void {
    this.cancel.emit();
  }
}
