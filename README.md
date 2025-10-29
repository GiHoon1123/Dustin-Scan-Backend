# Dustin-Scan-Backend

Dustin Chain 블록체인 탐색기 백엔드 - NestJS 모노레포

## 📁 프로젝트 구조

```
Dustin-Scan-Backend/
├── apps/                       # 실행 가능한 애플리케이션들
│   ├── api/                    # 🌐 REST API 서버 (포트: 4000)
│   ├── indexer/                # ⚙️ 블록 인덱싱 서버 (포트: 4001)
│   └── sync/                   # 🔄 체인 동기화 서버 (포트: 4002)
│
├── shared/                     # 공유 라이브러리
│   ├── shared.module.ts        # 🔧 전역 공유 모듈 (@Global)
│   ├── common/                 # 📦 공통 유틸, 타입, 상수
│   ├── database/               # 💾 DB 엔티티, 리포지토리 (TypeORM + PostgreSQL)
│   └── chain-client/           # 🔗 Dustin-Chain RPC 클라이언트
│
├── config/                     # 설정 파일
├── docker/                     # Docker 관련 파일
├── scripts/                    # 스크립트
├── package.json                # 의존성 (Dustin-Chain과 동일 버전)
├── nest-cli.json               # NestJS 모노레포 설정
├── tsconfig.json               # TypeScript 설정
└── .env.example                # 환경변수 예시
```

## 🚀 실행 방법

```bash
# 의존성 설치
npm install

# 개발 모드
npm run start:dev              # 전체 실행 (API + Indexer + Sync)
npm run start:dev:api          # API만
npm run start:dev:indexer      # Indexer만
npm run start:dev:sync         # Sync만

# 프로덕션
npm run start:prod             # 전체 실행
npm run start:prod:api         # API만
npm run start:prod:indexer     # Indexer만
npm run start:prod:sync        # Sync만

# 빌드
npm run build                  # 전체 빌드

# 테스트
npm test                       # 전체 테스트
npm run test:api               # API만 테스트
npm run test:indexer           # Indexer만 테스트
npm run test:sync              # Sync만 테스트
npm run test:libs              # 공유 라이브러리만 테스트
npm run test:watch             # Watch 모드
npm run test:cov               # 커버리지

# 데이터베이스
npm run db:migration:generate  # 마이그레이션 생성
npm run db:migration:run       # 마이그레이션 실행
npm run db:migration:revert    # 마이그레이션 롤백

# 코드 품질
npm run lint                   # ESLint
npm run format                 # Prettier
```

## 📦 모듈 구성

### API Server (apps/api) - Port 4000

- `/blocks` - 블록 조회
- `/transactions` - 트랜잭션 조회
- `/accounts` - 계정 조회
- `/stats` - 통계 조회
- Swagger: `http://localhost:4000/api-docs`

### Indexer (apps/indexer) - Port 4001

- 블록 처리 및 파싱
- 트랜잭션 인덱싱
- 잔액 업데이트

### Sync (apps/sync) - Port 4002

- 체인 동기화
- Reorg 처리
- 누락 블록 재동기화

## 🗄️ 데이터베이스

PostgreSQL 사용

- `blocks` - 블록 정보
- `transactions` - 트랜잭션
- `accounts` - 계정
- `balances` - 잔액 히스토리
- `stats` - 통계
# Test deployment with GitHub-hosted runner
# Deployment test with t3.small and new IP
