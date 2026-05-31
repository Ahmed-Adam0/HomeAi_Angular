import { Component } from '@angular/core';
import { TranslatePipe } from '../../../../shared/pipes/translate.pipe';
import { WorkshopProfileForm } from '../../components';

@Component({
  selector: 'app-vendor-workshop-profile',
  standalone: true,
  imports: [WorkshopProfileForm, TranslatePipe],
  templateUrl: './vendor-workshop-profile.component.html',
  styleUrl: './vendor-workshop-profile.component.css',
})
export class VendorWorkshopProfile {}
