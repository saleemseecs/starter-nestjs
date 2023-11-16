import { Body, Injectable, Req, Res } from '@nestjs/common';

@Injectable()
export class AppService {
  getProjectName(): string {
    return 'APLA Server is up and running';
  }

  healthCheck(): string {
    return JSON.stringify({
      message: 'up',
    });
  }
}
