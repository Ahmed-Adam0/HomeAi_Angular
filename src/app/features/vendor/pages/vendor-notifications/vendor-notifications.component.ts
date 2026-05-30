import { Component } from '@angular/core';
import { NotificationsList } from '../../components';

@Component({
  selector: 'app-vendor-notifications',
  standalone: true,
  imports: [NotificationsList],
  templateUrl: './vendor-notifications.component.html',
  styleUrl: './vendor-notifications.component.css',
})
export class VendorNotifications {}
