import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    // TODO: 여기에 모듈 추가
  ],
  controllers: [],
})
export class ApiAppModule {}
