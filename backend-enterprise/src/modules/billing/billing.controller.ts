import { Controller, Get, Post, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { BillingService } from './billing.service';
import { CurrentUser, AuthenticatedUser, Roles, CompanyId } from '@common/decorators';
import { RolesGuard } from '@common/guards/roles.guard';
import { UserRole } from '@prisma/client';
import { CreateCheckoutDto, ChangePlanDto } from './dto/billing.dto';

@ApiTags('Billing')
@ApiBearerAuth('JWT-auth')
@Controller('billing')
export class BillingController {
  constructor(private readonly billingService: BillingService) {}

  @Get('subscription')
  @ApiOperation({ summary: 'Get current subscription' })
  async getSubscription(@CompanyId() companyId: string) {
    return this.billingService.getSubscription(companyId);
  }

  @Get('invoices')
  @ApiOperation({ summary: 'Get invoice history' })
  async getInvoices(@CompanyId() companyId: string) {
    return this.billingService.getInvoices(companyId);
  }

  @Get('plans')
  @ApiOperation({ summary: 'Get available plans' })
  async getPlans() {
    return this.billingService.getPlans();
  }

  @Post('checkout')
  @Roles(UserRole.OWNER, UserRole.ADMIN)
  @UseGuards(RolesGuard)
  @ApiOperation({ summary: 'Create Stripe checkout session' })
  async createCheckout(
    @Body() dto: CreateCheckoutDto,
    @CompanyId() companyId: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.billingService.createCheckoutSession(dto.plan, companyId, user);
  }

  @Post('change-plan')
  @Roles(UserRole.OWNER, UserRole.ADMIN)
  @UseGuards(RolesGuard)
  @ApiOperation({ summary: 'Change subscription plan' })
  async changePlan(
    @Body() dto: ChangePlanDto,
    @CompanyId() companyId: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.billingService.changePlan(dto.plan, companyId, user);
  }

  @Post('cancel')
  @Roles(UserRole.OWNER)
  @UseGuards(RolesGuard)
  @ApiOperation({ summary: 'Cancel subscription' })
  async cancelSubscription(
    @CompanyId() companyId: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.billingService.cancelSubscription(companyId, user);
  }

  @Get('portal')
  @Roles(UserRole.OWNER, UserRole.ADMIN)
  @UseGuards(RolesGuard)
  @ApiOperation({ summary: 'Get Stripe customer portal URL' })
  async getPortalUrl(@CompanyId() companyId: string) {
    return this.billingService.getPortalUrl(companyId);
  }
}
