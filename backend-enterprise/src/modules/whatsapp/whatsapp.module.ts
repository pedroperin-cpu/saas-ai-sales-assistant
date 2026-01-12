// =============================================
// 💬 WHATSAPP MODULE
// =============================================

import { Module } from '@nestjs/common';
import { WhatsappController } from './whatsapp.controller';
import { WhatsappService } from './whatsapp.service';
import { AiModule } from '@modules/ai/ai.module';
import { NotificationsModule } from '@modules/notifications/notifications.module';

@Module({
  imports: [AiModule, NotificationsModule],
  controllers: [WhatsappController],
  providers: [WhatsappService],
  exports: [WhatsappService],
})
export class WhatsappModule {}
