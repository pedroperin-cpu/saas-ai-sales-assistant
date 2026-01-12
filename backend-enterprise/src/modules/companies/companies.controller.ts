// =============================================
// 🏢 COMPANIES CONTROLLER
// =============================================

import { Controller, Get, Put, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { CompaniesService } from './companies.service';
import { CurrentUser, AuthenticatedUser, Roles, CompanyId } from '@common/decorators';
import { RolesGuard } from '@common/guards/roles.guard';
import { UserRole } from '@prisma/client';
import { UpdateCompanyDto } from './dto/company.dto';

@ApiTags('Companies')
@ApiBearerAuth('JWT-auth')
@Controller('companies')
export class CompaniesController {
  constructor(private readonly companiesService: CompaniesService) {}

  @Get('current')
  @ApiOperation({ summary: 'Get current company details' })
  async getCurrentCompany(@CompanyId() companyId: string) {
    return this.companiesService.findById(companyId);
  }

  @Get('current/stats')
  @ApiOperation({ summary: 'Get company statistics' })
  async getStats(@CompanyId() companyId: string) {
    return this.companiesService.getStats(companyId);
  }

  @Get('current/usage')
  @ApiOperation({ summary: 'Get company usage limits' })
  async getUsage(@CompanyId() companyId: string) {
    return this.companiesService.getUsage(companyId);
  }

  @Put('current')
  @Roles(UserRole.OWNER, UserRole.ADMIN)
  @UseGuards(RolesGuard)
  @ApiOperation({ summary: 'Update company details' })
  async update(
    @CompanyId() companyId: string,
    @Body() dto: UpdateCompanyDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.companiesService.update(companyId, dto, user);
  }
}
