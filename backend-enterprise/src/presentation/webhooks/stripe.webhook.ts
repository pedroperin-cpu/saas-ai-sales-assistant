// =============================================
// 💳 STRIPE WEBHOOK CONTROLLER
// =============================================

import {
  Controller,
  Post,
  Headers,
  Body,
  RawBodyRequest,
  Req,
  HttpCode,
  HttpStatus,
  Logger,
  BadRequestException,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiExcludeEndpoint } from '@nestjs/swagger';
import { ConfigService } from '@nestjs/config';
import { Request } from 'express';
import { Public } from '@common/decorators';

@ApiTags('Webhooks')
@Controller('webhooks/stripe')
export class StripeWebhookController {
  private readonly logger = new Logger(StripeWebhookController.name);

  constructor(private readonly configService: ConfigService) {}

  @Post()
  @Public()
  @HttpCode(HttpStatus.OK)
  @ApiExcludeEndpoint()
  async handleWebhook(
    @Headers('stripe-signature') signature: string,
    @Req() req: RawBodyRequest<Request>,
    @Body() body: any,
  ) {
    if (!signature) {
      throw new BadRequestException('Missing stripe-signature header');
    }

    const webhookSecret = this.configService.get<string>('stripe.webhookSecret');

    // In production, verify signature using Stripe SDK
    // For now, log the event
    this.logger.log(`Stripe webhook received: ${body?.type}`);

    try {
      switch (body?.type) {
        case 'customer.subscription.created':
          await this.handleSubscriptionCreated(body.data.object);
          break;

        case 'customer.subscription.updated':
          await this.handleSubscriptionUpdated(body.data.object);
          break;

        case 'customer.subscription.deleted':
          await this.handleSubscriptionDeleted(body.data.object);
          break;

        case 'invoice.paid':
          await this.handleInvoicePaid(body.data.object);
          break;

        case 'invoice.payment_failed':
          await this.handleInvoiceFailed(body.data.object);
          break;

        default:
          this.logger.log(`Unhandled event type: ${body?.type}`);
      }

      return { received: true };
    } catch (error) {
      this.logger.error('Webhook processing failed:', error);
      throw error;
    }
  }

  private async handleSubscriptionCreated(subscription: any) {
    this.logger.log(`Subscription created: ${subscription.id}`);
    // TODO: Update company subscription in database
  }

  private async handleSubscriptionUpdated(subscription: any) {
    this.logger.log(`Subscription updated: ${subscription.id}`);
    // TODO: Update company subscription status
  }

  private async handleSubscriptionDeleted(subscription: any) {
    this.logger.log(`Subscription deleted: ${subscription.id}`);
    // TODO: Handle subscription cancellation
  }

  private async handleInvoicePaid(invoice: any) {
    this.logger.log(`Invoice paid: ${invoice.id}`);
    // TODO: Create invoice record
  }

  private async handleInvoiceFailed(invoice: any) {
    this.logger.log(`Invoice payment failed: ${invoice.id}`);
    // TODO: Handle failed payment
  }
}
