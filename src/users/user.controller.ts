import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseFilters,
  HttpException,
  BadRequestException, Put, Res
} from '@nestjs/common';
import { UserService } from './user.service';
import { UserDTO, CreateUserDTO } from './dto/user.dto';
import {PinoLogger} from "nestjs-pino";

@Controller()
export class UserController {
  constructor(
      private readonly usersService: UserService,
      private readonly logger: PinoLogger,
) {
    logger.setContext(UserController.name);
  }

  @Post('users/new')
  createUser(@Body() createUserDto: CreateUserDTO, @Res() res) {
    try {
      this.logger.trace('Controller=>createUser=>Request: %o', createUserDto);
      return this.usersService.createUser(createUserDto, res);
    } catch (e) {
      this.logger.error('Controller=>createUser=>Error: %o', e);
      throw new BadRequestException();
    }
  }

  @Get('users')
  getUsers(@Res() res) {
    this.logger.trace('Controller=>getUsers=>Request');
    return this.usersService.getUsers(res);
  }

  @Get('users/:username')
  getUser(@Param('username') username: string, @Res() res) {
    this.logger.trace('Controller=>getUser=>request: %o', username);
    return this.usersService.getUser(username, res);
  }

  @Put('users')
  updateUser(@Body() updateUserDto: UserDTO, @Res() res) {
    this.logger.trace('Controller=>updateUser=>Request: %o', updateUserDto);
    return this.usersService.updateUser(updateUserDto, res);
  }

  @Delete('users/:id')
  deleteUser(@Param('id') id: string, @Res() res) {
    this.logger.trace('Controller=>deleteUser=>Requested Id: %o', id);
    return this.usersService.deleteUser(+id, res);
  }
  @Post('users/check')
  // checkUser(@Param('username') username: string, @Res() res) {
  checkUser(@Body() userDto: UserDTO, @Res() res) {
    this.logger.trace('Controller=>checkUser=>request: %o', userDto);
    return this.usersService.checkUser(userDto, res);
  }

  // Helper functions
  getUserById(@Param('id') id: string) {
    this.logger.trace('Controller=>getUserById=>request: %o', id);
    return this.usersService.getUserById(id);
  }


  // User roles related APIs
  @Get('userRoles')
  getUserRoles(@Res() res) {
    this.logger.trace('Controller=>getUserRoles=>Request');
    return this.usersService.getUserRoles(res);
  }

  @Get('userRoles/:username')
  getUserRole(@Param('username') username: string, @Res() res) {
    this.logger.trace('Controller=>getUserRole=>request: %o', username);
    return this.usersService.getUserRole(username, res);
  }
}
