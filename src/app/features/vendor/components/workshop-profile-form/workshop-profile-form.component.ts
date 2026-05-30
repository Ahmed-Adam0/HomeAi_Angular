import { Component } from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';

@Component({
  selector: 'app-workshop-profile-form',
  standalone: true,
  imports: [ReactiveFormsModule],
  templateUrl: './workshop-profile-form.component.html',
  styleUrl: './workshop-profile-form.component.css',
})
export class WorkshopProfileForm {}
