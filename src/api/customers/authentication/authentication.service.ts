import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
/**
 * Import entities
 */
import { Customer, Option } from '@entities/index';
/**
 * Import dto
 */
import {
  CreateCustomerDto,
  ForgotCustomerDto,
  LoginCustomerDto,
  NewPasswordDto,
  VerifyOtpDto,
  VerifyPhoneNumberDto,
} from './dto';

import {
  AppType,
  DEFAULT_MESSAGES,
  OPTIONS,
  SmsService,
  StringeeService,
  generateHashedPassword,
  generateOTP,
  makePhoneNumber,
  otpToText,
  validPassword,
} from '@common/index';

@Injectable()
export class AuthenticationService {
  constructor(
    @InjectRepository(Customer) private userRepository: Repository<Customer>,
    private readonly stringeeService: StringeeService,
    private readonly jwtService: JwtService,
    private readonly smsService: SmsService,
    @InjectRepository(Option) private optionRepository: Repository<Option>,
  ) {}

  /**
   * Function to load user
   * @param userId
   * @returns user
   */
  private async loadUser(userId: string) {
    try {
      const user = await this.userRepository.findOneBy({ id: userId });
      if (!user) throw new NotFoundException('User not found');
      return user;
    } catch (e) {
      throw new BadRequestException(e.message);
    }
  }

  /**
   * Function to load option
   * @returns option
   */
  private async loadOption() {
    try {
      const option = await this.optionRepository.findOneBy({
        key: OPTIONS.STRINGEE_NUMBER,
      });
      return option;
    } catch (e) {
      throw new BadRequestException(e.message);
    }
  }

  /**
   * Function to verify phone number
   * @param phone
   * @returns boolean
   */
  async verifyPhoneNumber({ phone }: VerifyPhoneNumberDto) {
    try {
      const user = await this.userRepository.findOneBy({ phone });
      return !!user;
    } catch (e) {
      throw new BadRequestException(e.message);
    }
  }

  /**
   * Function to verify phone number v2
   * @param phone
   * @returns boolean
   */
  async verifyPhoneNumberV2({ phone }: VerifyPhoneNumberDto) {
    try {
      const user = await this.userRepository.findOneBy({ phone });
      return {
        isExisted: !!user,
        fullName: user?.fullName,
        isVerified: user?.isVerified,
      };
    } catch (e) {
      throw new BadRequestException(e.message);
    }
  }
  /**
   * Function to create account
   * @param phone
   * @returns success
   */
  async createAccount({ phone }: CreateCustomerDto) {
    try {
      // Generate OTP
      const otp = generateOTP();
      const otpText = otpToText(otp);
      const phoneNumber = makePhoneNumber(phone);
      // Check if phone number is existed
      const foundUser = await this.userRepository.findOneBy({ phone });
      if (foundUser) throw new BadRequestException('Phone number is existed');
      // Create account with phone and otp
      const user = await this.userRepository.save({
        phone,
        otp: otp.toString(),
        registrationDate: new Date(),
        wallet: { balance: 0 },
      });
      // Get option
      const option = await this.loadOption();
      // Make call to phone number with otp
      const res = await this.stringeeService.makeCall({
        toNumber: phoneNumber,
        otp: otpText,
        fromNumber: option?.value || null,
      });
      console.log('[STRINGEE][RES]', res?.data);
      return { userId: user.id };
    } catch (e) {
      throw new BadRequestException(e.message);
    }
  }

  /**
   * Function to verify otp
   * @param userId, otp
   * @returns boolean
   */
  async verifyOtp({ userId, otp }: VerifyOtpDto) {
    try {
      const user = await this.userRepository.findOneBy({ id: userId, otp });
      if (!user) throw new BadRequestException('Invalid OTP');

      return !!user;
    } catch (e) {
      throw new BadRequestException(e.message);
    }
  }

  /**
   * Function to update user
   * @param userId
   * @param dto
   * @returns string
   */
  async newPassword(userId: string, dto: NewPasswordDto) {
    try {
      const user = await this.loadUser(userId);
      const { password, referralCode, otp } = dto;
      if (user.otp !== otp) throw new BadRequestException('Invalid OTP');

      const updateData = {};

      if (password) {
        updateData['password'] = generateHashedPassword(password);
        updateData['isVerified'] = true;
        updateData['otp'] = null;
      }
      if (referralCode) updateData['referralCode'] = referralCode;

      // Check email is existed and not belong to user
      if (dto.email && dto.email !== user.email) {
        const foundUser = await this.userRepository.findOneBy({
          email: dto.email,
        });
        if (foundUser) throw new BadRequestException('Email is existed');
        updateData['email'] = dto.email;
      }
      if (dto.fullName) updateData['fullName'] = dto.fullName;

      await this.userRepository.update(user.id, updateData);

      return DEFAULT_MESSAGES.SUCCESS;
    } catch (e) {
      throw new BadRequestException(e.message);
    }
  }

  /**
   * Function to login
   * @param phone
   * @param password
   * @returns user and token
   */
  async login({ phone, password }: LoginCustomerDto) {
    try {
      const user = await this.userRepository.findOneBy({ phone });
      if (!user) throw new BadRequestException('Invalid phone or password');
      if (!user.isVerified)
        throw new BadRequestException('User is not verified');

      if (!validPassword(password, user.password)) {
        throw new BadRequestException('Invalid phone or password');
      }
      // Update status isLogin when user login
      await this.userRepository.update(user.id, { isLogin: true });

      const token = this.jwtService.sign({
        sub: user.id,
        type: AppType.customers,
      });
      return {
        token,
        user: { fullName: user.fullName, id: user.id, avatar: user.avatar },
      };
    } catch (e) {
      throw new BadRequestException(e.message);
    }
  }

  /**
   * Function to forgot password
   */
  async forgotPassword({ phone }: ForgotCustomerDto) {
    try {
      // Generate OTP
      const otp = generateOTP();
      const otpText = otpToText(otp);
      const phoneNumber = makePhoneNumber(phone);
      // Check if phone number is existed
      const foundUser = await this.userRepository.findOneBy({ phone });
      if (!foundUser) throw new BadRequestException('Account not found');
      // Update account with phone and otp
      const user = await this.userRepository.save({
        id: foundUser.id,
        otp: otp.toString(),
      });
      // Get option
      const option = await this.loadOption();
      // Make call to phone number with otp
      const res = await this.stringeeService.makeCall({
        toNumber: phoneNumber,
        otp: otpText,
        fromNumber: option?.value || null,
      });
      console.log('[STRINGEE][RES]', res?.data);
      return { userId: user.id };
    } catch (e) {
      throw new BadRequestException(e.message);
    }
  }

  /**
   * Function to logout
   * @param userId
   * @returns success
   */
  async logout(userId: string) {
    try {
      const user = await this.loadUser(userId);
      await this.userRepository.update(user.id, { fcmToken: null });
      return DEFAULT_MESSAGES.SUCCESS;
    } catch (e) {
      throw new BadRequestException(e.message);
    }
  }

  /**
   * Function to destroy
   * @param userId
   * @returns success
   */
  async destroy(userId: string) {
    try {
      const user = await this.loadUser(userId);
      await this.userRepository.softDelete(user.id);
      return DEFAULT_MESSAGES.SUCCESS;
    } catch (e) {
      throw new BadRequestException(e.message);
    }
  }

  /**
   * Function to send sms
   * @param toNumber
   */
  async sendSms(phone: string) {
    try {
      const foundUser = await this.userRepository.findOneBy({ phone });
      if (!foundUser) throw new BadRequestException('Account not found');
      if (!foundUser.otp) throw new BadRequestException('OTP not found');

      const today = new Date();
      const todayDateString = today.toISOString().split('T')[0];

      if (foundUser.lastOtpRequestDate?.toString() === todayDateString) {
        if (foundUser.otpRequestCount >= 5) {
          throw new BadRequestException('OTP request limit reached for today');
        }
        foundUser.otpRequestCount += 1;
      } else {
        foundUser.otpRequestCount = 1;
        foundUser.lastOtpRequestDate = today;
      }

      await this.userRepository.save(foundUser);
      const phoneNumber = makePhoneNumber(phone);

      const res = await this.smsService.send({
        toNumber: phoneNumber,
        otp: foundUser.otp,
      });

      return res;
    } catch (e) {
      throw new BadRequestException(e.message);
    }
  }
}
