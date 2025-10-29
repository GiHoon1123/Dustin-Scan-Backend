import { Controller, Get } from '@nestjs/common';
import { HealthCheck, HealthCheckService, TypeOrmHealthIndicator } from '@nestjs/terminus';

@Controller('health')
export class HealthController {
  constructor(
    private health: HealthCheckService,
    private db: TypeOrmHealthIndicator,
  ) {}

  /**
   * 헬스체크 엔드포인트
   * Kubernetes Liveness/Readiness Probe에서 사용
   */
  @Get()
  @HealthCheck()
  check() {
    return this.health.check([
      // 데이터베이스 연결 확인
      () => this.db.pingCheck('database'),
    ]);
  }
}
