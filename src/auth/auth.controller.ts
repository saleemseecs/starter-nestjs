import {
  Body,
  Controller,
  Get,
  HttpStatus,
  Post,
  Put,
  Req,
  Res,
  Headers,
  Delete,
  Patch,
  UseGuards,
  Query, HttpException, Param
} from '@nestjs/common';
import { UserService } from 'src/users/user.service';
import { AuthService } from './auth.service';
import {CreateUserDTO} from "../users/dto/user.dto";
import {RolesGuard} from "./strategy/roles.guard";
import {JwtAuthGuard} from "./strategy/jwt-auth.guard";
import {Roles} from "../custom.decorator";
import {Role} from "../users/enums/role.enum";
import { AuthGuard } from "@nestjs/passport";

@Controller()
export class AuthController {
  constructor(private authService: AuthService, private userService: UserService) {}

  @Post('login')
  async login(@Req() req, @Res() res, @Body() body) {
    const auth = await this.authService.login(body, res);
    res.status(auth.status).json(auth.msg);
  }
  @Get('logout')
  // @UseGuards(AuthGuard())
  async logout(@Body() createUserDto: CreateUserDTO, @Res() res): Promise<void> {
    let result = await this.authService.logout(res, createUserDto);
    res.status(result.status).json(result.msg);

    // Optionally, redirect the user to the login page or any other desired location
    // res.redirect('/login');
  }
  @Post('auth/new')
  async register(@Body() createUserDto: CreateUserDTO, @Res() res) {
    const auth = await this.authService.register(createUserDto, res);
    res.status(auth.status).json(auth.content);
  }
  // @Post('auth/signup')
  // async signUp(@Body() createUserDto: CreateUserDTO, @Res() res) {
  //   const result = await this.authService.signUp(createUserDto);
  //   res.status(HttpStatus.OK).json(result);
  // }
  // @Post('auth/confirmSignUp')
  // async confirmSignUp(@Body() createUserDto: CreateUserDTO, @Res() res) {
  //   const result = await this.authService.confirmSignUp(createUserDto.username, createUserDto.code , res);
  //   res.status(HttpStatus.OK).json(result);
  // }
  // @Post('auth/signIn')
  // async signIn(@Body() createUserDto: CreateUserDTO, @Res() res) {
  //   const result = await this.authService.signIn(createUserDto.username, createUserDto.password, res);
  //   res.status(HttpStatus.OK).json(result);
  // }
  // @Post('auth/resendConfirmationCode')
  // async resendConfirmationCode(@Body() createUserDto: CreateUserDTO, @Res() res) {
  //   const result = await this.authService.resendConfirmationCode(createUserDto.username, res);
  //   res.status(HttpStatus.OK).json(result);
  // }
  // @Post('auth/updatePassword')
  // async updatePassword(@Body() createUserDto: CreateUserDTO, @Res() res) {
  //   const result = await this.authService.updatePassword(createUserDto.code, createUserDto.username, createUserDto.password, res);
  //   res.status(HttpStatus.OK).json(result);
  // }
  // @Post('auth/adminUpdatePassword')
  // async adminUpdatePassword(@Body() createUserDto: CreateUserDTO, @Res() res) {
  //   const result = await this.authService.adminUpdatePassword(createUserDto.username, createUserDto.password);
  //   res.status(HttpStatus.OK).json(result);
  // }
  // @Post('auth/forgotPassword')
  // async forgotPassword(@Body() createUserDto: CreateUserDTO, @Res() res) {
  //   const result = await this.authService.forgotPassword(createUserDto.username, res);
  //   res.status(HttpStatus.OK).json(result);
  // }
  // @Post('auth/signOut')
  // async signOut(@Body() createUserDto: CreateUserDTO, @Res() res) {
  //   const result = await this.authService.signOut(createUserDto.username, res);
  //   res.status(HttpStatus.OK).json(result);
  // }
  // @Post('auth/removeUser')
  // async removeUser(@Body() createUserDto: CreateUserDTO, @Res() res) {
  //   const result = await this.authService.removeUser(createUserDto.username, res);
  //   res.status(HttpStatus.OK).json(result);
  // }
  // @Post('auth/bulkSignup')
  // async bulkSignUp(@Body() createUserDTOs: CreateUserDTO[], @Res() res) {
  //   try {
  //     const result = await this.authService.bulkSignup(createUserDTOs);
  //     res.status(HttpStatus.OK).json(result);
  //   }catch (e) {
  //     res.status(e.status).json(e);
  //   }
  // }
  // @Get('auth/getAllUsers/:tenantId')
  // async getAllUsers(@Param('tenantId') tenantId: string, @Res() res) {
  //   try {
  //     if (!tenantId) {
  //       throw new HttpException('Missing tenantId query parameter.', HttpStatus.BAD_REQUEST);
  //     }
  //     const result = await this.authService.getAllUsers(tenantId);
  //     res.status(HttpStatus.OK).json(result);
  //   } catch (e) {
  //     res.status(e.status || HttpStatus.INTERNAL_SERVER_ERROR).json({ message: e.message });
  //   }
  // }
  // // @UseGuards(JwtAuthGuard, RolesGuard)
  // // @Roles(Role.SUPER_ADMIN)
  // // @UseGuards(RolesGuard)
  // @Patch('auth/updateUser')
  // async updateUser(@Body() createUserDto: CreateUserDTO, @Headers('Authorization') authorizationHeader: string, @Res() res) {
  //   const token = this.extractTokenFromHeader(authorizationHeader);
  //   const result = await this.authService.updateUser(createUserDto.username, createUserDto, token);
  //   res.status(HttpStatus.OK).json(result);
  // }
  // @Delete('auth/deleteUser')
  // async deleteUser(@Body() createUserDto: CreateUserDTO, @Headers('Authorization') authorizationHeader: string, @Res() res) {
  //   // const token = this.extractTokenFromHeader(authorizationHeader);
  //   const result = await this.authService.deleteUser(createUserDto.username);
  //   res.status(HttpStatus.OK).json({result});
  // }
// Helper method to extract the token from the Authorization header
  private extractTokenFromHeader(authorizationHeader: string): string {
    // The Authorization header typically has the format "Bearer <token>"
    // Extract the token part after "Bearer "
    const token = authorizationHeader?.split(' ')[1];
    return token;
  }
}
