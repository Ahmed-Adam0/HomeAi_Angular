import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IInspiration } from '../../interfaces/inspiration.interface';
import { TranslatePipe } from '../../../../shared/pipes/translate.pipe';
import { BeforeAfterSliderComponent } from '../../../../shared/components/before-after-slider/before-after-slider.component';

@Component({
  selector: 'app-inspiration-card',
  standalone: true,
  imports: [CommonModule, TranslatePipe, BeforeAfterSliderComponent],
  templateUrl: './inspiration-card.component.html',
  styleUrl: './inspiration-card.component.css'
})
export class InspirationCardComponent {
  @Input({ required: true }) item!: IInspiration;
}
