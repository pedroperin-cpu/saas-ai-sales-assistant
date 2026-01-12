// =============================================
// 💬 WHATSAPP SERVICE
// =============================================
// Core business logic for WhatsApp messaging
// Fundamentado em: System Design Interview - Chat System
// =============================================

import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '@infrastructure/database/prisma.service';
import { CacheService } from '@infrastructure/cache/cache.service';
import { AiService } from '@modules/ai/ai.service';
import { NotificationsGateway } from '@modules/notifications/notifications.gateway';
import { PaginationDto, createPaginatedResult } from '@common/dto/pagination.dto';
import { CreateChatDto, SendMessageDto, UpdateChatDto, ChatFilterDto } from './dto/whatsapp.dto';
import { ChatStatus, MessageDirection, MessageStatus, SuggestionType } from '@prisma/client';
import { EventEmitter2 } from '@nestjs/event-emitter';

@Injectable()
export class WhatsappService {
  private readonly logger = new Logger(WhatsappService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly cache: CacheService,
    private readonly aiService: AiService,
    private readonly notifications: NotificationsGateway,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  // =============================================
  // FIND ALL CHATS
  // =============================================
  async findAllChats(companyId: string, pagination: PaginationDto, filters: ChatFilterDto) {
    const where: any = { companyId, deletedAt: null };

    if (filters.status) where.status = filters.status;
    if (filters.userId) where.userId = filters.userId;
    if (filters.priority) where.priority = filters.priority;
    if (filters.search) {
      where.OR = [
        { customerPhone: { contains: filters.search } },
        { customerName: { contains: filters.search, mode: 'insensitive' } },
      ];
    }

    const [chats, total] = await Promise.all([
      this.prisma.whatsappChat.findMany({
        where,
        include: {
          user: { select: { id: true, name: true, avatarUrl: true } },
          messages: {
            take: 1,
            orderBy: { createdAt: 'desc' },
            select: { content: true, direction: true, createdAt: true },
          },
          _count: { select: { messages: true } },
        },
        skip: pagination.skip,
        take: pagination.take,
        orderBy: { lastMessageAt: 'desc' },
      }),
      this.prisma.whatsappChat.count({ where }),
    ]);

    return createPaginatedResult(chats, total, pagination.page!, pagination.limit!);
  }

  // =============================================
  // GET ACTIVE CHATS
  // =============================================
  async getActiveChats(companyId: string) {
    return this.prisma.whatsappChat.findMany({
      where: {
        companyId,
        deletedAt: null,
        status: { in: [ChatStatus.OPEN, ChatStatus.ACTIVE, ChatStatus.PENDING] },
      },
      include: {
        user: { select: { id: true, name: true, avatarUrl: true } },
        messages: {
          take: 1,
          orderBy: { createdAt: 'desc' },
        },
      },
      orderBy: { lastMessageAt: 'desc' },
      take: 50,
    });
  }

  // =============================================
  // FIND ONE CHAT
  // =============================================
  async findOneChat(id: string, companyId: string) {
    const chat = await this.prisma.whatsappChat.findFirst({
      where: { id, companyId, deletedAt: null },
      include: {
        user: { select: { id: true, name: true, email: true, avatarUrl: true } },
        messages: {
          orderBy: { createdAt: 'asc' },
          take: 100,
        },
        aiSuggestions: {
          orderBy: { createdAt: 'desc' },
          take: 5,
        },
      },
    });

    if (!chat) {
      throw new NotFoundException('Chat not found');
    }

    // Mark as read
    if (chat.unreadCount > 0) {
      await this.prisma.whatsappChat.update({
        where: { id },
        data: { unreadCount: 0 },
      });
    }

    return chat;
  }

  // =============================================
  // CREATE CHAT
  // =============================================
  async createChat(dto: CreateChatDto, companyId: string, userId: string) {
    // Check if chat already exists for this phone
    const existing = await this.prisma.whatsappChat.findFirst({
      where: { companyId, customerPhone: dto.customerPhone, deletedAt: null },
    });

    if (existing) {
      // Reactivate if archived
      if (existing.status === ChatStatus.ARCHIVED || existing.status === ChatStatus.RESOLVED) {
        return this.prisma.whatsappChat.update({
          where: { id: existing.id },
          data: { status: ChatStatus.OPEN, userId },
          include: { messages: true },
        });
      }
      return existing;
    }

    // Check usage limits
    const company = await this.prisma.company.findUnique({ where: { id: companyId } });
    if (!company) throw new NotFoundException('Company not found');

    const startOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1);
    const chatsThisMonth = await this.prisma.whatsappChat.count({
      where: { companyId, createdAt: { gte: startOfMonth } },
    });

    if (chatsThisMonth >= company.maxChatsPerMonth) {
      throw new BadRequestException('Monthly chat limit reached. Please upgrade your plan.');
    }

    const chat = await this.prisma.whatsappChat.create({
      data: {
        companyId,
        userId,
        customerPhone: dto.customerPhone,
        customerName: dto.customerName || 'Cliente',
        status: ChatStatus.OPEN,
        metadata: dto.metadata,
      },
    });

    this.logger.log(`WhatsApp chat created: ${chat.id}`);
    this.eventEmitter.emit('whatsapp.chat.created', { chat, companyId });

    return chat;
  }

  // =============================================
  // UPDATE CHAT
  // =============================================
  async updateChat(id: string, dto: UpdateChatDto, companyId: string) {
    await this.findOneChat(id, companyId);

    const updated = await this.prisma.whatsappChat.update({
      where: { id },
      data: {
        ...dto,
        archivedAt: dto.status === ChatStatus.ARCHIVED ? new Date() : undefined,
      },
    });

    return updated;
  }

  // =============================================
  // SEND MESSAGE
  // =============================================
  async sendMessage(chatId: string, dto: SendMessageDto, companyId: string, userId: string) {
    const chat = await this.findOneChat(chatId, companyId);

    const message = await this.prisma.whatsappMessage.create({
      data: {
        chatId,
        content: dto.content,
        type: dto.type || 'TEXT',
        direction: dto.direction || MessageDirection.OUTGOING,
        status: MessageStatus.SENT,
        mediaUrl: dto.mediaUrl,
        aiSuggestionUsed: dto.aiSuggestionUsed || false,
      },
    });

    // Update chat
    await this.prisma.whatsappChat.update({
      where: { id: chatId },
      data: {
        lastMessageAt: new Date(),
        lastMessagePreview: dto.content.substring(0, 100),
        status: chat.status === ChatStatus.PENDING ? ChatStatus.ACTIVE : chat.status,
      },
    });

    // Emit event
    this.eventEmitter.emit('whatsapp.message.sent', {
      chatId,
      message,
      companyId,
      userId,
    });

    // Send via WebSocket
    if (chat.userId) {
      this.notifications.sendWhatsAppMessage(chat.userId, {
        chatId,
        message,
      });
    }

    // TODO: Send via WhatsApp Business API
    // await this.sendViaWhatsAppAPI(chat.customerPhone, dto.content);

    this.logger.log(`Message sent in chat ${chatId}`);

    return message;
  }

  // =============================================
  // GET MESSAGES
  // =============================================
  async getMessages(chatId: string, companyId: string, pagination: PaginationDto) {
    await this.findOneChat(chatId, companyId);

    const [messages, total] = await Promise.all([
      this.prisma.whatsappMessage.findMany({
        where: { chatId },
        orderBy: { createdAt: pagination.sortOrder === 'asc' ? 'asc' : 'desc' },
        skip: pagination.skip,
        take: pagination.take,
      }),
      this.prisma.whatsappMessage.count({ where: { chatId } }),
    ]);

    return createPaginatedResult(
      pagination.sortOrder === 'asc' ? messages : messages.reverse(),
      total,
      pagination.page!,
      pagination.limit!,
    );
  }

  // =============================================
  // GET AI SUGGESTION
  // =============================================
  async getSuggestion(chatId: string, companyId: string) {
    const chat = await this.prisma.whatsappChat.findFirst({
      where: { id: chatId, companyId, deletedAt: null },
      include: {
        messages: {
          orderBy: { createdAt: 'desc' },
          take: 10,
        },
      },
    });

    if (!chat) {
      throw new NotFoundException('Chat not found');
    }

    // Find last customer message
    const lastCustomerMessage = chat.messages.find(
      (m) => m.direction === MessageDirection.INCOMING,
    );

    if (!lastCustomerMessage) {
      return {
        suggestion: 'Aguardando mensagem do cliente para gerar sugestão.',
        confidence: 0.5,
        type: 'general',
      };
    }

    // Build conversation history
    const conversationHistory = chat.messages
      .reverse()
      .map((m) => `${m.direction === MessageDirection.INCOMING ? 'Cliente' : 'Vendedor'}: ${m.content}`)
      .join('\n');

    const suggestion = await this.aiService.generateSuggestion({
      currentMessage: lastCustomerMessage.content,
      conversationHistory,
      context: 'whatsapp',
    });

    // Save suggestion
    if (chat.userId) {
      await this.prisma.aISuggestion.create({
        data: {
          chatId,
          userId: chat.userId,
          type: this.mapSuggestionType(suggestion.type),
          content: suggestion.suggestion,
          confidence: suggestion.confidence,
          triggerText: lastCustomerMessage.content,
          model: 'gpt-4',
        },
      });
    }

    return suggestion;
  }

  private mapSuggestionType(type: string): SuggestionType {
    const mapping: Record<string, SuggestionType> = {
      greeting: SuggestionType.GREETING,
      objection: SuggestionType.OBJECTION_HANDLING,
      closing: SuggestionType.CLOSING,
      question: SuggestionType.QUESTION,
      information: SuggestionType.INFORMATION,
      empathy: SuggestionType.EMPATHY,
      general: SuggestionType.GENERAL,
    };
    return mapping[type] || SuggestionType.GENERAL;
  }

  // =============================================
  // DELETE CHAT
  // =============================================
  async deleteChat(id: string, companyId: string) {
    await this.findOneChat(id, companyId);

    await this.prisma.whatsappChat.update({
      where: { id },
      data: { deletedAt: new Date() },
    });

    this.logger.log(`Chat ${id} deleted (soft delete)`);

    return { success: true, message: 'Chat deleted successfully' };
  }

  // =============================================
  // STATISTICS
  // =============================================
  async getStats(companyId: string) {
    const now = new Date();
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const startOfWeek = new Date(now.setDate(now.getDate() - now.getDay()));
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const [
      totalChats,
      activeChats,
      pendingChats,
      totalMessages,
      messagesToday,
      messagesThisWeek,
      avgResponseTime,
    ] = await Promise.all([
      this.prisma.whatsappChat.count({ where: { companyId, deletedAt: null } }),
      this.prisma.whatsappChat.count({
        where: { companyId, deletedAt: null, status: { in: [ChatStatus.ACTIVE, ChatStatus.OPEN] } },
      }),
      this.prisma.whatsappChat.count({
        where: { companyId, deletedAt: null, status: ChatStatus.PENDING },
      }),
      this.prisma.whatsappMessage.count({ where: { chat: { companyId } } }),
      this.prisma.whatsappMessage.count({
        where: { chat: { companyId }, createdAt: { gte: startOfDay } },
      }),
      this.prisma.whatsappMessage.count({
        where: { chat: { companyId }, createdAt: { gte: startOfWeek } },
      }),
      // TODO: Calculate actual average response time
      Promise.resolve({ _avg: { value: 300 } }), // 5 minutes placeholder
    ]);

    return {
      chats: {
        total: totalChats,
        active: activeChats,
        pending: pendingChats,
      },
      messages: {
        total: totalMessages,
        today: messagesToday,
        thisWeek: messagesThisWeek,
      },
      performance: {
        avgResponseTimeSeconds: 300, // Placeholder
      },
    };
  }

  // =============================================
  // HANDLE INCOMING MESSAGE (from webhook)
  // =============================================
  async handleIncomingMessage(data: {
    from: string;
    content: string;
    waMessageId: string;
    type?: string;
    mediaUrl?: string;
    phoneNumberId: string;
  }) {
    this.logger.log(`Processing incoming message from ${data.from}`);

    // Find company by phone number ID (would need a mapping table)
    // For now, we'll need to implement this logic

    // Find or create chat
    // const chat = await this.findOrCreateChat(companyId, data.from);

    // Create message
    // const message = await this.prisma.whatsappMessage.create({...});

    // Update chat
    // await this.prisma.whatsappChat.update({...});

    // Generate AI suggestion
    // const suggestion = await this.getSuggestion(chat.id, companyId);

    // Notify user via WebSocket
    // this.notifications.sendNewMessage(chat.userId, {...});

    return { success: true };
  }
}
