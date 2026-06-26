import { Component, ElementRef, Input, OnInit, AfterViewInit, OnDestroy, ViewChild, PLATFORM_ID, inject, signal, OnChanges, SimpleChanges, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { isPlatformBrowser, NgIf } from '@angular/common';

@Component({
  selector: 'app-three-d-viewer',
  standalone: true,
  imports: [NgIf],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  template: `
    <div class="viewer-container">
      <model-viewer
        #modelViewer
        *ngIf="glbUrl && !hasError()"
        [attr.src]="glbUrl"
        ar
        ar-modes="webxr scene-viewer quick-look"
        camera-controls
        touch-action="pan-y"
        shadow-intensity="1"
        alt="3D Furniture Model"
        (load)="onModelLoad()"
        (error)="onModelError()">
        <button slot="ar-button" style="display: none;"></button>
        <div slot="poster" class="viewer-loader" *ngIf="isLoading()">
          <div class="loader-spinner"></div>
          <span class="loader-text">Loading 3D Model...</span>
        </div>
      </model-viewer>
      
      <!-- Error State visual fallback -->
      <div class="viewer-error-box" *ngIf="hasError() || !glbUrl">
        <div class="error-icon">⚠️</div>
        <span class="error-text">
          {{ hasError() ? 'Failed to load 3D model' : 'No 3D model source provided' }}
        </span>
      </div>

      <div class="viewer-instructions" *ngIf="!isLoading() && !hasError() && glbUrl">
        <span>Drag to rotate | Scroll to zoom</span>
      </div>
    </div>
  `,
  styles: [`
    .viewer-container {
      position: relative;
      width: 100%;
      height: 250px;
      background: linear-gradient(180deg, #fafaf9 0%, #f5f5f4 100%);
      border-radius: 12px;
      overflow: hidden;
      display: flex;
      align-items: center;
      justify-content: center;
      border: 1px solid rgba(0, 0, 0, 0.05);
    }
    model-viewer {
      width: 100%;
      height: 100%;
      display: block;
      outline: none;
    }
    .viewer-loader {
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(250, 250, 249, 0.9);
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      z-index: 10;
      gap: 12px;
    }
    .loader-spinner {
      width: 36px;
      height: 36px;
      border: 3px solid rgba(184, 147, 92, 0.15);
      border-top-color: #b8935c;
      border-radius: 50%;
      animation: spin 1s infinite linear;
    }
    .loader-text {
      font-size: 13px;
      color: #70675a;
      font-family: var(--fm-font-sans, sans-serif);
      font-weight: 500;
      letter-spacing: 0.02em;
    }
    .viewer-error-box {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: 8px;
      color: #8c8375;
      text-align: center;
      padding: 24px;
    }
    .error-icon {
      font-size: 24px;
    }
    .error-text {
      font-size: 13px;
      font-family: var(--fm-font-sans, sans-serif);
      font-weight: 500;
    }
    .viewer-instructions {
      position: absolute;
      bottom: 8px;
      left: 0;
      width: 100%;
      text-align: center;
      pointer-events: none;
      z-index: 5;
    }
    .viewer-instructions span {
      background: rgba(255, 255, 255, 0.75);
      backdrop-filter: blur(4px);
      border: 1px solid rgba(0, 0, 0, 0.05);
      color: #8c8375;
      font-size: 10px;
      padding: 3px 8px;
      border-radius: 20px;
      font-family: var(--fm-font-sans, sans-serif);
      font-weight: 500;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      opacity: 0.8;
    }
    @keyframes spin {
      0% { transform: rotate(0deg); }
      100% { transform: rotate(360deg); }
    }
  `]
})
export class ThreeDViewerComponent implements OnInit, AfterViewInit, OnDestroy, OnChanges {
  @ViewChild('modelViewer', { static: false }) modelViewerRef!: ElementRef;

  @Input() productType = 'sofa';
  @Input() glbUrl?: string;

  private platformId = inject(PLATFORM_ID);
  
  readonly isLoading = signal<boolean>(true);
  readonly hasError = signal<boolean>(false);

  ngOnInit(): void {}

  ngAfterViewInit(): void {
    if (isPlatformBrowser(this.platformId)) {
      import('@google/model-viewer').catch(err => {
        console.error('Failed to load @google/model-viewer dynamically:', err);
      });
    }
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['glbUrl']) {
      this.isLoading.set(true);
      this.hasError.set(false);
    }
  }

  ngOnDestroy(): void {}

  onModelLoad(): void {
    this.isLoading.set(false);
    this.hasError.set(false);
  }

  onModelError(): void {
    this.isLoading.set(false);
    this.hasError.set(true);
    console.error('Failed to load model-viewer GLB source:', this.glbUrl);
  }

  triggerAR(): void {
    if (isPlatformBrowser(this.platformId)) {
      const mv = this.modelViewerRef?.nativeElement;
      if (mv && typeof mv.activateAR === 'function') {
        mv.activateAR();
      } else {
        console.warn('Model viewer element is not loaded or does not support activateAR.');
      }
    }
  }
}
