// =============================================
// 📞 CALLS MODULE
// =============================================

import { Module } from '@nestjs/common';
import { CallsController } from './calls.controller';
import { CallsService } from './calls.service';
import { AiModule } from '@modules/ai/ai.module';
import { NotificationsModule } from '@modules/notifications/notifications.module';

@Module({
  imports: [AiModule, NotificationsModule],
  controllers: [CallsController],
  providers: [CallsService],
  exports: [CallsService],
})
export class CallsModule {}
