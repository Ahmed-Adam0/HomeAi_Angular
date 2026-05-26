import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { TranslatePipe } from '../../../../shared/pipes/translate.pipe';

@Component({
  selector: 'app-hero',
  standalone: true,
  imports: [CommonModule, RouterLink, TranslatePipe],
  templateUrl: './hero.component.html',
  styleUrl: './hero.component.css'
})
export class HeroComponent {}
