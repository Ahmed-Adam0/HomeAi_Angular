import { Component, inject, Input, Output, EventEmitter, ViewChild, ElementRef, AfterViewInit, OnInit, OnDestroy } from '@angular/core';
import { MobileHeaderComponent } from './mobile-header.component';
import { MobileBottomNavigationComponent } from './mobile-bottom-navigation.component';
import { MobileNavigationService } from '../../services/mobile-navigation.service';
import { MobileScrollService } from '../../services/mobile-scroll.service';
import { NgIf } from '@angular/common';

@Component({
  selector: 'app-mobile-layout',
  standalone: true,
  imports: [MobileHeaderComponent, MobileBottomNavigationComponent, NgIf],
  template: `
    <div class="mobile-layout-container" role="application">
      <app-mobile-header 
        [showMenuIcon]="showMenuIcon" 
        (menuClick)="menuClick.emit()">
      </app-mobile-header>
      
      <main class="mobile-content-area" #scrollContainer role="main" aria-label="Main content">
        <ng-content></ng-content>
      </main>

      <app-mobile-bottom-navigation *ngIf="showBottomNav"></app-mobile-bottom-navigation>
    </div>
  `,
  styles: [`
    .mobile-layout-container {
      display: flex;
      flex-direction: column;
      height: 100vh;
      height: 100dvh;
      background-color: var(--surface-ground, #f9fafb);
    }
    .mobile-content-area {
      flex: 1;
      overflow-y: auto;
      padding-bottom: calc(60px + var(--safe-area-bottom)); 
      -webkit-overflow-scrolling: touch;
    }
  `]
})
export class MobileLayoutComponent implements OnInit, OnDestroy, AfterViewInit {
  @Input() showBottomNav: boolean = true;
  @Input() showMenuIcon: boolean = false;
  @Output() menuClick = new EventEmitter<void>();

  @ViewChild('scrollContainer') scrollContainer!: ElementRef<HTMLElement>;

  private readonly mobileNav = inject(MobileNavigationService);
  private readonly mobileScroll = inject(MobileScrollService);

  constructor() {
    console.log('[Diagnostic] MobileLayoutComponent constructor executed.');
  }

  ngOnInit() {
    console.log('[Diagnostic] MobileLayoutComponent ngOnInit executed.');
    if (typeof document !== 'undefined') {
      document.body.classList.add('mobile-shell-active');
    }
  }

  ngAfterViewInit() {
    console.log('[Diagnostic] MobileLayoutComponent ngAfterViewInit executed.');
    if (this.scrollContainer) {
      this.mobileScroll.registerScrollContainer(this.scrollContainer);
    }
  }

  ngOnDestroy() {
    if (typeof document !== 'undefined') {
      document.body.classList.remove('mobile-shell-active');
    }
  }
}
