import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import helmet from 'helmet';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Security
  app.use(
    helmet({
      // Allow dashboards (different localhost ports) to load uploaded images/assets.
      crossOriginResourcePolicy: { policy: 'cross-origin' },
    }),
  );
  const isDev = process.env.NODE_ENV !== 'production';
  app.enableCors({
    // Local Flutter web uses random ports; allow all origins in development only
    origin: isDev
      ? true
      : process.env.CORS_ORIGINS?.split(',').filter(Boolean) || ['http://localhost:3003'],
    credentials: true,
  });

  // Global prefix
  app.setGlobalPrefix('api');

  // Validation
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: { enableImplicitConversion: true },
    }),
  );

  // Swagger API docs
  if (process.env.NODE_ENV !== 'production') {
    const config = new DocumentBuilder()
      .setTitle('UCLICK-Y API')
      .setDescription('Hotel Booking Platform API')
      .setVersion('1.0')
      .addBearerAuth()
      .build();
    const document = SwaggerModule.createDocument(app, config);
    SwaggerModule.setup('api/docs', app, document);
  }

  const port = process.env.PORT || 3000;
  // Bind to all interfaces so physical devices on LAN can reach it (iPhone/Android).
  await app.listen(port, '0.0.0.0');
  console.log(`🚀 UCLICK-Y Backend running on port ${port}`);
  console.log(`📚 API Docs: http://localhost:${port}/api/docs`);
}
bootstrap();
