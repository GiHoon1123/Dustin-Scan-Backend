import { Controller, Get } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { HealthCheck, HealthCheckService, TypeOrmHealthIndicator } from '@nestjs/terminus';

@ApiTags('Health')
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
  @ApiOperation({ summary: '헬스체크' })
  @ApiResponse({ status: 200, description: '서비스 정상' })
  @ApiResponse({ status: 503, description: '서비스 장애' })
  check() {
    return this.health.check([
      // 데이터베이스 연결 확인
      () => this.db.pingCheck('database'),
    ]);
  }
}
