import { Component, inject } from '@angular/core';
import { DeliveryCelebrationService } from '../../services/delivery-celebration.service';
import { ModalComponent } from '../../../shared/components/modal/modal.component';
import { TranslatePipe } from '../../../shared/pipes/translate.pipe';

@Component({
  selector: 'app-delivery-success-modal',
  standalone: true,
  imports: [ModalComponent, TranslatePipe],
  templateUrl: './delivery-success-modal.component.html',
  styleUrl: './delivery-success-modal.component.css',
})
export class DeliverySuccessModalComponent {
  readonly service = inject(DeliveryCelebrationService);
}
