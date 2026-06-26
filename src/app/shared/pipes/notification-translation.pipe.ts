import { inject, Pipe, PipeTransform } from '@angular/core';
import { TranslationService } from '../i18n/translation.service';

@Pipe({
  name: 'notificationMessage',
  pure: false,
  standalone: true
})
export class NotificationMessagePipe implements PipeTransform {
  private translationService = inject(TranslationService);

  transform(message: string | null | undefined, title: string): string {
    if (!message) return '';

    if (message.includes('|')) {
      const parts = message.split('|');
      if (parts.length >= 3) {
        const status = parts[0];
        const amount = parts[1];
        const orderId = parts[2];

        // Map status
        const statusKey = `MILESTONE_STATUS_${status.toUpperCase()}`;
        let statusTrans = this.translationService.translate(statusKey);
        if (statusTrans === statusKey) {
          statusTrans = status;
        }

        // Determine template based on title or content
        const isPaid = title.toLowerCase().includes('paid') || title.toLowerCase().includes('سداد');
        const templateKey = isPaid 
          ? 'NOTIFICATION_MESSAGE_MilestonePaid' 
          : 'NOTIFICATION_MESSAGE_MilestoneCreated';

        let template = this.translationService.translate(templateKey);
        if (template === templateKey) {
          // Fallback if keys are not loaded yet
          return isPaid
            ? `The payment milestone ${statusTrans} for your order #${orderId} with amount EGP ${amount} has been successfully paid.`
            : `A new payment milestone ${statusTrans} has been created for your order #${orderId} with amount EGP ${amount}.`;
        }

        return template
          .replace('{{status}}', statusTrans)
          .replace('{{amount}}', amount)
          .replace('{{orderId}}', orderId);
      }
    }

    return message;
  }
}

@Pipe({
  name: 'notificationTitle',
  pure: false,
  standalone: true
})
export class NotificationTitlePipe implements PipeTransform {
  private translationService = inject(TranslationService);

  transform(title: string | null | undefined): string {
    if (!title) return '';
    const cleanTitle = title.trim();
    if (cleanTitle === 'MilestoneCreated') {
      return this.translationService.translate('NOTIFICATION_TITLE_MilestoneCreated');
    }
    if (cleanTitle === 'MilestonePaid') {
      return this.translationService.translate('NOTIFICATION_TITLE_MilestonePaid');
    }
    return title;
  }
}
