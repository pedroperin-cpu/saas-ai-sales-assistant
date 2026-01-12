import { Injectable, NotFoundException, ForbiddenException, ConflictException } from '@nestjs/common';
import { PrismaService } from '@infrastructure/database/prisma.service';
import { CacheService } from '@infrastructure/cache/cache.service';
import { PaginationDto, createPaginatedResult } from '@common/dto/pagination.dto';
import { AuthenticatedUser } from '@common/decorators';
import { canManageUser } from '@common/guards/roles.guard';
import { CreateUserDto, UpdateUserDto } from './dto/user.dto';
import { UserRole } from '@prisma/client';

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService, private readonly cache: CacheService) {}

  async findAll(companyId: string, pagination: PaginationDto) {
    const where = { companyId, deletedAt: null };
    const [users, total] = await Promise.all([
      this.prisma.user.findMany({
        where,
        select: { id: true, email: true, name: true, role: true, avatarUrl: true, status: true, lastActiveAt: true, createdAt: true },
        skip: pagination.skip, take: pagination.take, orderBy: { createdAt: pagination.sortOrder },
      }),
      this.prisma.user.count({ where }),
    ]);
    return createPaginatedResult(users, total, pagination.page!, pagination.limit!);
  }

  async findOne(id: string, companyId: string) {
    const user = await this.prisma.user.findFirst({ where: { id, companyId, deletedAt: null } });
    if (!user) throw new NotFoundException('User not found');
    return user;
  }

  async create(dto: CreateUserDto, companyId: string, currentUser: AuthenticatedUser) {
    const existing = await this.prisma.user.findFirst({ where: { email: dto.email, companyId } });
    if (existing) throw new ConflictException('Email already exists');
    return this.prisma.user.create({ data: { ...dto, companyId, clerkId: `pending_${Date.now()}` } });
  }

  async update(id: string, dto: UpdateUserDto, companyId: string, currentUser: AuthenticatedUser) {
    const user = await this.findOne(id, companyId);
    if (user.role === UserRole.OWNER && dto.role && dto.role !== UserRole.OWNER) {
      throw new ForbiddenException('Cannot change owner role');
    }
    const updated = await this.prisma.user.update({ where: { id }, data: dto });
    await this.cache.delete(`user:clerk:${user.clerkId}`);
    return updated;
  }

  async remove(id: string, companyId: string, currentUser: AuthenticatedUser) {
    const user = await this.findOne(id, companyId);
    if (user.role === UserRole.OWNER) throw new ForbiddenException('Cannot delete owner');
    if (currentUser.id === id) throw new ForbiddenException('Cannot delete yourself');
    await this.prisma.user.update({ where: { id }, data: { deletedAt: new Date(), isActive: false } });
    return { success: true };
  }
}
