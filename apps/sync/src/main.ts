import { NestFactory } from '@nestjs/core';
import { SyncAppModule } from './sync-app.module';

export async function bootstrap() {
  const app = await NestFactory.create(SyncAppModule);

  const port = process.env.SYNC_PORT || 4002;
  await app.listen(port);

  console.log(`
    🔄 Sync Server is running on: http://localhost:${port}
    🔗 Synchronizing with Dustin Chain...
  `);
}

if (require.main === module) {
  bootstrap();
}
