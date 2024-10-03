import { BadRequestException, Injectable, OnModuleInit } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import {
  generateHashedPassword,
  ICustomer,
  validPassword,
} from '@common/index';
import { Admin } from '@entities/index';

import { LoginDto } from './dto';

@Injectable()
export class AuthenticationService implements OnModuleInit {
  constructor(
    @InjectRepository(Admin) private readonly adminRep: Repository<Admin>,
    private readonly jwtService: JwtService,
  ) {}

  /**
   * This method is called when the module is initialized.
   * In this case, it checks if there are any admin accounts in the database.
   */
  async onModuleInit() {
    try {
      const admins = await this.adminRep.find();
      if (admins.length === 0) {
        const ADMIN_ACCOUNTS_USER_NAME = process.env.ADMIN_ACCOUNTS_USER_NAME;
        const ADMIN_ACCOUNTS_PASSWORD = process.env.ADMIN_ACCOUNTS_PASSWORD;
        if (ADMIN_ACCOUNTS_USER_NAME && ADMIN_ACCOUNTS_PASSWORD) {
          const admin = new Admin();
          admin.userName = ADMIN_ACCOUNTS_USER_NAME;
          admin.password = generateHashedPassword(ADMIN_ACCOUNTS_PASSWORD);
          await this.adminRep.save(admin);
        }
      }
    } catch (e) {
      console.error(e);
    }
  }

  /**
   * Function to login
   * @param phone
   * @param password
   * @returns user and token
   */
  async login({ userName, password }: LoginDto) {
    try {
      const user = await this.adminRep.findOneBy({ userName });
      if (!user) throw new BadRequestException('Invalid userName or Password');

      if (!validPassword(password, user.password)) {
        throw new BadRequestException('Invalid phone or password');
      }
      // Update status isLogin when user login
      await this.adminRep.update(user.id, { lastLoginDate: new Date() });

      const token = this.jwtService.sign({
        sub: user.id,
      });
      return { token, user: { userName: user.userName, id: user.id } };
    } catch (e) {
      throw new BadRequestException(e.message);
    }
  }

  /**
   * Function to validate user
   * @param payload
   * @returns user
   */
  validateUser(payload: ICustomer) {
    return this.adminRep.findOneBy({ id: payload.sub });
  }
}
