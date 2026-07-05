import { Component, ElementRef, Input, OnInit, AfterViewInit, OnDestroy, ViewChild, PLATFORM_ID, inject, signal, OnChanges, SimpleChanges, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { isPlatformBrowser, NgIf } from '@angular/common';
import { Capacitor, registerPlugin } from '@capacitor/core';
import { formatImageUrl } from '../../../core/utils/api-utils';

const ARLauncher = registerPlugin<any>('ARLauncher');

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
        interaction-prompt="none"
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

      <!-- Redesigned High-Contrast Instructions Controls -->
      <div class="viewer-instructions" *ngIf="!isLoading() && !hasError() && glbUrl">
        <div class="instruction-badge">
          <i class="bi bi-arrows-move"></i>
          <span>Drag</span>
        </div>
        <div class="instruction-separator"></div>
        <div class="instruction-badge">
          <i class="bi bi-zoom-in"></i>
          <span>Zoom</span>
        </div>
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
    /* Dark mode: viewer container background */
    :host-context(html[data-theme="dark"]) .viewer-container {
      background: linear-gradient(180deg, #1c1917 0%, #171412 100%);
      border-color: rgba(255, 255, 255, 0.06);
    }

    model-viewer {
      width: 100%;
      height: 100%;
      display: block;
      outline: none;
      /* Override model-viewer's internal Shadow DOM prompt styling */
      --poster-color: transparent;
    }
    :host-context(html[data-theme="dark"]) model-viewer {
      --poster-color: transparent;
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
    /* Dark mode: loader overlay */
    :host-context(html[data-theme="dark"]) .viewer-loader {
      background: rgba(23, 20, 18, 0.9);
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
    /* Dark mode: loader text */
    :host-context(html[data-theme="dark"]) .loader-text {
      color: rgba(255, 255, 255, 0.7);
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
    /* Dark mode: error box text */
    :host-context(html[data-theme="dark"]) .viewer-error-box {
      color: rgba(255, 255, 255, 0.6);
    }

    .error-icon {
      font-size: 24px;
    }
    .error-text {
      font-size: 13px;
      font-family: var(--fm-font-sans, sans-serif);
      font-weight: 500;
    }
    
    /* ===== Instructions Banner (Drag / Zoom controls) ===== */
    .viewer-instructions {
      position: absolute;
      bottom: 12px;
      left: 50%;
      transform: translateX(-50%);
      pointer-events: none;
      z-index: 10;
      display: flex;
      align-items: center;
      gap: 8px;
      background: rgba(255, 255, 255, 0.85);
      backdrop-filter: blur(8px);
      -webkit-backdrop-filter: blur(8px);
      border: 1px solid rgba(0, 0, 0, 0.08);
      padding: 6px 14px;
      border-radius: 30px;
      box-shadow: 0 2px 10px rgba(0, 0, 0, 0.05);
      transition: all 0.3s ease;
    }
    /* Dark mode: instructions banner */
    :host-context(html[data-theme="dark"]) .viewer-instructions {
      background: rgba(23, 20, 18, 0.9);
      border-color: rgba(255, 255, 255, 0.1);
      box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
    }

    .instruction-badge {
      display: flex;
      align-items: center;
      gap: 6px;
      font-size: 10px;
      font-weight: 600;
      font-family: var(--fm-font-sans, sans-serif);
      text-transform: uppercase;
      letter-spacing: 0.04em;
      color: #1f1c18;
    }
    /* Dark mode: badge text → white for contrast */
    :host-context(html[data-theme="dark"]) .instruction-badge {
      color: rgba(255, 255, 255, 0.92);
    }

    .instruction-badge i {
      color: var(--color-primary, #b8935c);
      font-size: 11px;
    }

    .instruction-separator {
      width: 1px;
      height: 12px;
      background-color: rgba(0, 0, 0, 0.1);
    }
    /* Dark mode: separator */
    :host-context(html[data-theme="dark"]) .instruction-separator {
      background-color: rgba(255, 255, 255, 0.15);
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
      const isAndroid = Capacitor.isNativePlatform() && Capacitor.getPlatform() === 'android';
      if (isAndroid && this.glbUrl) {
        const absoluteUrl = formatImageUrl(this.glbUrl);
        
        // Call native Scene Viewer explicitly
        ARLauncher.launchAR({ glbUrl: absoluteUrl }).catch((err: any) => {
          console.warn('[AR] Scene Viewer failed or is unavailable:', err);
          this.fallbackToModelViewer();
        });
        
        return;
      }

      this.fallbackToModelViewer();
    }
  }

  private fallbackToModelViewer(): void {
    const mv = this.modelViewerRef?.nativeElement;
    if (mv && typeof mv.activateAR === 'function') {
      mv.activateAR();
    } else {
      console.warn('Model viewer element is not loaded or does not support activateAR.');
    }
  }
}
