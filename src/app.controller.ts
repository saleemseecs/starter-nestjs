import { Body, Controller, Get, Logger, Req, Res, UseGuards } from '@nestjs/common';
import { AppService } from './app.service';
import { AuthService } from './auth/auth.service';
import { JwtAuthGuard } from './auth/strategy/jwt-auth.guard';
import { RolesGuard } from './auth/strategy/roles.guard';
import { Roles } from './custom.decorator';
import { Role } from './users/enums/role.enum';
import { PinoLogger } from 'nestjs-pino';
import { LoggerService } from './logger/logger.service';
import { UserService } from './users/user.service';
@Controller()
export class AppController {
  constructor(
    // private readonly logger: LoggerService = new Logger(AppController.name),
    private readonly logger: PinoLogger,
    private readonly appService: AppService,
    private authService: AuthService,
    private userService: UserService,
  ) {
    logger.setContext(AppController.name);
  }

  @Get()
  getHello(): string {
    return this.appService.getProjectName();
  }

  @Get('/health-check')
  healthCheck(): string {
    return this.appService.healthCheck();
  }

  @Get('/authorization-check')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.SUPER_ADMIN)
  checkUserRole(@Req() req, @Res() res, @Body() body) {
    res.status(200).json(body);
  }
}
