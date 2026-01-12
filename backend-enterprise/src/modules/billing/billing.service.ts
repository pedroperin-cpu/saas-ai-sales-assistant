// =============================================
// 💳 BILLING SERVICE
// =============================================
// Stripe integration for subscriptions
// =============================================

import { Injectable, NotFoundException, BadRequestException, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '@infrastructure/database/prisma.service';
import { AuthenticatedUser } from '@common/decorators';
import { Plan, SubscriptionStatus, AuditAction } from '@prisma/client';

interface PlanDetails {
  name: string;
  plan: Plan;
  price: number;
  currency: string;
  features: string[];
  limits: {
    users: number;
    callsPerMonth: number;
    chatsPerMonth: number;
  };
}

@Injectable()
export class BillingService {
  private readonly logger = new Logger(BillingService.name);
  private readonly stripeSecretKey: string;
  private readonly stripePrices: Record<Plan, string>;

  constructor(
    private readonly configService: ConfigService,
    private readonly prisma: PrismaService,
  ) {
    this.stripeSecretKey = this.configService.get<string>('stripe.secretKey') || '';
    this.stripePrices = {
      [Plan.STARTER]: this.configService.get<string>('stripe.prices.starter') || '',
      [Plan.PROFESSIONAL]: this.configService.get<string>('stripe.prices.professional') || '',
      [Plan.ENTERPRISE]: this.configService.get<string>('stripe.prices.enterprise') || '',
    };
  }

  // =============================================
  // GET AVAILABLE PLANS
  // =============================================
  getPlans(): PlanDetails[] {
    return [
      {
        name: 'Starter',
        plan: Plan.STARTER,
        price: 149,
        currency: 'BRL',
        features: [
          'Até 5 usuários',
          '100 ligações/mês',
          '50 chats WhatsApp/mês',
          'Sugestões de IA básicas',
          'Relatórios básicos',
          'Suporte por email',
        ],
        limits: { users: 5, callsPerMonth: 100, chatsPerMonth: 50 },
      },
      {
        name: 'Professional',
        plan: Plan.PROFESSIONAL,
        price: 299,
        currency: 'BRL',
        features: [
          'Até 20 usuários',
          '500 ligações/mês',
          '200 chats WhatsApp/mês',
          'Sugestões de IA avançadas',
          'Relatórios completos',
          'Integrações com CRM',
          'Suporte prioritário',
        ],
        limits: { users: 20, callsPerMonth: 500, chatsPerMonth: 200 },
      },
      {
        name: 'Enterprise',
        plan: Plan.ENTERPRISE,
        price: 499,
        currency: 'BRL',
        features: [
          'Usuários ilimitados',
          'Ligações ilimitadas',
          'Chats WhatsApp ilimitados',
          'IA personalizada',
          'API completa',
          'White-label',
          'Gerente de conta dedicado',
          'Suporte 24/7',
        ],
        limits: { users: 1000, callsPerMonth: 10000, chatsPerMonth: 5000 },
      },
    ];
  }

  // =============================================
  // GET SUBSCRIPTION
  // =============================================
  async getSubscription(companyId: string) {
    const subscription = await this.prisma.subscription.findFirst({
      where: { companyId, status: { in: [SubscriptionStatus.ACTIVE, SubscriptionStatus.TRIALING] } },
      include: {
        company: { select: { id: true, name: true, plan: true } },
      },
    });

    const company = await this.prisma.company.findUnique({
      where: { id: companyId },
      select: { plan: true, maxUsers: true, maxCallsPerMonth: true, maxChatsPerMonth: true },
    });

    const plans = this.getPlans();
    const currentPlan = plans.find((p) => p.plan === company?.plan);

    return {
      subscription,
      plan: currentPlan,
      company: {
        plan: company?.plan,
        limits: {
          users: company?.maxUsers,
          callsPerMonth: company?.maxCallsPerMonth,
          chatsPerMonth: company?.maxChatsPerMonth,
        },
      },
    };
  }

  // =============================================
  // GET INVOICES
  // =============================================
  async getInvoices(companyId: string) {
    return this.prisma.invoice.findMany({
      where: { companyId },
      orderBy: { createdAt: 'desc' },
      take: 24, // Last 2 years
    });
  }

  // =============================================
  // CREATE CHECKOUT SESSION
  // =============================================
  async createCheckoutSession(plan: Plan, companyId: string, user: AuthenticatedUser) {
    const company = await this.prisma.company.findUnique({ where: { id: companyId } });
    if (!company) throw new NotFoundException('Company not found');

    const priceId = this.stripePrices[plan];
    if (!priceId) throw new BadRequestException('Invalid plan');

    // In production, create Stripe checkout session
    if (this.stripeSecretKey && !this.stripeSecretKey.startsWith('sk_test_xxx')) {
      try {
        // const stripe = new Stripe(this.stripeSecretKey);
        // const session = await stripe.checkout.sessions.create({...});
        // return { url: session.url };
      } catch (error) {
        this.logger.error('Stripe checkout failed:', error);
        throw new BadRequestException('Payment provider error');
      }
    }

    // Development mode - mock response
    this.logger.warn('Stripe not configured, returning mock checkout URL');
    return {
      url: `http://localhost:3000/checkout/mock?plan=${plan}&company=${companyId}`,
      message: 'Development mode - Stripe not configured',
    };
  }

  // =============================================
  // CHANGE PLAN
  // =============================================
  async changePlan(newPlan: Plan, companyId: string, user: AuthenticatedUser) {
    const company = await this.prisma.company.findUnique({ where: { id: companyId } });
    if (!company) throw new NotFoundException('Company not found');

    const oldPlan = company.plan;
    if (oldPlan === newPlan) {
      throw new BadRequestException('Already on this plan');
    }

    const plans = this.getPlans();
    const planDetails = plans.find((p) => p.plan === newPlan);
    if (!planDetails) throw new BadRequestException('Invalid plan');

    // Update company plan and limits
    await this.prisma.company.update({
      where: { id: companyId },
      data: {
        plan: newPlan,
        maxUsers: planDetails.limits.users,
        maxCallsPerMonth: planDetails.limits.callsPerMonth,
        maxChatsPerMonth: planDetails.limits.chatsPerMonth,
      },
    });

    // Create audit log
    await this.prisma.auditLog.create({
      data: {
        companyId,
        userId: user.id,
        action: AuditAction.UPDATE,
        resource: 'subscription',
        resourceId: companyId,
        description: `Plan changed from ${oldPlan} to ${newPlan}`,
        oldValues: { plan: oldPlan },
        newValues: { plan: newPlan },
      },
    });

    this.logger.log(`Company ${companyId} changed plan from ${oldPlan} to ${newPlan}`);

    return {
      success: true,
      message: `Plan changed to ${newPlan}`,
      plan: planDetails,
    };
  }

  // =============================================
  // CANCEL SUBSCRIPTION
  // =============================================
  async cancelSubscription(companyId: string, user: AuthenticatedUser) {
    const subscription = await this.prisma.subscription.findFirst({
      where: { companyId, status: SubscriptionStatus.ACTIVE },
    });

    if (!subscription) {
      throw new NotFoundException('No active subscription found');
    }

    // Update subscription
    await this.prisma.subscription.update({
      where: { id: subscription.id },
      data: {
        cancelAtPeriodEnd: true,
        canceledAt: new Date(),
      },
    });

    // Create audit log
    await this.prisma.auditLog.create({
      data: {
        companyId,
        userId: user.id,
        action: AuditAction.UPDATE,
        resource: 'subscription',
        resourceId: subscription.id,
        description: 'Subscription cancelled',
      },
    });

    this.logger.log(`Subscription cancelled for company ${companyId}`);

    return {
      success: true,
      message: 'Subscription will be cancelled at the end of the billing period',
      cancelAtPeriodEnd: true,
      currentPeriodEnd: subscription.currentPeriodEnd,
    };
  }

  // =============================================
  // GET CUSTOMER PORTAL URL
  // =============================================
  async getPortalUrl(companyId: string) {
    const company = await this.prisma.company.findUnique({ where: { id: companyId } });
    if (!company) throw new NotFoundException('Company not found');

    if (!company.stripeCustomerId) {
      throw new BadRequestException('No Stripe customer ID found');
    }

    // In production, create Stripe portal session
    if (this.stripeSecretKey && !this.stripeSecretKey.startsWith('sk_test_xxx')) {
      try {
        // const stripe = new Stripe(this.stripeSecretKey);
        // const session = await stripe.billingPortal.sessions.create({...});
        // return { url: session.url };
      } catch (error) {
        this.logger.error('Stripe portal failed:', error);
        throw new BadRequestException('Payment provider error');
      }
    }

    // Development mode
    return {
      url: 'https://billing.stripe.com/p/login/test',
      message: 'Development mode - Stripe not configured',
    };
  }

  // =============================================
  // HANDLE WEBHOOK EVENTS
  // =============================================
  async handleSubscriptionCreated(stripeSubscription: any) {
    const companyId = stripeSubscription.metadata?.companyId;
    if (!companyId) {
      this.logger.warn('No companyId in subscription metadata');
      return;
    }

    await this.prisma.subscription.create({
      data: {
        companyId,
        stripeSubscriptionId: stripeSubscription.id,
        stripePriceId: stripeSubscription.items.data[0]?.price.id,
        stripeCustomerId: stripeSubscription.customer,
        plan: this.mapStripePriceToPlan(stripeSubscription.items.data[0]?.price.id),
        status: this.mapStripeStatus(stripeSubscription.status),
        currentPeriodStart: new Date(stripeSubscription.current_period_start * 1000),
        currentPeriodEnd: new Date(stripeSubscription.current_period_end * 1000),
      },
    });

    this.logger.log(`Subscription created for company ${companyId}`);
  }

  async handleSubscriptionUpdated(stripeSubscription: any) {
    const subscription = await this.prisma.subscription.findUnique({
      where: { stripeSubscriptionId: stripeSubscription.id },
    });

    if (!subscription) {
      this.logger.warn(`Subscription not found: ${stripeSubscription.id}`);
      return;
    }

    await this.prisma.subscription.update({
      where: { id: subscription.id },
      data: {
        status: this.mapStripeStatus(stripeSubscription.status),
        currentPeriodStart: new Date(stripeSubscription.current_period_start * 1000),
        currentPeriodEnd: new Date(stripeSubscription.current_period_end * 1000),
        cancelAtPeriodEnd: stripeSubscription.cancel_at_period_end,
        canceledAt: stripeSubscription.canceled_at
          ? new Date(stripeSubscription.canceled_at * 1000)
          : null,
      },
    });

    this.logger.log(`Subscription updated: ${subscription.id}`);
  }

  private mapStripePriceToPlan(priceId: string): Plan {
    if (priceId === this.stripePrices[Plan.ENTERPRISE]) return Plan.ENTERPRISE;
    if (priceId === this.stripePrices[Plan.PROFESSIONAL]) return Plan.PROFESSIONAL;
    return Plan.STARTER;
  }

  private mapStripeStatus(stripeStatus: string): SubscriptionStatus {
    const mapping: Record<string, SubscriptionStatus> = {
      active: SubscriptionStatus.ACTIVE,
      past_due: SubscriptionStatus.PAST_DUE,
      canceled: SubscriptionStatus.CANCELED,
      unpaid: SubscriptionStatus.UNPAID,
      trialing: SubscriptionStatus.TRIALING,
      incomplete: SubscriptionStatus.INCOMPLETE,
    };
    return mapping[stripeStatus] || SubscriptionStatus.INCOMPLETE;
  }
}
