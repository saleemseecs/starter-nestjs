import { Role } from '../../users/enums/role.enum';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { PassportStrategy } from '@nestjs/passport';
import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { AuthService } from '../auth.service';
import { JwtService } from '@nestjs/jwt';
import { CognitoIdentityServiceProvider } from 'aws-sdk';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  private readonly cognitoISP: CognitoIdentityServiceProvider;

  constructor(private readonly authService: AuthService, private readonly jwtService: JwtService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: `${process.env.PRIVATE_KEY.replace(/\\\\n/gm, '\\n')}`,
      algorithms: ['RS256'],
    });

    this.cognitoISP = new CognitoIdentityServiceProvider({ region: 'us-east-2' });
  }

  /**
   * @description Validate the token and return the user
   * @param payload any (CognitoIdentityServiceProvider.AdminGetUserResponse)
   * @returns any (user attributes)
   */
  async validate(payload: any): Promise<any> {
    const username = payload.sub;

    try {
      const params = {
        UserPoolId: process.env.AWS_COGNITO_USER_POOL_ID,
        Username: username,
      };

      const response = await this.cognitoISP.adminGetUser(params).promise();
      const userAttributes = this.getUserAttributesFromCognito(response);
      console.log('userAttributes: ', userAttributes)

      // You can use userAttributes to check the user's role or any other attributes
      const userRole = userAttributes['custom:access']; // Assuming the role is stored in the custom:role attribute
      console.log('userRole: ', userRole)
      // If the user is not found or unauthorized, throw an error
      if (!userRole || !Object.values(Role).includes(userRole)) {
        throw new HttpException('Unauthorized', HttpStatus.UNAUTHORIZED);
      }

      return userAttributes;
    } catch (err) {
      throw new HttpException('Invalid token', HttpStatus.UNAUTHORIZED);
    }
  }

  private getUserAttributesFromCognito(response: CognitoIdentityServiceProvider.AdminGetUserResponse): any {
    const userAttributes = {};

    if (response && response.UserAttributes) {
      for (const attribute of response.UserAttributes) {
        userAttributes[attribute.Name] = attribute.Value;
      }
    }

    return userAttributes;
  }
}


// import { ExtractJwt, Strategy } from 'passport-jwt';
// import { PassportStrategy } from '@nestjs/passport';
// import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
// import { User } from 'src/users/entities/user.entity';
// import { AuthService } from '../auth.service';
// import { UserService } from 'src/users/user.service';
//
// @Injectable()
// export class JwtStrategy extends PassportStrategy(Strategy) {
//   constructor(private readonly authService: AuthService, private userService: UserService) {
//     super({
//       jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
//       ignoreExpiration: false,
//       secretOrKey: `${process.env.PRIVATE_KEY.replace(/\\\\n/gm, '\\n')}`,
//       algorithms: ['RS256'],
//     });
//   }
//
//   /**
//    * @description Validate the token and return the user
//    * @param payload string
//    * @returns User
//    */
//   async validate(payload: any): Promise<User> {
//     // Accept the JWT and attempt to validate it using the user service
//     const user = await this.userService.findOne(payload.username);
//
//     // If the user is not found, throw an error
//     if (!user) {
//       throw new HttpException('Invalid token', HttpStatus.UNAUTHORIZED);
//     }
//
//     // If the user is found, return the user
//     return user;
//   }
// }
