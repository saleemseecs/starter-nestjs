import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import * as helmet from 'helmet';
import { Logger } from 'nestjs-pino';
import {CorsOptions} from "@nestjs/common/interfaces/external/cors-options.interface";

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Enable CORS with options
  const corsOptions: CorsOptions = {
    origin: true, // Allow all origins. You can set specific origins instead.
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE', // Set the allowed HTTP methods
    allowedHeaders: '*', // Set the allowed request headers
    exposedHeaders: '*', // Set the exposed response headers
    credentials: true, // Allow credentials (e.g., cookies, authorization headers)
  };
  app.enableCors(corsOptions);

  app.use(helmet());
  app.setGlobalPrefix('');

  const config = new DocumentBuilder()
      .setTitle('Apla')
      .setDescription('Apla')
      .setVersion('1.0')
      .addTag('api')
      .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('swagger', app, document);
  app.useLogger(app.get(Logger));

  app.listen(process.env.PORT, '0.0.0.0').then(() => {
    console.log('Listening from apla server on Host: ' + process.env.HOST + ' Port: ' + process.env.PORT);
  });
}

bootstrap();
