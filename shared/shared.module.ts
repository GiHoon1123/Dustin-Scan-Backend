import { Global, Module } from '@nestjs/common';
import { ChainClientModule } from './chain-client';

/**
 * 전역 공유 모듈
 *
 * @Global 데코레이터로 전역 모듈로 선언
 * 모든 앱에서 import 없이 사용 가능
 */
@Global()
@Module({
  imports: [ChainClientModule],
  exports: [ChainClientModule],
})
export class SharedModule {}
