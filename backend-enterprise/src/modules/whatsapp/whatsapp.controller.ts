// =============================================
// 💬 WHATSAPP CONTROLLER
// =============================================

import { Controller, Get, Post, Put, Delete, Body, Param, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { WhatsappService } from './whatsapp.service';
import { CompanyId, UserId } from '@common/decorators';
import { PaginationDto } from '@common/dto/pagination.dto';
import { CreateChatDto, SendMessageDto, UpdateChatDto, ChatFilterDto } from './dto/whatsapp.dto';

@ApiTags('WhatsApp')
@ApiBearerAuth('JWT-auth')
@Controller('whatsapp')
export class WhatsappController {
  constructor(private readonly whatsappService: WhatsappService) {}

  @Get('chats')
  @ApiOperation({ summary: 'List all WhatsApp chats' })
  async findAllChats(
    @CompanyId() companyId: string,
    @Query() pagination: PaginationDto,
    @Query() filters: ChatFilterDto,
  ) {
    return this.whatsappService.findAllChats(companyId, pagination, filters);
  }

  @Get('chats/active')
  @ApiOperation({ summary: 'Get active chats' })
  async getActiveChats(@CompanyId() companyId: string) {
    return this.whatsappService.getActiveChats(companyId);
  }

  @Get('chats/:id')
  @ApiOperation({ summary: 'Get chat by ID with messages' })
  async findOneChat(@Param('id') id: string, @CompanyId() companyId: string) {
    return this.whatsappService.findOneChat(id, companyId);
  }

  @Post('chats')
  @ApiOperation({ summary: 'Create new chat' })
  async createChat(
    @Body() dto: CreateChatDto,
    @CompanyId() companyId: string,
    @UserId() userId: string,
  ) {
    return this.whatsappService.createChat(dto, companyId, userId);
  }

  @Put('chats/:id')
  @ApiOperation({ summary: 'Update chat' })
  async updateChat(
    @Param('id') id: string,
    @Body() dto: UpdateChatDto,
    @CompanyId() companyId: string,
  ) {
    return this.whatsappService.updateChat(id, dto, companyId);
  }

  @Post('chats/:id/messages')
  @ApiOperation({ summary: 'Send message in chat' })
  async sendMessage(
    @Param('id') chatId: string,
    @Body() dto: SendMessageDto,
    @CompanyId() companyId: string,
    @UserId() userId: string,
  ) {
    return this.whatsappService.sendMessage(chatId, dto, companyId, userId);
  }

  @Get('chats/:id/messages')
  @ApiOperation({ summary: 'Get chat messages' })
  async getMessages(
    @Param('id') chatId: string,
    @CompanyId() companyId: string,
    @Query() pagination: PaginationDto,
  ) {
    return this.whatsappService.getMessages(chatId, companyId, pagination);
  }

  @Get('chats/:id/suggestion')
  @ApiOperation({ summary: 'Get AI suggestion for chat' })
  async getSuggestion(@Param('id') chatId: string, @CompanyId() companyId: string) {
    return this.whatsappService.getSuggestion(chatId, companyId);
  }

  @Delete('chats/:id')
  @ApiOperation({ summary: 'Delete chat' })
  async deleteChat(@Param('id') id: string, @CompanyId() companyId: string) {
    return this.whatsappService.deleteChat(id, companyId);
  }

  @Get('stats')
  @ApiOperation({ summary: 'Get WhatsApp statistics' })
  async getStats(@CompanyId() companyId: string) {
    return this.whatsappService.getStats(companyId);
  }
}
