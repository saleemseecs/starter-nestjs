import {
  HttpStatus,
  Injectable,
  Res,
} from '@nestjs/common';
import { UserDTO, CreateUserDTO } from './dto/user.dto';
import { PinoLogger } from 'nestjs-pino';
import {InjectRepository} from "@nestjs/typeorm";
import {DataSource, IsNull, Repository, UpdateResult} from "typeorm";
import {User} from "./entities/user.entity";
import { isEmpty, merge } from "lodash";
import { QueryCommand } from "typeorm/commands/QueryCommand";
import { UtilsService } from "../utils/utils.service";
import {UserRolesDTO} from "./dto/user-roles.dto";
import {UserRolesEntity} from "./entities/user-roles.entity";

@Injectable()
export class UserService {
  constructor(
    private readonly logger: PinoLogger,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(UserRolesEntity)
    private readonly userRolesRepository: Repository<UserRolesEntity>,
    private utilsService: UtilsService,
    private dataSource: DataSource
  )
  {
    logger.setContext(UserService.name);
  }

  async createUser(createUserDto: CreateUserDTO, @Res() res): Promise<void> {
    try {
      createUserDto.createdAt = new Date();
      this.logger.info('Service=>createUser=>Request: %o', createUserDto);
      let user: User = await this.userRepository.save(createUserDto);
      this.logger.info('Service=>createUser=>Result: %o', user);
      res.status(HttpStatus.OK).json("Successfully Inserted");
    } catch (e) {
      console.error(e);
      this.logger.error('Service=>createUser=>Error: %o', e.sqlMessage);
      res.status(HttpStatus.OK).json(e.sqlMessage); // send error message to client
    }
  }

  async getUsers(@Res() res): Promise<void> {
    try {
      this.logger.info('Service=>getUsers=>Request');
      let query = {where: {deleted_at: IsNull()}}
      let users: User[] = await this.userRepository.find({
        ...query
      });
      if(isEmpty(users)){
        return res.status(HttpStatus.OK).json("No Users found"); // send error message to client
      }
      let result = await this.utilsService.convertNumericToString(users);
      result = await this.utilsService.formatDate(result);
      this.logger.debug('Service=>getUsers=>Result: %o', result);
      res.status(HttpStatus.OK).json(result);
    } catch (e) {
      console.error(e);
      this.logger.error('Service=>getUsers=>Error: %o', e);
      res.status(HttpStatus.OK).json(e.sqlMessage); // send error message to client
    }
  }

  async getUser(username: string, @Res() res): Promise<void> {
    try {
      this.logger.info('Service=>getUser=>Input: %o', username);
      let user: User = await this.userRepository.findOne({
        select :['id','username', 'firstName', 'lastName', 'email'],
        where :{
          username: username,
          deleted_at: null
        },
      });
      if(isEmpty(user)){
        res.status(HttpStatus.OK).json(`User ${username} not found.`); // send error message to client
      }
      let result = await this.utilsService.convertNumericToString(user);
      result = await this.utilsService.formatDate(result);
      this.logger.info('Service=>getUser=>Result: %o', result);
      res.status(HttpStatus.OK).json(result);
    } catch (e) {
      console.error(e);
      this.logger.error('Service=>getUser=>Error: %o', e);
      res.status(HttpStatus.OK).json(e.sqlMessage); // send error message to client
    }
  }

  async updateUser(updateUserDto: UserDTO, @Res() res) {
    try {
      this.logger.info('Service=>updateUser=>Input: %o', UserDTO);

      let result: UpdateResult = await this.userRepository.update(updateUserDto.id, updateUserDto);
      if(isEmpty(result)){
        res.status(HttpStatus.OK).json(`Error: User not updated.`);
      }
      this.logger.info('Service=>updateUser=>Result: %o', result);

      if(result.affected>0){
        res.status(HttpStatus.OK).json(`Successfully Updated`);
      } else {
        res.status(HttpStatus.OK).json(`Error: User not updated.`);
      }
    } catch (e) {
      console.error(e);
      this.logger.error('Service=>updateUser=>Error: %o', e);
      res.status(HttpStatus.OK).json(e.sqlMessage); // send error message to client
    }
  }

  async deleteUser(id: number, @Res() res): Promise<void> {
    try {

        this.logger.error('Service=>deleteUser=>Record not added in history table, cannot soft delete user with id: %o', id);
        res.status(HttpStatus.OK).json("Error deleting user");
    } catch (e) {
      console.error(e);
      res.status(HttpStatus.OK).json(e.sqlMessage); // send error message to client
    }
  }
  async checkUser(userDTO: any, @Res() res): Promise<void> {
    try {
      this.logger.info('Service=>checkUser=>Input: %o', userDTO);
      let user: User = await this.userRepository.findOne({
        where :{
          username: userDTO.username,
          cookieToken: userDTO.token,
          deleted_at: null
        },
      });
      if(isEmpty(user)){
        this.logger.info('User not found in db');
        let errorObj = {
          "status": "error",
          "error": 1,
          "message": "invalid token"
        }
        res.status(HttpStatus.OK).json(errorObj);
        return ;
      }
      this.logger.info('Service=>getUser=>Result: %o', user);
      res.status(HttpStatus.OK).json({
        "status": "success",
        // "role": user?.role.toString()
      });
    } catch (e) {
      console.error(e);
      this.logger.error('Service=>checkUser=>Error: %o', e);
      res.status(HttpStatus.OK).json(e.sqlMessage); // send error message to client
    }
  }

  // These are just internal helper functions, not exposed to the client
  async getUserById(id: string): Promise<User> {
    try {
      this.logger.info('Service=>getUserById=>Input: %o', id);
      let user: User = await this.userRepository.findOne({
        where :{
          id: id,
          deleted_at: null
        },
      });
      if(isEmpty(user)){
        return null;
      }
      this.logger.info('Service=>getUserById=>Result: %o', user);
      return user;
    } catch (e) {
      console.error(e);
      this.logger.error('Service=>getUserById=>Error: %o', e);
      return null;
    }
  }


  async create(createUserDto: CreateUserDTO): Promise<User> {
    this.logger.info('Creating user with info: %o', createUserDto);
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();
    try {
      createUserDto.createdAt = new Date();
      const user = queryRunner.manager.create(User, createUserDto);
      await queryRunner.manager.save(user);
      await queryRunner.commitTransaction();
      return user;
    } catch (err) {
      await queryRunner.rollbackTransaction();
      throw err; // You can rethrow the error to handle it in the caller function
    } finally {
      await queryRunner.release();
    }
  }
  async findAll(): Promise<User[]> {
    return this.userRepository.find();
  }

  findOne(username: string): Promise<User> {
    return this.userRepository.findOne({
      where :{
        username: username,
        deleted_at: null
      },
    });
  }
  async updateUserToken(updateUserDto: UserDTO, @Res() res) : Promise<boolean>{
    try {
      this.logger.info('Service=>updateUserToken=>Input: %o', UserDTO);
      let result: UpdateResult = await this.userRepository.update(updateUserDto.id, updateUserDto);
      if(isEmpty(result)){
        return  false;
      }
      if(result.affected>0){
        return  true;
      } else {
        return  false;
      }
    } catch (e) {
      console.error(e);
      this.logger.error('Service=>updateUserToken=>Error: %o', e);
      return  false;
    }
  }

  // User role related APIs
  async getUserRoles(@Res() res): Promise<void> {
    try {
      this.logger.info('Service=>getUserRoles=>Request');
      // let query = {where: {deleted_at: IsNull()}}
      let userRoles: UserRolesDTO[] = await this.userRolesRepository.find();
      if(isEmpty(userRoles)){
        res.status(HttpStatus.OK).json("No user roles found"); // send error message to client
      }
      let result = await this.utilsService.convertNumericToString(userRoles);
      this.logger.debug('Service=>getUserRoles=>Result: %o', result);
      res.status(HttpStatus.OK).json(result);
    } catch (e) {
      console.error(e);
      this.logger.error('Service=>getUserRoles=>Error: %o', e);
      res.status(HttpStatus.OK).json(e.sqlMessage); // send error message to client
    }
  }
  // Empty function in php but here is its implementation in nestjs
  async getUserRole(username: string, @Res() res): Promise<void> {
    try {
      this.logger.info('Service=>getUserRole=>Input: %o', username);
      let user: User = await this.userRepository.findOne({
        where :{
          username: username,
          deleted_at: null
        },
        // select : ['role']
      });
      if(isEmpty(user)){
        res.status(HttpStatus.OK).json(`User ${username} not found.`); // send error message to client
      }
      let result = await this.utilsService.convertNumericToString(user);
      this.logger.info('Service=>getUserRole=>Result: %o', result);
      res.status(HttpStatus.OK).json(result);
    } catch (e) {
      console.error(e);
      this.logger.error('Service=>getUserRole=>Error: %o', e);
      res.status(HttpStatus.OK).json(e.sqlMessage); // send error message to client
    }
  }
}
