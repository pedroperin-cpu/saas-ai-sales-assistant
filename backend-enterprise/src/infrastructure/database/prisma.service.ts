// =============================================
// 🗄️ PRISMA SERVICE
// =============================================
// Database connection management
// Fundamentado em: Clean Architecture - Infrastructure Layer
// =============================================

import {
  Injectable,
  OnModuleInit,
  OnModuleDestroy,
  Logger,
} from '@nestjs/common';
import { PrismaClient, Prisma } from '@prisma/client';

@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{
  private readonly logger = new Logger(PrismaService.name);

  constructor() {
    super({
      log: [
        { level: 'query', emit: 'event' },
        { level: 'error', emit: 'stdout' },
        { level: 'warn', emit: 'stdout' },
      ],
      errorFormat: 'pretty',
    });

    // Log slow queries in development
    if (process.env.NODE_ENV === 'development') {
      // @ts-expect-error - Prisma event typing
      this.$on('query', (e: Prisma.QueryEvent) => {
        if (e.duration > 500) {
          this.logger.warn(
            `⚠️ Slow query (${e.duration}ms): ${e.query.substring(0, 200)}...`,
          );
        }
      });
    }
  }

  async onModuleInit() {
    this.logger.log('🔌 Connecting to database...');
    
    try {
      await this.$connect();
      this.logger.log('✅ Database connected successfully');
    } catch (error) {
      this.logger.error('❌ Database connection failed', error);
      throw error;
    }
  }

  async onModuleDestroy() {
    this.logger.log('🔌 Disconnecting from database...');
    await this.$disconnect();
    this.logger.log('✅ Database disconnected');
  }

  // =============================================
  // TRANSACTION HELPER
  // =============================================
  async executeInTransaction<T>(
    operations: (tx: Prisma.TransactionClient) => Promise<T>,
    options?: {
      maxWait?: number;
      timeout?: number;
      isolationLevel?: Prisma.TransactionIsolationLevel;
    },
  ): Promise<T> {
    return this.$transaction(operations, {
      maxWait: options?.maxWait ?? 5000,
      timeout: options?.timeout ?? 10000,
      isolationLevel: options?.isolationLevel,
    });
  }

  // =============================================
  // HEALTH CHECK
  // =============================================
  async healthCheck(): Promise<{
    status: 'healthy' | 'unhealthy';
    latencyMs: number;
    error?: string;
  }> {
    const startTime = Date.now();
    
    try {
      await this.$queryRaw`SELECT 1`;
      return {
        status: 'healthy',
        latencyMs: Date.now() - startTime,
      };
    } catch (error) {
      return {
        status: 'unhealthy',
        latencyMs: Date.now() - startTime,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  // =============================================
  // SOFT DELETE HELPERS
  // =============================================
  
  /**
   * Adds soft delete filter to where clause
   */
  withoutDeleted<T extends { deletedAt?: Date | null }>(
    where: T,
  ): T & { deletedAt: null } {
    return { ...where, deletedAt: null };
  }

  /**
   * Soft delete a record
   */
  async softDelete<T>(
    model: string,
    where: Record<string, any>,
  ): Promise<T> {
    return (this as any)[model].update({
      where,
      data: { deletedAt: new Date() },
    });
  }

  // =============================================
  // CLEANUP
  // =============================================
  async cleanupExpiredData(): Promise<{
    deletedNotifications: number;
    deletedAuditLogs: number;
  }> {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const ninetyDaysAgo = new Date();
    ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);

    const [notificationsResult, auditLogsResult] = await this.$transaction([
      this.notification.deleteMany({
        where: {
          read: true,
          createdAt: { lt: thirtyDaysAgo },
        },
      }),
      this.auditLog.deleteMany({
        where: {
          createdAt: { lt: ninetyDaysAgo },
        },
      }),
    ]);

    this.logger.log(
      `🧹 Cleanup: ${notificationsResult.count} notifications, ${auditLogsResult.count} audit logs`,
    );

    return {
      deletedNotifications: notificationsResult.count,
      deletedAuditLogs: auditLogsResult.count,
    };
  }
}
