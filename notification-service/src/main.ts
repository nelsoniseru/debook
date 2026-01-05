import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Logger } from '@nestjs/common';

async function bootstrap() {
  const logger = new Logger('Bootstrap');
  
  logger.log('Starting application bootstrap...');
  
  const app = await NestFactory.create(AppModule, {
    logger: ['log', 'error', 'warn', 'debug', 'verbose']
  });
  
  const configService = app.get(ConfigService);
  const nodeEnv = configService.get('NODE_ENV', 'development');
  
  logger.log(`Application environment: ${nodeEnv}`);
  logger.debug('Setting up global configurations...');

  app.setGlobalPrefix('api/v1');
  logger.log('Global API prefix set to: api/v1');
  
  app.useGlobalPipes(new ValidationPipe({ whitelist: true }));
  logger.log('Global validation pipe enabled with whitelist');
  
  app.enableCors();
  logger.log('CORS enabled');

  const port = configService.get<number>('PORT', 3001);
  logger.log(`Server configured to run on port: ${port}`);
  
  logger.log('Starting server...');
  await app.listen(port);
  
  logger.log(`Application is running on: http://localhost:${port}/api/v1`);
  logger.log(`Environment: ${nodeEnv}`);
  
  if (nodeEnv === 'development') {
    logger.debug('Development mode - debug logging enabled');
  }
}

bootstrap().catch(error => {
  const logger = new Logger('Bootstrap');
  logger.error('Failed to bootstrap application:', error);
  process.exit(1);
});