// src/middleware.ts
import { INestApplication } from '@nestjs/common';
import { json, urlencoded } from 'express';

export const middlewares = (app: INestApplication) => {
  // Enable CORS for the application
  app.enableCors();

  // Parse incoming JSON requests with a maximum size limit
  app.use(json({ limit: '50mb' }));

  // Parse URL-encoded data with a maximum size limit
  app.use(urlencoded({ extended: true, limit: '50mb' }));
};
