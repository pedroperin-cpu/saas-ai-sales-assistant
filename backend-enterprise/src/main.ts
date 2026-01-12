// =============================================
// 🚀 MAIN.TS - Application Entry Point
// =============================================

import { NestFactory } from '@nestjs/core';
import { ValidationPipe, Logger, VersioningType } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { IoAdapter } from '@nestjs/platform-socket.io';
import cookieParser from 'cookie-parser';
import helmet from 'helmet';
import compression from 'compression';

import { AppModule } from './app.module';
import { GlobalExceptionFilter } from '@common/filters/global-exception.filter';
import { LoggingInterceptor } from '@common/interceptors/logging.interceptor';
import { TransformInterceptor } from '@common/interceptors/transform.interceptor';

async function bootstrap() {
  const logger = new Logger('Bootstrap');

  const app = await NestFactory.create(AppModule, {
    logger: ['error', 'warn', 'log', 'debug'],
    bufferLogs: true,
  });

  const configService = app.get(ConfigService);
  const port = configService.get<number>('PORT', 3001);
  const nodeEnv = configService.get<string>('NODE_ENV', 'development');
  const frontendUrl = configService.get<string>('FRONTEND_URL', 'http://localhost:3000');

  // Security
  app.use(helmet({ contentSecurityPolicy: nodeEnv === 'production', crossOriginEmbedderPolicy: false }));
  app.enableCors({
    origin: nodeEnv === 'production' ? [frontendUrl] : [frontendUrl, 'http://localhost:3000', 'http://localhost:3001'],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'X-Request-ID'],
  });
  app.use(cookieParser());
  app.use(compression());

  // Validation
  app.useGlobalPipes(new ValidationPipe({
    whitelist: true,
    forbidNonWhitelisted: true,
    transform: true,
    transformOptions: { enableImplicitConversion: true },
  }));

  app.useGlobalFilters(new GlobalExceptionFilter());
  app.useGlobalInterceptors(new LoggingInterceptor(), new TransformInterceptor());

  // API Config
  app.enableVersioning({ type: VersioningType.URI, defaultVersion: '1', prefix: 'api/v' });
  app.setGlobalPrefix('api', { exclude: ['health', 'health/live', 'health/ready', 'webhooks/(.*)'] });
  app.useWebSocketAdapter(new IoAdapter(app));

  // Swagger
  if (nodeEnv !== 'production') {
    const swaggerConfig = new DocumentBuilder()
      .setTitle('SaaS AI Sales Assistant API')
      .setDescription('Enterprise-grade AI-powered Sales Assistant API')
      .setVersion('1.0')
      .addBearerAuth({ type: 'http', scheme: 'bearer', bearerFormat: 'JWT' }, 'JWT-auth')
      .build();
    const document = SwaggerModule.createDocument(app, swaggerConfig);
    SwaggerModule.setup('docs', app, document);
    logger.log(`📚 Swagger docs: http://localhost:${port}/docs`);
  }

  app.enableShutdownHooks();
  await app.listen(port, '0.0.0.0');

  logger.log('═══════════════════════════════════════════');
  logger.log(`🚀 SaaS AI Sales Assistant API`);
  logger.log('═══════════════════════════════════════════');
  logger.log(`📍 Environment: ${nodeEnv}`);
  logger.log(`🌐 Server: http://localhost:${port}`);
  logger.log(`❤️  Health: http://localhost:${port}/health`);
  logger.log('═══════════════════════════════════════════');
}

bootstrap().catch((error) => {
  console.error('❌ Failed to start:', error);
  process.exit(1);
});
