import { Controller, Post, Body, Get } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { AiService, SuggestionRequest } from './ai.service';
import { IsString, IsOptional, IsEnum } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

class GenerateSuggestionDto implements SuggestionRequest {
  @ApiProperty({ description: 'Current message from customer' })
  @IsString()
  currentMessage!: string;

  @ApiPropertyOptional({ description: 'Previous conversation history' })
  @IsOptional()
  @IsString()
  conversationHistory?: string;

  @ApiPropertyOptional({ enum: ['phone_call', 'whatsapp'] })
  @IsOptional()
  @IsEnum(['phone_call', 'whatsapp'])
  context?: 'phone_call' | 'whatsapp';

  @ApiPropertyOptional({ enum: ['positive', 'neutral', 'negative'] })
  @IsOptional()
  @IsEnum(['positive', 'neutral', 'negative'])
  customerSentiment?: 'positive' | 'neutral' | 'negative';
}

class AnalyzeConversationDto {
  @ApiProperty({ description: 'Full conversation transcript' })
  @IsString()
  transcript!: string;
}

@ApiTags('AI')
@ApiBearerAuth('JWT-auth')
@Controller('ai')
export class AiController {
  constructor(private readonly aiService: AiService) {}

  @Post('suggestion')
  @ApiOperation({ summary: 'Generate AI suggestion for a customer message' })
  async generateSuggestion(@Body() dto: GenerateSuggestionDto) {
    return this.aiService.generateSuggestion(dto);
  }

  @Post('analyze')
  @ApiOperation({ summary: 'Analyze conversation sentiment and extract insights' })
  async analyzeConversation(@Body() dto: AnalyzeConversationDto) {
    return this.aiService.analyzeConversation(dto.transcript);
  }

  @Get('health')
  @ApiOperation({ summary: 'Check AI service health' })
  async checkHealth() {
    return { status: 'healthy', provider: 'openai', timestamp: new Date() };
  }
}
