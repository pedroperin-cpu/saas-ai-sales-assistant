import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { PrismaService } from '@infrastructure/database/prisma.service';
import { CacheService } from '@infrastructure/cache/cache.service';
import { UpdateCompanyDto } from './dto/company.dto';
import { AuditAction } from '@prisma/client';

@Injectable()
export class CompaniesService {
  private readonly logger = new Logger(CompaniesService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly cache: CacheService,
  ) {}

  async findById(id: string) {
    const cacheKey = this.cache.companyKey(id);
    const cached = await this.cache.get(cacheKey);
    if (cached) return cached;

    const company = await this.prisma.company.findUnique({
      where: { id },
      include: { _count: { select: { users: true, calls: true, whatsappChats: true } } },
    });

    if (!company) throw new NotFoundException('Company not found');

    await this.cache.set(cacheKey, company, 300);
    return company;
  }

  async getStats(companyId: string) {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfWeek = new Date(now.setDate(now.getDate() - now.getDay()));

    const [
      usersCount,
      activeUsersCount,
      totalCalls,
      callsThisMonth,
      callsThisWeek,
      activeChats,
      totalMessages,
    ] = await Promise.all([
      this.prisma.user.count({ where: { companyId } }),
      this.prisma.user.count({ where: { companyId, isActive: true } }),
      this.prisma.call.count({ where: { companyId } }),
      this.prisma.call.count({ where: { companyId, createdAt: { gte: startOfMonth } } }),
      this.prisma.call.count({ where: { companyId, createdAt: { gte: startOfWeek } } }),
      this.prisma.whatsappChat.count({ where: { companyId, status: 'ACTIVE' } }),
      this.prisma.whatsappMessage.count({ where: { chat: { companyId } } }),
    ]);

    return {
      users: { total: usersCount, active: activeUsersCount },
      calls: { total: totalCalls, thisMonth: callsThisMonth, thisWeek: callsThisWeek },
      chats: { active: activeChats },
      messages: { total: totalMessages },
    };
  }

  async getUsage(companyId: string) {
    const company = await this.prisma.company.findUnique({ where: { id: companyId } });
    if (!company) throw new NotFoundException('Company not found');

    const startOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1);

    const [usersCount, callsThisMonth, chatsThisMonth] = await Promise.all([
      this.prisma.user.count({ where: { companyId } }),
      this.prisma.call.count({ where: { companyId, createdAt: { gte: startOfMonth } } }),
      this.prisma.whatsappChat.count({ where: { companyId, createdAt: { gte: startOfMonth } } }),
    ]);

    return {
      users: {
        used: usersCount,
        limit: company.maxUsers,
        percentage: Math.round((usersCount / company.maxUsers) * 100),
      },
      calls: {
        used: callsThisMonth,
        limit: company.maxCallsPerMonth,
        percentage: Math.round((callsThisMonth / company.maxCallsPerMonth) * 100),
      },
      chats: {
        used: chatsThisMonth,
        limit: company.maxChatsPerMonth,
        percentage: Math.round((chatsThisMonth / company.maxChatsPerMonth) * 100),
      },
      plan: company.plan,
    };
  }

  async update(id: string, dto: UpdateCompanyDto, userId: string) {
    const company = await this.prisma.company.findUnique({ where: { id } });
    if (!company) throw new NotFoundException('Company not found');

    const oldValues = { name: company.name, website: company.website, industry: company.industry };

    const updated = await this.prisma.company.update({
      where: { id },
      data: dto,
    });

    await this.prisma.auditLog.create({
      data: {
        companyId: id,
        userId,
        action: AuditAction.UPDATE,
        resource: 'company',
        resourceId: id,
        description: 'Company updated',
        oldValues,
        newValues: dto as any,
      },
    });

    await this.cache.del(this.cache.companyKey(id));
    this.logger.log(`Company ${id} updated by user ${userId}`);

    return updated;
  }
}
