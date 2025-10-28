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
    .setDescription(`
# 🔍 Dustin Chain Block Explorer API

Dustin Chain의 블록체인 데이터를 조회하는 REST API입니다.

## 📌 주요 기능

### 1. 블록 조회 (Blocks)
- 최신 블록 목록 조회 (페이징)
- 블록 번호로 상세 조회
- 블록 해시로 상세 조회

### 2. 트랜잭션 조회 (Transactions)
- 트랜잭션 해시로 상세 조회
- Receipt 정보 포함 (성공/실패 상태, Gas 사용량 등)

### 3. 계정 조회 (Accounts)
- 지갑 주소로 실시간 잔액 조회
- DSTN 및 Wei 단위 지원
- 트랜잭션 개수 포함

## 🚀 기술 스택
- **Backend**: NestJS, TypeORM
- **Database**: PostgreSQL
- **Blockchain**: Dustin Chain (Custom PoS)

## 📖 단위 체계
- **DSTN**: Dustin Token (메인 단위)
- **Wei**: 최소 단위 (1 DSTN = 10^18 Wei)

## 🔗 관련 링크
- Dustin Chain RPC: http://localhost:3000
- Scanner Sync: http://localhost:4002
- Scanner Indexer: http://localhost:4001
    `)
    .setVersion('1.0.0')
    .addTag('블록 (Blocks)', '블록 정보 조회 API')
    .addTag('트랜잭션 (Transactions)', '트랜잭션 정보 조회 API')
    .addTag('계정 (Accounts)', '계정 정보 조회 API (실시간 RPC)')
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
