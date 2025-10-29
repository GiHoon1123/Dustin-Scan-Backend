# ==========================================
# Stage 1: Dependencies
# ==========================================
FROM node:20-alpine AS deps

WORKDIR /app

# 패키지 파일만 먼저 복사 (캐시 활용)
COPY package*.json ./
COPY .npmrc ./

# 프로덕션 의존성 설치
RUN npm ci --omit=dev && \
    npm cache clean --force

# ==========================================
# Stage 2: Builder
# ==========================================
FROM node:20-alpine AS builder

WORKDIR /app

# 패키지 파일 복사
COPY package*.json ./
COPY .npmrc ./

# 모든 의존성 설치 (devDependencies 포함)
RUN npm ci

# 소스 코드 복사
COPY . .

# TypeScript 빌드 (모든 앱 빌드)
RUN npm run build

# ==========================================
# Stage 3: Runner (Production)
# ==========================================
FROM node:20-alpine AS runner

WORKDIR /app

# 보안: non-root 유저 생성
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nestjs

# 프로덕션 의존성 복사
COPY --from=deps --chown=nestjs:nodejs /app/node_modules ./node_modules

# 빌드된 파일 복사 (전체 dist 디렉토리)
COPY --from=builder --chown=nestjs:nodejs /app/dist ./dist

# Shared 빌드 파일 복사 (런타임에 필요)
COPY --from=builder --chown=nestjs:nodejs /app/shared ./shared

# 패키지 파일 복사
COPY --from=builder --chown=nestjs:nodejs /app/package*.json ./

# nest-cli.json 복사 (경로 설정 필요)
COPY --from=builder --chown=nestjs:nodejs /app/nest-cli.json ./

# 디렉토리 권한 설정
RUN chown -R nestjs:nodejs /app

# non-root 유저로 전환
USER nestjs

# 포트 노출 (모든 앱 포트)
EXPOSE 4000 4001 4002

# 환경 변수 기본값
ENV NODE_ENV=production

# 헬스체크 (기본적으로 API 포트 체크, 환경변수로 변경 가능)
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
    CMD node -e "const port = process.env.HEALTHCHECK_PORT || '4000'; require('http').get('http://localhost:' + port, (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

# 기본 명령어 (오버라이드 가능)
# Kubernetes에서 command를 지정하여 실행할 앱 선택
# 예: ["node", "dist/apps/api/src/main"]
CMD ["node", "dist/apps/api/src/main"]

