import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { middlewares } from './middleware';
import { Logger } from '@nestjs/common'; // Import the built-in Logger
import { swagger } from './swagger.config';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Create a logger instance
  const logger = new Logger('NestApplication'); // You can name this 'Bootstrap' or something else based on the context

  // Initialize Swagger
  swagger(app);

  // Apply custom middlewares
  middlewares(app);

  const PORT = Number(process.env.PORT) || 3000;
  const HOST = process.env.HOST || 'localhost'; // Fixed HOST issue (you were using PORT here instead of HOST)

  // Log the server starting message
  await app.listen(PORT);

  // Using logger from NestJS
  logger.log(`Application is running on: http://${HOST}:${PORT}`);
  logger.error('Something went wrong!');
  logger.warn('This is a warning.');
  logger.debug('Debug information.');
  logger.verbose('Verbose output.');
}

bootstrap();
