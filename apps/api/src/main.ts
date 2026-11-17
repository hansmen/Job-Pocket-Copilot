import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // CORS: in Stage 4, for the web client, add specific origins instead of true.
  app.enableCors({ origin: true });

  const config = new DocumentBuilder()
    .setTitle('Job Pocket Copilot API')
    .setVersion('0.0.0')
    .addBearerAuth()
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('docs', app, document);
  // We generate the api-client for mobile and web from this JSON (see docs/02-architecture.md).
  SwaggerModule.setup('docs-json', app, document, { jsonDocumentUrl: 'openapi.json' });

  const port = Number(process.env.PORT ?? 3000);
  await app.listen(port);
  console.log(`API: http://localhost:${port}  ·  Swagger: http://localhost:${port}/docs`);
}

void bootstrap();
