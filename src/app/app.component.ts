import { Component, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { GlobalLoader } from './core/components/global-loader/global-loader.component';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, GlobalLoader],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css'
})
export class App {

  protected readonly title = signal('furniture-ai');
}
