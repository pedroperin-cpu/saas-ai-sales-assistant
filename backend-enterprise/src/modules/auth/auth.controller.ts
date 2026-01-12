// =============================================
// 🔐 AUTH CONTROLLER
// =============================================

import { Controller, Get, Post, Body, Logger } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiResponse } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { Public, CurrentUser, AuthenticatedUser } from '@common/decorators';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  private readonly logger = new Logger(AuthController.name);

  constructor(private readonly authService: AuthService) {}

  @Get('me')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Get current authenticated user' })
  @ApiResponse({ status: 200, description: 'Current user info' })
  @ApiResponse({ status: 401, description: 'Not authenticated' })
  async getCurrentUser(@CurrentUser() user: AuthenticatedUser) {
    return this.authService.getCurrentUser(user.id);
  }

  @Post('webhook/clerk')
  @Public()
  @ApiOperation({ summary: 'Clerk webhook endpoint' })
  async handleClerkWebhook(@Body() body: any) {
    this.logger.log(`Clerk webhook: ${body?.type}`);
    return this.authService.handleClerkWebhook(body);
  }
}
