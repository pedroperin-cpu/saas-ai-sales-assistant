// =============================================
// 📞 CALLS CONTROLLER
// =============================================

import { Controller, Get, Post, Put, Delete, Body, Param, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiResponse } from '@nestjs/swagger';
import { CallsService } from './calls.service';
import { CurrentUser, AuthenticatedUser, CompanyId, UserId } from '@common/decorators';
import { PaginationDto } from '@common/dto/pagination.dto';
import { CreateCallDto, UpdateCallDto, CallFilterDto, AddTranscriptDto } from './dto/call.dto';

@ApiTags('Calls')
@ApiBearerAuth('JWT-auth')
@Controller('calls')
export class CallsController {
  constructor(private readonly callsService: CallsService) {}

  @Get()
  @ApiOperation({ summary: 'List all calls with filters' })
  async findAll(
    @CompanyId() companyId: string,
    @Query() pagination: PaginationDto,
    @Query() filters: CallFilterDto,
  ) {
    return this.callsService.findAll(companyId, pagination, filters);
  }

  @Get('stats')
  @ApiOperation({ summary: 'Get call statistics' })
  async getStats(@CompanyId() companyId: string) {
    return this.callsService.getStats(companyId);
  }

  @Get('active')
  @ApiOperation({ summary: 'Get active calls' })
  async getActiveCalls(@CompanyId() companyId: string) {
    return this.callsService.getActiveCalls(companyId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get call by ID' })
  async findOne(@Param('id') id: string, @CompanyId() companyId: string) {
    return this.callsService.findOne(id, companyId);
  }

  @Post()
  @ApiOperation({ summary: 'Create new call' })
  async create(
    @Body() dto: CreateCallDto,
    @CompanyId() companyId: string,
    @UserId() userId: string,
  ) {
    return this.callsService.create(dto, companyId, userId);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update call' })
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateCallDto,
    @CompanyId() companyId: string,
  ) {
    return this.callsService.update(id, dto, companyId);
  }

  @Post(':id/transcript')
  @ApiOperation({ summary: 'Add transcript segment to call' })
  async addTranscript(
    @Param('id') id: string,
    @Body() dto: AddTranscriptDto,
    @CompanyId() companyId: string,
  ) {
    return this.callsService.addTranscript(id, dto, companyId);
  }

  @Post(':id/complete')
  @ApiOperation({ summary: 'Mark call as completed' })
  async completeCall(
    @Param('id') id: string,
    @CompanyId() companyId: string,
  ) {
    return this.callsService.completeCall(id, companyId);
  }

  @Get(':id/suggestions')
  @ApiOperation({ summary: 'Get AI suggestions for call' })
  async getSuggestions(@Param('id') id: string, @CompanyId() companyId: string) {
    return this.callsService.getSuggestions(id, companyId);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete call' })
  async remove(@Param('id') id: string, @CompanyId() companyId: string) {
    return this.callsService.remove(id, companyId);
  }
}
