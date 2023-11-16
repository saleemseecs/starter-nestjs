import {
  HttpStatus,
  Injectable, Res
} from "@nestjs/common";
import { PinoLogger } from 'nestjs-pino';
import {format} from "date-fns";
@Injectable()
export class UtilsService {
  constructor(
      private readonly logger: PinoLogger,
  )
  {
      logger.setContext(UtilsService.name);
  }
  async convertNumericToString(obj) {
    for (const key in obj) {
      if (typeof obj[key] === 'number') {
        obj[key] = obj[key].toString();
      } else if (typeof obj[key] === 'object' && obj[key] !== null) {
        await this.convertNumericToString(obj[key]);
      }
    }
    return obj;
  }
  async denyAccess(@Res() res): Promise<void> {
    this.logger.info('Service=>denyAccess=>Request');
    res.status(HttpStatus.FORBIDDEN).json("You shall not pass!");
  }
  async formatDate(obj): Promise<void> {
    if(!Array.isArray(obj)){
      if(obj.created!= undefined){
        obj.created = format(obj.created, 'yyyy-MM-dd HH:mm:ss');
      }
      if(obj.lastModified!= undefined){
        obj.lastModified = format(obj.lastModified, 'yyyy-MM-dd HH:mm:ss');
      }
      if(obj.deleted_at!= undefined){
        obj.deleted_at = format(obj.deleted_at, 'yyyy-MM-dd HH:mm:ss');
      }
    } else {
      for (let i=0; i<obj.length; i++){
        if(obj[i].created!= undefined){
          obj[i].created = format(obj[i].created, 'yyyy-MM-dd HH:mm:ss');
        }
        if(obj[i].lastModified!= undefined){
          obj[i].lastModified = format(obj[i].lastModified, 'yyyy-MM-dd HH:mm:ss');
        }
        if(obj[i].deleted_at!= undefined){
          obj[i].deleted_at = format(obj[i].deleted_at, 'yyyy-MM-dd HH:mm:ss');
        }
      }
    }
    return obj;
  }

  async handleDbError(e){
    this.logger.error('Utils=>handleDB=>Error: %o', e);

    // Handle different types of database errors
    if (e.name === 'QueryFailedError') {
      // Handle query errors (e.g., column not found, constraint violation, etc.)
      return { status: HttpStatus.BAD_REQUEST, message: 'Internal server error.' };
    } else if (e.name === 'EntityNotFoundError') {
      // Handle entity not found errors (e.g., when trying to update or delete a non-existent record)
      return { status: HttpStatus.NOT_FOUND, message: 'Not found.' };
    } else if (e.name === 'ForeignKeyConstraintError') {
      // Handle foreign key constraint errors
      return { status: 400, message: 'Foreign key constraint violation.' };
    } else if (e.name === 'UniqueConstraintError') {
      // Handle unique constraint errors
      return { status: 400, message: 'Unique constraint violation.' };
    } else {
      // Handle other unknown errors
      return { status: 500, message: 'An unexpected error occurred during database operation.' };
    }
  }
  async convertBooleanPropertiesToInteger(data: any): Promise<any> {
    if (Array.isArray(data)) {
      return data.map((item) => {
        return Object.fromEntries(
            Object.entries(item).map(([key, value]) => {
              return [
                key,
                typeof value === "boolean" ? (value ? 1 : 0) : value,
              ];
            })
        );
      });
    } else {
      return Object.fromEntries(
          Object.entries(data).map(([key, value]) => {
            return [
              key,
              typeof value === "boolean" ? (value ? 1 : 0) : value,
            ];
          })
      );
    }
  }
  async generateRandomString(length) {
    const uppercaseCharset = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    const lowercaseCharset = 'abcdefghijklmnopqrstuvwxyz';
    const specialCharset = '!@#$%^&*()_-+=<>?/[]{},.:;';
    const charset = uppercaseCharset + lowercaseCharset + specialCharset;

    let randomString = '';

    // Ensure at least one uppercase letter
    randomString += uppercaseCharset[Math.floor(Math.random() * uppercaseCharset.length)];

    // Ensure at least one lowercase letter
    randomString += lowercaseCharset[Math.floor(Math.random() * lowercaseCharset.length)];

    // Ensure at least one special character
    randomString += specialCharset[Math.floor(Math.random() * specialCharset.length)];

    // Fill the remaining characters
    for (let i = randomString.length; i < length; i++) {
      const randomIndex = Math.floor(Math.random() * charset.length);
      randomString += charset[randomIndex];
    }

    // Shuffle the string to randomize the positions of the required characters
    randomString = randomString.split('').sort(() => Math.random() - 0.5).join('');

    return randomString;
  }
}
