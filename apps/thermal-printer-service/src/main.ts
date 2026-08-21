import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import type { NestExpressApplication } from '@nestjs/platform-express';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';

async function bootstrap() {
  const port = Number(process.env.PORT);
  if (!Number.isInteger(port) || port < 1 || port > 65_535) {
    throw new Error('PORT must be set to an integer between 1 and 65535.');
  }

  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  app.enableCors({
    origin: process.env.CLIENT_ORIGIN
      ? process.env.CLIENT_ORIGIN.split(',').map((origin) => origin.trim())
      : true,
    methods: ['GET', 'POST'],
    allowedHeaders: ['Content-Type'],
  });
  app.useBodyParser('text', {
    type: ['text/markdown', 'text/plain'],
    limit: '100kb',
  });
  app.setGlobalPrefix('api');
  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
      whitelist: true,
      forbidNonWhitelisted: true,
    }),
  );

  const swaggerConfig = new DocumentBuilder()
    .setTitle('Thermal Printer Service')
    .setDescription(
      'API do konfiguracji i drukowania na drukarce BisOffice POS-8370 przez LAN lub USB.',
    )
    .setVersion('1.0.0')
    .addTag('printer', 'Stan i możliwości drukarki')
    .addTag('configuration', 'Konfiguracja POS-8370')
    .addTag('printing', 'Drukowanie tekstu, Markdown, bitmap i surowych komend')
    .build();
  const document = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('docs', app, document, {
    jsonDocumentUrl: 'openapi.json',
    customSiteTitle: 'Thermal Printer Service API',
  });

  await app.listen(port);
}
void bootstrap();
