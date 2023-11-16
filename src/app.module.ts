import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ScheduleModule } from '@nestjs/schedule';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';
import configuration from './config';
import { LoggerModule, PinoLogger } from 'nestjs-pino';
import { AuthModule } from './auth/auth.module';
import { UserModule } from './users/user.module';
import { UtilsModule } from "./utils/utils.module";
@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [configuration],
    }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => configService.get('database'),
      inject: [ConfigService],
    }),
    LoggerModule.forRootAsync({
      imports: [ConfigModule],
      // {fatal, error, warn, info, debug, trace}
      useFactory: async (configService: ConfigService) => ({
        pinoHttp: {
          safe: true,
          transport: {
            target: 'pino-pretty',
            options: {
              colorize: true,
              translateTime: 'SYS:standard',
              // ignore: 'hostname,pid, req.headers, res',
              ignore: 'pid,req,res',
              messageFormat: true, // --messageFormat
              singleLine: true, // --singleLine
              timestamp: `,"time":"${new Date(Date.now())}"`,
            },
          },
          level: process.env.PINO_LOG_LEVEL || 'info',
          // serializers: {
          //   req: (req) => ({
          //     id: req.id,
          //     method: req.method,
          //     url: req.url,
          //   }),
          // },

        },
      }),
      inject: [ConfigService],
    }),
    ScheduleModule.forRoot(),
    AuthModule,
    UserModule,
    UtilsModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
