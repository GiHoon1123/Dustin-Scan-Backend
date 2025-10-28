import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { ApiAppModule } from './api-app.module';

async function bootstrap() {
  const app = await NestFactory.create(ApiAppModule);

  // CORS 설정
  app.enableCors();

  // Validation Pipe 전역 설정
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  // Swagger 설정
  const config = new DocumentBuilder()
    .setTitle('Dustin Blockchain Explorer API')
    .setDescription('Dustin Chain Block Explorer REST API')
    .setVersion('1.0')
    .addTag('blocks')
    .addTag('transactions')
    .addTag('accounts')
    .addTag('stats')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api-docs', app, document);

  const port = process.env.API_PORT || 4000;
  await app.listen(port);

  console.log(`
    🚀 API Server is running on: http://localhost:${port}
    📚 Swagger Docs: http://localhost:${port}/api-docs
  `);
}

bootstrap();
