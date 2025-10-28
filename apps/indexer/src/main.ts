import { NestFactory } from '@nestjs/core';
import { IndexerAppModule } from './indexer-app.module';

async function bootstrap() {
  const app = await NestFactory.create(IndexerAppModule);

  const port = process.env.INDEXER_PORT || 4001;
  await app.listen(port);

  console.log(`
    ⚙️  Indexer Server is running on: http://localhost:${port}
    🔍 Monitoring blockchain for new blocks...
  `);
}

bootstrap();
