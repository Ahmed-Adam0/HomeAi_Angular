import { Component, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { GlobalLoader } from './core/components/global-loader/global-loader.component';
import { QuickViewModalComponent } from './features/products/components/quick-view-modal/quick-view-modal.component';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, GlobalLoader, QuickViewModalComponent],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css'
})
export class App {

  protected readonly title = signal('furniture-ai');
}
