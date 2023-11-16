import { IsEmail, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class UserDTO {
  id: string;
  app?: string;
  username?: string;
  password?: string;
  firstName?: string;
  lastName?: string;
  currentStatus?: string;
  msisdn?: string;
  simStatus?: string;
  generation?: string;
  device?: string;
  email?: string;
  role?: number;
  code?: string;
  isActive?: boolean;
  cookieToken?: string;
  createdAt?: Date;
  lastModified?: Date;
  deleted_at?: Date;
}

export class CreateUserDTO {
  app?: string;
  username?: string;
  password?: string;
  firstName?: string;
  lastName?: string;
  currentStatus?: string;
  msisdn?: string;
  simStatus?: string;
  generation?: string;
  device?: string;
  email?: string;
  role?: number;
  code?: string;
  isActive?: boolean;
  cookieToken?: string;
  createdAt?: Date;
  lastModified?: Date;
  deleted_at?: Date;
}
