import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { CacheService } from '@infrastructure/cache/cache.service';
import { createHash } from 'crypto';

export interface SuggestionRequest {
  currentMessage: string;
  conversationHistory?: string;
  context?: 'phone_call' | 'whatsapp';
  customerSentiment?: 'positive' | 'neutral' | 'negative';
  productContext?: string;
}

export interface SuggestionResponse {
  suggestion: string;
  confidence: number;
  type: string;
  context?: string;
}

export interface ConversationAnalysis {
  sentiment: 'positive' | 'neutral' | 'negative';
  score: number;
  summary: string;
  keywords: string[];
  actionItems: string[];
}

@Injectable()
export class AiService {
  private readonly logger = new Logger(AiService.name);
  private readonly openaiApiKey: string;

  constructor(
    private readonly configService: ConfigService,
    private readonly cache: CacheService,
  ) {
    this.openaiApiKey = this.configService.get<string>('ai.openai.apiKey') || '';
  }

  async generateSuggestion(request: SuggestionRequest): Promise<SuggestionResponse> {
    const cacheKey = this.cache.aiSuggestionKey(
      createHash('md5').update(request.currentMessage).digest('hex')
    );

    const cached = await this.cache.get<SuggestionResponse>(cacheKey);
    if (cached) {
      this.logger.debug('AI suggestion cache hit');
      return cached;
    }

    // Use OpenAI if configured
    if (this.openaiApiKey && !this.openaiApiKey.includes('xxx')) {
      try {
        const response = await this.callOpenAI(request);
        await this.cache.set(cacheKey, response, 300);
        return response;
      } catch (error) {
        this.logger.error('OpenAI error, using mock:', error);
      }
    }

    // Mock response for development
    const mockResponse = this.getMockSuggestion(request.currentMessage);
    await this.cache.set(cacheKey, mockResponse, 300);
    return mockResponse;
  }

  private async callOpenAI(request: SuggestionRequest): Promise<SuggestionResponse> {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.openaiApiKey}`,
      },
      body: JSON.stringify({
        model: 'gpt-4-turbo-preview',
        messages: [
          { role: 'system', content: 'Você é um assistente de vendas brasileiro. Dê sugestões concisas (máx 2 frases) para ajudar vendedores.' },
          { role: 'user', content: `Cliente disse: "${request.currentMessage}"\n\nDê uma sugestão de resposta.` }
        ],
        max_tokens: 200,
        temperature: 0.7,
      }),
    });

    const data = await response.json() as any;
    const content = data.choices?.[0]?.message?.content || 'Continue ouvindo ativamente.';
    
    return {
      suggestion: content,
      confidence: 0.85,
      type: this.detectType(request.currentMessage),
      context: request.context,
    };
  }

  private getMockSuggestion(message: string): SuggestionResponse {
    const lowerMessage = message.toLowerCase();
    
    if (lowerMessage.includes('olá') || lowerMessage.includes('oi') || lowerMessage.includes('bom dia')) {
      return { suggestion: 'Olá! Seja bem-vindo! Como posso ajudá-lo hoje? 😊', confidence: 0.9, type: 'greeting' };
    }
    if (lowerMessage.includes('caro') || lowerMessage.includes('preço') || lowerMessage.includes('desconto')) {
      return { suggestion: 'Entendo sua preocupação com o investimento. Nosso produto oferece ROI comprovado em 3 meses. Posso mostrar casos de sucesso similares ao seu?', confidence: 0.85, type: 'objection' };
    }
    if (lowerMessage.includes('interesse') || lowerMessage.includes('gostei') || lowerMessage.includes('quero')) {
      return { suggestion: 'Excelente! Vejo que você tem interesse. Que tal agendarmos uma demonstração personalizada para mostrar como podemos atender suas necessidades específicas?', confidence: 0.9, type: 'closing' };
    }
    if (lowerMessage.includes('?') || lowerMessage.includes('como') || lowerMessage.includes('qual')) {
      return { suggestion: 'Ótima pergunta! Deixa eu explicar de forma clara...', confidence: 0.8, type: 'question' };
    }
    
    return { suggestion: 'Entendo. Me conta mais sobre sua situação para eu poder ajudar melhor.', confidence: 0.7, type: 'general' };
  }

  private detectType(message: string): string {
    const lower = message.toLowerCase();
    if (lower.includes('olá') || lower.includes('oi')) return 'greeting';
    if (lower.includes('caro') || lower.includes('preço')) return 'objection';
    if (lower.includes('interesse') || lower.includes('quero')) return 'closing';
    if (lower.includes('?')) return 'question';
    return 'general';
  }

  async analyzeConversation(transcript: string): Promise<ConversationAnalysis> {
    const positiveWords = ['bom', 'ótimo', 'excelente', 'gostei', 'interesse', 'sim', 'quero'];
    const negativeWords = ['não', 'caro', 'difícil', 'problema', 'ruim', 'cancelar'];

    const words = transcript.toLowerCase().split(/\s+/);
    const positiveCount = words.filter(w => positiveWords.some(p => w.includes(p))).length;
    const negativeCount = words.filter(w => negativeWords.some(n => w.includes(n))).length;

    const score = (positiveCount - negativeCount + 5) / 10;
    const normalizedScore = Math.max(0, Math.min(1, score));

    let sentiment: 'positive' | 'neutral' | 'negative' = 'neutral';
    if (normalizedScore > 0.6) sentiment = 'positive';
    else if (normalizedScore < 0.4) sentiment = 'negative';

    return {
      sentiment,
      score: normalizedScore,
      summary: `Conversa com sentimento ${sentiment}. ${positiveCount} sinais positivos, ${negativeCount} negativos.`,
      keywords: words.filter(w => w.length > 5).slice(0, 5),
      actionItems: sentiment === 'positive' ? ['Agendar follow-up', 'Enviar proposta'] : ['Investigar objeções', 'Oferecer alternativas'],
    };
  }
}
