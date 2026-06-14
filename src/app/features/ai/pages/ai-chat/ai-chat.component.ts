import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ChatPanel } from '../../components/chat-panel/chat-panel.component';
import { GeneratedRoom } from '../../components/generated-room/generated-room.component';
import { ProductSidebar } from '../../components/product-sidebar/product-sidebar.component';
import { DesignSummaryModal } from '../../components/design-summary-modal/design-summary-modal.component';
import { InspirationAnalysisModal } from '../../components/inspiration-analysis-modal/inspiration-analysis-modal.component';
import { AiService } from '../../services/ai.service';

@Component({
  selector: 'app-ai-chat',
  standalone: true,
  imports: [
    CommonModule,
    ChatPanel,
    GeneratedRoom,
    ProductSidebar,
    DesignSummaryModal,
    InspirationAnalysisModal
  ],
  templateUrl: './ai-chat.component.html',
  styleUrl: './ai-chat.component.css',
})
export class AiChat {
  protected readonly aiService = inject(AiService);
}
