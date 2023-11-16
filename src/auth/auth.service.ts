import {HttpStatus, Injectable, Logger, NotFoundException, Res} from "@nestjs/common";
import { JwtService } from '@nestjs/jwt';
import bcryptjs from 'bcryptjs';
import {CreateUserDTO, UserDTO} from 'src/users/dto/user.dto';
import { validate } from 'class-validator';
import { LoggerService } from 'src/logger/logger.service';
import { UserService } from 'src/users/user.service';
import { PinoLogger } from 'nestjs-pino';
import {promisify} from "util";
import {randomBytes, scrypt} from "crypto";
import { compareSync } from 'bcrypt';
import * as bcrypt from 'bcryptjs';
import { HttpException } from '@nestjs/common';
import {
  ListUsersCommand,
  CognitoIdentityProviderClient,
  AdminGetUserCommand
} from '@aws-sdk/client-cognito-identity-provider';

import { CognitoUserPool, CognitoUser, AuthenticationDetails } from 'amazon-cognito-identity-js';
import { Auth, Amplify } from 'aws-amplify';
import * as AWS from 'aws-sdk';
import {ListUsersRequest} from "aws-sdk/clients/iam";
import {AuthGuard} from "@nestjs/passport";
import {RolesGuard} from "./strategy/roles.guard";
import {CognitoIdentityServiceProvider} from "aws-sdk";
import { log } from "console";
import { User } from "../users/entities/user.entity";
import {DataSource, IsNull, Repository, UpdateResult} from "typeorm";
import { isEmpty, merge } from "lodash";
import { LoggedInStatusEnum } from "../users/enums/role.enum";

export enum PasswordAlgorithm {
  BCRYPT = 'bcrypt',
}
@Injectable()
export class AuthService {
  private readonly cognitoISP: AWS.CognitoIdentityServiceProvider;
  constructor(
    // private readonly logger: LoggerService = new Logger(AuthService.name),
    private readonly logger: PinoLogger,

    private jwtService: JwtService,
    private userService: UserService,
    private dataSource: DataSource,

  ) {
    Amplify.configure({
      Auth: {
        region: 'us-east-2',
        userPoolId: process.env.AWS_COGNITO_USER_POOL_ID,
        userPoolWebClientId: process.env.AWS_COGNITO_CLIENT_ID,
      },
    });
    AWS.config.update({
      accessKeyId: process.env.AWS_ACCESS_KEY, //'YOUR_ACCESS_KEY_ID',
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,//'YOUR_SECRET_ACCESS_KEY',
      region: 'us-east-2', // Replace with your desired region
    });
     this.cognitoISP = new AWS.CognitoIdentityServiceProvider({region: 'us-east-2'});

  }
  private userPoolId = process.env.AWS_COGNITO_USER_POOL_ID;
  private clientId = process.env.AWS_COGNITO_CLIENT_ID;
  private poolData = {
    UserPoolId: this.userPoolId,
    ClientId: this.clientId,
    region: 'us-east-2'
  };

  async verifyToken(token: string): Promise<  any  | string> {
    try {
      console.log('tokentokentokentokentoken', token)
      // Verify and decode the token using the JwtService
      const decodedToken = this.jwtService.decode(token);
      console.log('decodedTokendecodedTokendecodedToken ', decodedToken)

      // Return the decoded token (which contains the user's identity)
      return decodedToken;
    } catch (err) {
      // If token verification fails, return null or handle the error as needed
      return null;
    }
  }

  async login(user: any, @Res() res): Promise<Record<string, any>> {
    // Validation Flag
    let isOk = false;

    // Transform body into DTO
    const userDTO = new UserDTO();
    userDTO.password = user.password;

    // TODO: Refactor this section with try catch block and return error message in the catch block
    // Validate DTO against validate function from class-validator
    await validate(userDTO).then((errors) => {
      if (errors.length > 0) {
        this.logger.debug(`${errors}`);
      } else {
        isOk = true;
      }
    });

    if (isOk) {
      // Get user information
      const userDetails = await this.userService.findOne(user.username);
      // Check if the given username match with saved username
      if(userDetails==undefined || userDetails?.username!=user?.username){
        return { status: HttpStatus.OK, msg: { error: 'Incorrect username' } };
      }
      const isValid = await this.passwordVerify(user.password, userDetails.password);
      if (isValid) {
        // const expiration = new Date(Date.now() + (365 * 24 * 60 * 60 * 1000)); // one year in the future
        const expiration = new Date();
        expiration.setFullYear(expiration.getFullYear() + 1);
        const cookieOptions = {
          expires: expiration,
          path: '/',
          domain: '',
          httpOnly: true,
          secure: true,
        };
        // Generate JWT token
        // let token =  this.jwtService.sign({ username: user.username }, {expiresIn: '1y'});
        const token = randomBytes(64).toString('hex');
        let updatedUser: any = await this.userService.updateUserToken({id: userDetails.id, cookieToken: token, currentStatus: LoggedInStatusEnum.LOGGED_IN}, res);
        console.log(updatedUser.cookieToken)
        res.cookie('zgAuth', token, cookieOptions);
        res.cookie('zgAuth-user', userDetails.username, cookieOptions);
        const returnObj = {
          status: 'success',
          username: userDetails.username,
          token,
          expires: expiration,
        };
        return {
          status: HttpStatus.OK,
          msg: {
            ...returnObj,
          },
        };
      } else {
        // Password or username does not match
        return { status: HttpStatus.OK, msg: { error: 'Incorrect password.' } };
      }
    } else {
      return { status: HttpStatus.OK, msg: { error: 'Invalid fields.' } };
    }
  }
  async logout(@Res() res, createUserDto: CreateUserDTO): Promise<Record<string, any>> {
    try {
      const userDetails = await this.userService.findOne(createUserDto.username);
      // Check if the given username match with saved username
      if(userDetails==undefined || userDetails?.username!=createUserDto?.username){
        return { status: HttpStatus.OK, msg: { error: 'Incorrect username' } };
      }
      // Clear the authentication-related cookies
      res.clearCookie('zgAuth');
      res.clearCookie('zgAuth-user');

      // You may want to perform additional cleanup, such as updating the user record in the database
      // to invalidate the token or perform any other necessary tasks.
      let updatedUser: any = await this.userService.updateUserToken({id: userDetails.id, cookieToken: null, currentStatus: LoggedInStatusEnum.LOGGED_OUT}, res);

      this.logger.info('User logged out successfully.');
      return { status: HttpStatus.OK, msg: 'Logged out successfully!' };

    } catch (error) {
      this.logger.error('Error during logout:', error);
      return { status: HttpStatus.OK, msg: { error: error } };
      // throw error;
    }
  }

   async register(createUserDto: any, @Res() res): Promise<Record<string, any>> {
    this.logger.info('register: request: %o', createUserDto)
    // Validation Flag
    let isOk = false;
    createUserDto.password = await this.hash(createUserDto.password, 1);
    // Validate DTO against validate function from class-validator
    await validate(createUserDto).then((errors) => {
      if (errors.length > 0) {
        this.logger.debug(`${errors}`);
      } else {
        isOk = true;
      }
    });
    if (isOk) {
      createUserDto.role = createUserDto?.role?.id;
      let result = await this.userService.create(createUserDto).catch((error) => {
        this.logger.debug(error.message);
        isOk = false;
      });
      if (isOk) {
        return { status: 201, content:  'Successfully Inserted'  };
      } else {
        return { status: 400, content:  'User already exists Or input is invalid'  };
      }
    } else {
      return { status: 400, content:  'Invalid content'  };
    }
  }

  async passwordVerify(password: string, hash: string): Promise<boolean> {
    //this.logger.info('passwordVerify=>Password is: %o', password)
    this.logger.info('passwordVerify=>Hash is: %o', hash)
    const isMatch: boolean = await bcrypt.compare(password, hash);
    this.logger.info('passwordVerify=>isMatch: %o', isMatch)
    return isMatch;
  }
  async  hash(password: string, algo: number, options: { cost: number } = { cost: 10 }): Promise<string> {
    let hash: string = '';
    switch (algo) {
      case 1:
        const salt = await bcrypt.genSalt(options.cost);
        hash = await bcrypt.hash(password, salt);
        break;
      default:
        throw new Error(`Unknown password hashing algorithm: ${algo}`);
    }
    return hash;
  }
  // This hashing function has been implemented exactly as in PHP code. Exact logic has been implemented.
  async hash_php_converted(password: string, algo: number, options: any = {}): Promise<string>  {
    // if (!crypto.getHashes().includes(`bcrypt${algo}`)) {
    //   throw new Error(`Invalid algorithm: ${algo}`);
    // }

    if (typeof password !== 'string') {
      throw new Error('Password must be a string');
    }

    let {cost = 10, salt} = options;

    let hashFormat: string, requiredSaltLen: number, rawSaltLen: number;

    switch (algo) {
      case 1: // PASSWORD_BCRYPT
        rawSaltLen = 16;
        requiredSaltLen = 22;
        hashFormat = `$2y$${cost.toString()}$`;
          // hashFormat = '$2y$10$';
        this.logger.info('Hash format is: %o', hashFormat);
        this.logger.info('Hash format length is: %o', hashFormat.length);
        break;

      default:
        throw new Error(`Unknown algorithm: ${algo}`);
    }

    let generatedSalt: string;
    if (typeof salt === 'string') {
      this.logger.info('Given salt is: %o', salt);

      if (salt.length < requiredSaltLen) {
        throw new Error(`Provided salt is too short: ${salt.length}, expecting ${requiredSaltLen}`);
      } else if (!/^[a-zA-Z0-9./]+$/.test(salt)) {
        salt = salt.replace(/\+/g, '.').replace(/=/g, '');
      }
      generatedSalt = salt.substring(0, requiredSaltLen);
    } else {

      const buffer: Buffer = randomBytes(rawSaltLen);
      generatedSalt = buffer.toString('base64').replace(/\+/g, '.').replace(/=/g, '').substring(0, requiredSaltLen);
      generatedSalt = generatedSalt.replace(/\$/g, 'm');

      this.logger.info('Created a new salt: %o', generatedSalt);
      this.logger.info('Created salt length: %o', generatedSalt.length);
    }

    const hash = hashFormat + generatedSalt;
    console.log('New hash is: ', hash);
    console.log('New hash length is: ', hash.length);
    let result = await bcrypt.hash(password, hash);
    console.log('res: ', result)
    return result.length > 13 ? result : null;
  }
}



