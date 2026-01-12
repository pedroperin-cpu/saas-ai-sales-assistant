// =============================================
// 📞 CALLS SERVICE
// =============================================
// Core business logic for phone call management
// Fundamentado em: Clean Architecture - Use Cases
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
import { CreateCallDto, UpdateCallDto, CallFilterDto, AddTranscriptDto } from './dto/call.dto';
import { CallStatus, CallDirection, SuggestionType } from '@prisma/client';
import { EventEmitter2 } from '@nestjs/event-emitter';

@Injectable()
export class CallsService {
  private readonly logger = new Logger(CallsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly cache: CacheService,
    private readonly aiService: AiService,
    private readonly notifications: NotificationsGateway,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  // =============================================
  // FIND ALL WITH FILTERS
  // =============================================
  async findAll(companyId: string, pagination: PaginationDto, filters: CallFilterDto) {
    const where: any = { companyId };

    // Apply filters
    if (filters.status) where.status = filters.status;
    if (filters.direction) where.direction = filters.direction;
    if (filters.userId) where.userId = filters.userId;
    if (filters.startDate) where.createdAt = { gte: new Date(filters.startDate) };
    if (filters.endDate) {
      where.createdAt = { ...where.createdAt, lte: new Date(filters.endDate) };
    }
    if (filters.search) {
      where.OR = [
        { phoneNumber: { contains: filters.search } },
        { contactName: { contains: filters.search, mode: 'insensitive' } },
        { transcript: { contains: filters.search, mode: 'insensitive' } },
      ];
    }

    const [calls, total] = await Promise.all([
      this.prisma.call.findMany({
        where,
        include: {
          user: { select: { id: true, name: true, avatarUrl: true } },
          _count: { select: { aiSuggestions: true } },
        },
        skip: pagination.skip,
        take: pagination.take,
        orderBy: { createdAt: pagination.sortOrder },
      }),
      this.prisma.call.count({ where }),
    ]);

    return createPaginatedResult(calls, total, pagination.page!, pagination.limit!);
  }

  // =============================================
  // FIND ONE
  // =============================================
  async findOne(id: string, companyId: string) {
    const call = await this.prisma.call.findFirst({
      where: { id, companyId },
      include: {
        user: { select: { id: true, name: true, email: true, avatarUrl: true } },
        aiSuggestions: {
          orderBy: { createdAt: 'desc' },
          take: 10,
        },
      },
    });

    if (!call) {
      throw new NotFoundException('Call not found');
    }

    return call;
  }

  // =============================================
  // CREATE CALL
  // =============================================
  async create(dto: CreateCallDto, companyId: string, userId: string) {
    // Check usage limits
    const company = await this.prisma.company.findUnique({ where: { id: companyId } });
    if (!company) throw new NotFoundException('Company not found');

    const startOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1);
    const callsThisMonth = await this.prisma.call.count({
      where: { companyId, createdAt: { gte: startOfMonth } },
    });

    if (callsThisMonth >= company.maxCallsPerMonth) {
      throw new BadRequestException('Monthly call limit reached. Please upgrade your plan.');
    }

    const call = await this.prisma.call.create({
      data: {
        companyId,
        userId,
        phoneNumber: dto.phoneNumber,
        contactName: dto.contactName,
        direction: dto.direction || CallDirection.OUTBOUND,
        status: CallStatus.INITIATED,
        startedAt: new Date(),
        metadata: dto.metadata,
      },
      include: {
        user: { select: { id: true, name: true } },
      },
    });

    this.logger.log(`Call created: ${call.id} by user ${userId}`);

    // Emit event for real-time updates
    this.eventEmitter.emit('call.created', { call, companyId });

    return call;
  }

  // =============================================
  // UPDATE CALL
  // =============================================
  async update(id: string, dto: UpdateCallDto, companyId: string) {
    const call = await this.findOne(id, companyId);

    const updated = await this.prisma.call.update({
      where: { id },
      data: {
        ...dto,
        updatedAt: new Date(),
      },
    });

    // Notify if status changed
    if (dto.status && dto.status !== call.status) {
      this.notifications.sendCallStatusUpdate(call.userId, {
        callId: id,
        status: dto.status,
        previousStatus: call.status,
      });
    }

    return updated;
  }

  // =============================================
  // ADD TRANSCRIPT (Real-time from STT)
  // =============================================
  async addTranscript(id: string, dto: AddTranscriptDto, companyId: string) {
    const call = await this.findOne(id, companyId);

    if (call.status !== CallStatus.IN_PROGRESS) {
      throw new BadRequestException('Can only add transcript to in-progress calls');
    }

    // Append to existing transcript
    const currentTranscript = call.transcript || '';
    const newTranscript = currentTranscript 
      ? `${currentTranscript}\n${dto.speaker}: ${dto.text}`
      : `${dto.speaker}: ${dto.text}`;

    // Update call
    const updated = await this.prisma.call.update({
      where: { id },
      data: {
        transcript: newTranscript,
        transcriptSegments: {
          ...(call.transcriptSegments as object || {}),
          segments: [
            ...((call.transcriptSegments as any)?.segments || []),
            {
              speaker: dto.speaker,
              text: dto.text,
              timestamp: new Date().toISOString(),
              confidence: dto.confidence,
            },
          ],
        },
      },
    });

    // Generate AI suggestion if it's a customer message
    if (dto.speaker === 'customer') {
      this.generateAndSendSuggestion(id, dto.text, call.userId, companyId);
    }

    return updated;
  }

  // =============================================
  // GENERATE AI SUGGESTION (Async)
  // =============================================
  private async generateAndSendSuggestion(
    callId: string,
    customerMessage: string,
    userId: string,
    companyId: string,
  ) {
    try {
      const startTime = Date.now();

      // Get conversation context
      const call = await this.prisma.call.findUnique({
        where: { id: callId },
        select: { transcript: true },
      });

      // Generate suggestion
      const suggestion = await this.aiService.generateSuggestion({
        currentMessage: customerMessage,
        conversationHistory: call?.transcript || '',
        context: 'phone_call',
      });

      const latencyMs = Date.now() - startTime;

      // Save suggestion to database
      const savedSuggestion = await this.prisma.aISuggestion.create({
        data: {
          callId,
          userId,
          type: this.mapSuggestionType(suggestion.type),
          content: suggestion.suggestion,
          confidence: suggestion.confidence,
          triggerText: customerMessage,
          model: 'gpt-4',
          latencyMs,
        },
      });

      // Send via WebSocket
      this.notifications.sendAISuggestion(userId, {
        id: savedSuggestion.id,
        callId,
        type: suggestion.type,
        content: suggestion.suggestion,
        confidence: suggestion.confidence,
        context: suggestion.context,
        timestamp: new Date(),
      });

      this.logger.debug(`AI suggestion sent for call ${callId} in ${latencyMs}ms`);
    } catch (error) {
      this.logger.error(`Failed to generate suggestion for call ${callId}:`, error);
    }
  }

  private mapSuggestionType(type: string): SuggestionType {
    const mapping: Record<string, SuggestionType> = {
      greeting: SuggestionType.GREETING,
      objection: SuggestionType.OBJECTION_HANDLING,
      closing: SuggestionType.CLOSING,
      question: SuggestionType.QUESTION,
      general: SuggestionType.GENERAL,
    };
    return mapping[type] || SuggestionType.GENERAL;
  }

  // =============================================
  // COMPLETE CALL
  // =============================================
  async completeCall(id: string, companyId: string) {
    const call = await this.findOne(id, companyId);

    if (call.status === CallStatus.COMPLETED) {
      throw new BadRequestException('Call is already completed');
    }

    const duration = call.startedAt
      ? Math.floor((Date.now() - call.startedAt.getTime()) / 1000)
      : 0;

    // Analyze sentiment if there's a transcript
    let sentiment: number | null = null;
    let sentimentLabel: string | null = null;
    let summary: string | null = null;

    if (call.transcript) {
      try {
        const analysis = await this.aiService.analyzeConversation(call.transcript);
        sentiment = analysis.score;
        sentimentLabel = analysis.sentiment.toUpperCase();
        summary = analysis.summary;
      } catch (error) {
        this.logger.error(`Failed to analyze call ${id}:`, error);
      }
    }

    const updated = await this.prisma.call.update({
      where: { id },
      data: {
        status: CallStatus.COMPLETED,
        endedAt: new Date(),
        duration,
        sentiment,
        sentimentLabel: sentimentLabel as any,
        summary,
      },
    });

    // Emit event
    this.eventEmitter.emit('call.completed', { call: updated, companyId });

    this.logger.log(`Call ${id} completed. Duration: ${duration}s`);

    return updated;
  }

  // =============================================
  // GET SUGGESTIONS
  // =============================================
  async getSuggestions(id: string, companyId: string) {
    await this.findOne(id, companyId); // Verify access

    return this.prisma.aISuggestion.findMany({
      where: { callId: id },
      orderBy: { createdAt: 'desc' },
      take: 20,
    });
  }

  // =============================================
  // DELETE CALL
  // =============================================
  async remove(id: string, companyId: string) {
    await this.findOne(id, companyId); // Verify access

    await this.prisma.call.delete({ where: { id } });

    this.logger.log(`Call ${id} deleted`);

    return { success: true, message: 'Call deleted successfully' };
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
      totalCalls,
      callsToday,
      callsThisWeek,
      callsThisMonth,
      avgDuration,
      callsByStatus,
      callsByDirection,
      avgSentiment,
    ] = await Promise.all([
      this.prisma.call.count({ where: { companyId } }),
      this.prisma.call.count({ where: { companyId, createdAt: { gte: startOfDay } } }),
      this.prisma.call.count({ where: { companyId, createdAt: { gte: startOfWeek } } }),
      this.prisma.call.count({ where: { companyId, createdAt: { gte: startOfMonth } } }),
      this.prisma.call.aggregate({
        where: { companyId, status: CallStatus.COMPLETED },
        _avg: { duration: true },
      }),
      this.prisma.call.groupBy({
        by: ['status'],
        where: { companyId },
        _count: true,
      }),
      this.prisma.call.groupBy({
        by: ['direction'],
        where: { companyId },
        _count: true,
      }),
      this.prisma.call.aggregate({
        where: { companyId, sentiment: { not: null } },
        _avg: { sentiment: true },
      }),
    ]);

    return {
      total: totalCalls,
      today: callsToday,
      thisWeek: callsThisWeek,
      thisMonth: callsThisMonth,
      averageDuration: Math.round(avgDuration._avg?.duration || 0),
      averageSentiment: avgSentiment._avg?.sentiment || null,
      byStatus: callsByStatus.reduce((acc, item) => {
        acc[item.status] = item._count;
        return acc;
      }, {} as Record<string, number>),
      byDirection: callsByDirection.reduce((acc, item) => {
        acc[item.direction] = item._count;
        return acc;
      }, {} as Record<string, number>),
    };
  }

  // =============================================
  // GET ACTIVE CALLS
  // =============================================
  async getActiveCalls(companyId: string) {
    return this.prisma.call.findMany({
      where: {
        companyId,
        status: { in: [CallStatus.INITIATED, CallStatus.RINGING, CallStatus.IN_PROGRESS] },
      },
      include: {
        user: { select: { id: true, name: true, avatarUrl: true } },
      },
      orderBy: { startedAt: 'desc' },
    });
  }
}
