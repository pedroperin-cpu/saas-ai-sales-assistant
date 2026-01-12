import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { AiService } from '../../src/modules/ai/ai.service';
import { CacheService } from '../../src/infrastructure/cache/cache.service';

describe('AiService', () => {
  let service: AiService;

  const mockCacheService = {
    get: jest.fn().mockResolvedValue(null),
    set: jest.fn().mockResolvedValue(undefined),
    aiSuggestionKey: jest.fn().mockReturnValue('test-key'),
  };

  const mockConfigService = {
    get: jest.fn().mockReturnValue(''),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AiService,
        { provide: ConfigService, useValue: mockConfigService },
        { provide: CacheService, useValue: mockCacheService },
      ],
    }).compile();

    service = module.get<AiService>(AiService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('generateSuggestion', () => {
    it('should generate greeting suggestion', async () => {
      const result = await service.generateSuggestion({
        currentMessage: 'Olá, bom dia!',
        context: 'whatsapp',
      });
      expect(result).toBeDefined();
      expect(result.type).toBe('greeting');
    });
  });
});
