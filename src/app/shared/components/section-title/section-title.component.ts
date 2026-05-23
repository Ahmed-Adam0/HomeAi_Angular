import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-section-title',
  imports: [],
  templateUrl: './section-title.component.html',
  styleUrl: './section-title.component.css'
})
export class SectionTitleComponent {
  @Input() title = '';
  @Input() subtitle = '';
  @Input() align: 'left' | 'center' | 'right' = 'left';
}
