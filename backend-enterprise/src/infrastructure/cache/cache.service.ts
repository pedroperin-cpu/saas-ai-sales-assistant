import { Injectable, OnModuleInit, OnModuleDestroy, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createClient, RedisClientType } from 'redis';

@Injectable()
export class CacheService implements OnModuleInit, OnModuleDestroy {
  private client: RedisClientType | null = null;
  private readonly logger = new Logger(CacheService.name);
  private readonly defaultTtl: number;

  constructor(private readonly configService: ConfigService) {
    this.defaultTtl = this.configService.get<number>('redis.ttl', 3600);
  }

  async onModuleInit() {
    const redisUrl = this.configService.get<string>('redis.url');
    if (!redisUrl) {
      this.logger.warn('Redis URL not configured, caching disabled');
      return;
    }
    try {
      this.client = createClient({ url: redisUrl });
      this.client.on('error', (err) => this.logger.error('Redis error:', err));
      await this.client.connect();
      this.logger.log('✅ Redis connected');
    } catch (error) {
      this.logger.error('Failed to connect to Redis:', error);
    }
  }

  async onModuleDestroy() {
    if (this.client) {
      await this.client.quit();
    }
  }

  async get<T>(key: string): Promise<T | null> {
    if (!this.client) return null;
    try {
      const value = await this.client.get(key);
      return value ? JSON.parse(value) : null;
    } catch { return null; }
  }

  async set(key: string, value: any, ttl?: number): Promise<void> {
    if (!this.client) return;
    try {
      await this.client.setEx(key, ttl || this.defaultTtl, JSON.stringify(value));
    } catch (error) {
      this.logger.error(`Cache set error for ${key}:`, error);
    }
  }

  async del(key: string): Promise<void> {
    if (!this.client) return;
    try { await this.client.del(key); } catch {}
  }

  async delPattern(pattern: string): Promise<void> {
    if (!this.client) return;
    try {
      const keys = await this.client.keys(pattern);
      if (keys.length > 0) await this.client.del(keys);
    } catch {}
  }

  companyKey(companyId: string): string { return `company:${companyId}`; }
  userKey(userId: string): string { return `user:${userId}`; }
  aiSuggestionKey(hash: string): string { return `ai:suggestion:${hash}`; }
}
