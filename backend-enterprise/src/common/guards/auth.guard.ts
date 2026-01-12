// =============================================
// 🔐 AUTH GUARD
// =============================================
// JWT/Clerk authentication guard
// =============================================

import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
  Logger,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ConfigService } from '@nestjs/config';
import { IS_PUBLIC_KEY, AuthenticatedUser } from '@common/decorators';
import { PrismaService } from '@infrastructure/database/prisma.service';
import { CacheService } from '@infrastructure/cache/cache.service';

@Injectable()
export class AuthGuard implements CanActivate {
  private readonly logger = new Logger(AuthGuard.name);

  constructor(
    private reflector: Reflector,
    private configService: ConfigService,
    private prisma: PrismaService,
    private cache: CacheService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    // Check if route is public
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (isPublic) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const token = this.extractTokenFromHeader(request);

    if (!token) {
      throw new UnauthorizedException('Missing authentication token');
    }

    try {
      // Verify token with Clerk
      const clerkUser = await this.verifyClerkToken(token);
      
      if (!clerkUser) {
        throw new UnauthorizedException('Invalid token');
      }

      // Get user from database (with caching)
      const user = await this.getUserByClerkId(clerkUser.sub);

      if (!user) {
        throw new UnauthorizedException('User not found');
      }

      if (!user.isActive) {
        throw new UnauthorizedException('User account is inactive');
      }

      // Attach user to request
      request.user = {
        id: user.id,
        clerkId: user.clerkId,
        email: user.email,
        name: user.name,
        role: user.role,
        companyId: user.companyId,
        permissions: user.permissions,
      } as AuthenticatedUser;

      return true;
    } catch (error) {
      if (error instanceof UnauthorizedException) {
        throw error;
      }
      this.logger.error('Auth error:', error);
      throw new UnauthorizedException('Authentication failed');
    }
  }

  private extractTokenFromHeader(request: any): string | undefined {
    const [type, token] = request.headers.authorization?.split(' ') ?? [];
    return type === 'Bearer' ? token : undefined;
  }

  private async verifyClerkToken(token: string): Promise<{ sub: string } | null> {
    // In production, use Clerk SDK to verify token
    // For development, we'll decode the JWT payload
    
    const clerkSecretKey = this.configService.get<string>('clerk.secretKey');
    
    if (!clerkSecretKey || clerkSecretKey.startsWith('sk_test_xxx')) {
      // Development mode - parse JWT without verification
      this.logger.warn('⚠️ Development mode: JWT not verified');
      
      try {
        const parts = token.split('.');
        if (parts.length !== 3) return null;
        
        const payload = JSON.parse(Buffer.from(parts[1], 'base64').toString());
        return { sub: payload.sub || payload.userId };
      } catch {
        return null;
      }
    }

    // Production: Use Clerk SDK
    try {
      // @ts-expect-error - Dynamic import
      const { verifyToken } = await import('@clerk/clerk-sdk-node');
      const decoded = await verifyToken(token, {
        secretKey: clerkSecretKey,
      });
      return { sub: decoded.sub };
    } catch (error) {
      this.logger.error('Clerk verification failed:', error);
      return null;
    }
  }

  private async getUserByClerkId(clerkId: string) {
    // Try cache first
    const cacheKey = `user:clerk:${clerkId}`;
    const cached = await this.cache.get<any>(cacheKey);
    
    if (cached) {
      return cached;
    }

    // Fetch from database
    const user = await this.prisma.user.findUnique({
      where: { clerkId },
      select: {
        id: true,
        clerkId: true,
        email: true,
        name: true,
        role: true,
        companyId: true,
        permissions: true,
        isActive: true,
        status: true,
      },
    });

    if (user) {
      // Cache for 5 minutes
      await this.cache.set(cacheKey, user, 300);
    }

    return user;
  }
}
