import { Component } from '@angular/core';
import { WorkshopProfileForm } from '../../components';

@Component({
  selector: 'app-vendor-workshop-profile',
  standalone: true,
  imports: [WorkshopProfileForm],
  templateUrl: './vendor-workshop-profile.component.html',
  styleUrl: './vendor-workshop-profile.component.css',
})
export class VendorWorkshopProfile {}
