import { Module } from '@nestjs/common';
import { UserService } from './user.service';
import { UserController } from './user.controller';
import { LoggerModule } from 'src/logger/logger.module';
import {TypeOrmModule} from "@nestjs/typeorm";
import {User} from "./entities/user.entity";
import { UtilsModule } from "../utils/utils.module";
import {UserRolesEntity} from "./entities/user-roles.entity";

@Module({
  imports: [TypeOrmModule.forFeature([User, UserRolesEntity]), LoggerModule, UtilsModule],
  controllers: [UserController],
  providers: [UserService],
  exports: [UserService],
})
export class UserModule {}
