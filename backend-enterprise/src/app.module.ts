// =============================================
// 🏠 APP MODULE - Root Module
// =============================================
// Central composition root following Clean Architecture
// All dependencies are wired here
// =============================================

import { Module, MiddlewareConsumer, NestModule } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { ThrottlerModule } from '@nestjs/throttler';
import { ScheduleModule } from '@nestjs/schedule';

// Infrastructure
import { PrismaModule } from '@infrastructure/database/prisma.module';
import { CacheModule } from '@infrastructure/cache/cache.module';

// Feature Modules
import { AuthModule } from '@modules/auth/auth.module';
import { UsersModule } from '@modules/users/users.module';
import { CompaniesModule } from '@modules/companies/companies.module';
import { CallsModule } from '@modules/calls/calls.module';
import { WhatsappModule } from '@modules/whatsapp/whatsapp.module';
import { AiModule } from '@modules/ai/ai.module';
import { BillingModule } from '@modules/billing/billing.module';
import { NotificationsModule } from '@modules/notifications/notifications.module';

// Presentation
import { HealthController } from '@presentation/controllers/health.controller';
import { StripeWebhookController } from '@presentation/webhooks/stripe.webhook';
import { TwilioWebhookController } from '@presentation/webhooks/twilio.webhook';
import { WhatsappWebhookController } from '@presentation/webhooks/whatsapp.webhook';

// Common
import { RequestLoggerMiddleware } from '@common/middleware/request-logger.middleware';

// Configuration
import configuration from '@config/configuration';

@Module({
  imports: [
    // =============================================
    // CORE MODULES
    // =============================================
    
    // Configuration
    ConfigModule.forRoot({
      isGlobal: true,
      load: [configuration],
      envFilePath: ['.env.local', '.env'],
    }),

    // Event Emitter for async events
    EventEmitterModule.forRoot({
      wildcard: true,
      delimiter: '.',
      newListener: false,
      removeListener: false,
      maxListeners: 20,
      verboseMemoryLeak: true,
      ignoreErrors: false,
    }),

    // Rate Limiting (System Design Interview - Chapter 4)
    ThrottlerModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        throttlers: [
          {
            name: 'short',
            ttl: 1000,
            limit: 20,
          },
          {
            name: 'medium',
            ttl: 10000,
            limit: 100,
          },
          {
            name: 'long',
            ttl: 60000,
            limit: config.get<number>('THROTTLE_LIMIT', 200),
          },
        ],
      }),
    }),

    // Scheduled Jobs
    ScheduleModule.forRoot(),

    // =============================================
    // INFRASTRUCTURE
    // =============================================
    PrismaModule,
    CacheModule,

    // =============================================
    // FEATURE MODULES
    // =============================================
    AuthModule,
    UsersModule,
    CompaniesModule,
    CallsModule,
    WhatsappModule,
    AiModule,
    BillingModule,
    NotificationsModule,
  ],

  controllers: [
    // Health checks (no auth required)
    HealthController,
    
    // Webhooks (use their own auth)
    StripeWebhookController,
    TwilioWebhookController,
    WhatsappWebhookController,
  ],

  providers: [],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(RequestLoggerMiddleware)
      .forRoutes('*');
  }
}
