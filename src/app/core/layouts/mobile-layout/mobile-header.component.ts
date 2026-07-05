import { Component, inject, Input, Output, EventEmitter } from '@angular/core';
import { RouteTitleService } from '../../services/route-title.service';
import { MobileNavigationService } from '../../services/mobile-navigation.service';
import { NgIf } from '@angular/common';

@Component({
  selector: 'app-mobile-header',
  standalone: true,
  imports: [NgIf],
  template: `
    <header class="mobile-header" role="banner">
      <div class="header-content">
        <button 
          *ngIf="mobileNav.stackSize > 1" 
          class="icon-button" 
          (click)="mobileNav.handleHardwareBack()"
          aria-label="Go Back">
          <i class="pi pi-arrow-left"></i>
        </button>

        <button 
          *ngIf="mobileNav.stackSize <= 1 && showMenuIcon" 
          class="icon-button" 
          (click)="menuClick.emit()"
          aria-label="Open Menu">
          <i class="pi pi-bars"></i>
        </button>

        <div class="spacer" *ngIf="mobileNav.stackSize <= 1 && !showMenuIcon"></div>
        
        <h1 class="page-title">{{ routeTitle.currentTitle() }}</h1>
        <div class="spacer"></div>
      </div>
    </header>
  `,
  styles: [`
    .mobile-header {
      background-color: var(--surface-card, #ffffff);
      padding-top: env(safe-area-inset-top, 0px);
      border-bottom: 1px solid var(--surface-border, #e5e7eb);
      position: sticky;
      top: 0;
      z-index: 1000;
      box-shadow: 0 1px 3px rgba(0,0,0,0.02);
    }
    .header-content {
      display: flex;
      align-items: center;
      justify-content: space-between;
      height: 56px; /* MD3 compact height */
      padding: 0 4px; /* Reduced to allow 48px touch targets without pushing too far */
    }
    .icon-button {
      background: transparent;
      border: none;
      color: var(--text-color, #1C1B1F);
      width: 48px;
      height: 48px;
      border-radius: 50%;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      position: relative;
      overflow: hidden;
      -webkit-tap-highlight-color: transparent;
      transition: background-color 0.2s ease;
      flex-shrink: 0;
    }
    .icon-button:active {
      background-color: rgba(0, 0, 0, 0.08);
    }
    .icon-button i {
      font-size: 1.25rem;
    }
    .spacer {
      width: 48px;
      flex-shrink: 0;
    }
    .page-title {
      font-family: 'Roboto', 'Inter', sans-serif;
      font-size: 1.25rem; /* MD3 Title Large */
      font-weight: 500;
      letter-spacing: 0px;
      color: var(--text-color, #1C1B1F);
      margin: 0;
      text-align: center;
      flex: 1;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
      padding: 0 8px;
    }
  `]
})
export class MobileHeaderComponent {
  @Input() showMenuIcon: boolean = false;
  @Output() menuClick = new EventEmitter<void>();

  readonly routeTitle = inject(RouteTitleService);
  readonly mobileNav = inject(MobileNavigationService);
}
