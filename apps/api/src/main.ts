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
      transform: true,
    }),
  );

  // Swagger 설정
  const config = new DocumentBuilder()
    .setTitle('Dustin Blockchain Explorer API')
    .setDescription('Dustin Chain의 블록체인 데이터를 조회하는 REST API입니다.')
    .setVersion('1.0.0')
    .addTag('블록 (Blocks)', '블록 정보 조회 API')
    .addTag('트랜잭션 (Transactions)', '트랜잭션 정보 조회 API')
    .addTag('계정 (Accounts)', '계정 정보 조회 API (실시간 RPC)')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, document);

  const port = process.env.API_PORT || 4000;
  await app.listen(port);
}

bootstrap();
