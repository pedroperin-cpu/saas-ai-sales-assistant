import { Controller, Get, Post, Put, Delete, Body, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { UsersService } from './users.service';
import { CurrentUser, AuthenticatedUser, Roles, CompanyId } from '@common/decorators';
import { RolesGuard } from '@common/guards/roles.guard';
import { UserRole } from '@prisma/client';
import { PaginationDto } from '@common/dto/pagination.dto';
import { CreateUserDto, UpdateUserDto } from './dto/user.dto';

@ApiTags('Users')
@ApiBearerAuth('JWT-auth')
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  @ApiOperation({ summary: 'List all users in company' })
  async findAll(@CompanyId() companyId: string, @Query() pagination: PaginationDto) {
    return this.usersService.findAll(companyId, pagination);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get user by ID' })
  async findOne(@Param('id') id: string, @CompanyId() companyId: string) {
    return this.usersService.findOne(id, companyId);
  }

  @Post()
  @Roles(UserRole.OWNER, UserRole.ADMIN)
  @UseGuards(RolesGuard)
  @ApiOperation({ summary: 'Create new user' })
  async create(@Body() dto: CreateUserDto, @CompanyId() companyId: string, @CurrentUser() user: AuthenticatedUser) {
    return this.usersService.create(dto, companyId, user);
  }

  @Put(':id')
  @Roles(UserRole.OWNER, UserRole.ADMIN)
  @UseGuards(RolesGuard)
  @ApiOperation({ summary: 'Update user' })
  async update(@Param('id') id: string, @Body() dto: UpdateUserDto, @CompanyId() companyId: string, @CurrentUser() user: AuthenticatedUser) {
    return this.usersService.update(id, dto, companyId, user);
  }

  @Delete(':id')
  @Roles(UserRole.OWNER, UserRole.ADMIN)
  @UseGuards(RolesGuard)
  @ApiOperation({ summary: 'Delete user' })
  async remove(@Param('id') id: string, @CompanyId() companyId: string, @CurrentUser() user: AuthenticatedUser) {
    return this.usersService.remove(id, companyId, user);
  }
}
