import RedisService from '@common/services/redis.service';
import { Option, Shoemaker } from '@entities/index';
import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Redis } from 'ioredis';
import { Repository } from 'typeorm';

/**
 * Import dto
 */
import { CreateShoemakerDto, ForgotShoemakerDto, LoginShoemakerDto, NewPasswordDto, UpdateAvatarDto, UpdateFCMTokenUserDto, UpdateInformationDto, VerifyOtpDto, VerifyPhoneNumberDto } from './dto';

import { StepEnum } from '@common/enums/step.enum';
import { AppType, DEFAULT_MESSAGES, OPTIONS, S3Service, ShoemakerStatusEnum, SmsService, StringeeService, generateHashedPassword, generateOTP, makePhoneNumber, otpToText, validPassword } from '@common/index';
import { REDIS_PREFIX } from './constants';

@Injectable()
export class AuthenticationService {
  private readonly redis: RedisService;

  constructor(
    @InjectRepository(Shoemaker)
    private readonly userRepository: Repository<Shoemaker>,
    private readonly stringeeService: StringeeService,
    private readonly jwtService: JwtService,
    private configService: ConfigService,
    private readonly s3: S3Service,
    private readonly smsService: SmsService,
    @InjectRepository(Option) private optionRepository: Repository<Option>,
  ) {
    const redisClient = new Redis({
      host: this.configService.get<string>('QUEUE_HOST'),
      port: Number(this.configService.get<string>('QUEUE_PORT')),
    });
    this.redis = new RedisService(redisClient);
  }

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
   * Function to create account
   * @param phone
   * @returns success
   */
  async createAccount({ phone }: CreateShoemakerDto) {
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

      // change step to New Password if status is pending
      if (user.status === ShoemakerStatusEnum.PENDING) {
        await this.userRepository.update(user.id, {
          step: StepEnum.NEW_PASSWORD,
        });
      }
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
      if (user.status === ShoemakerStatusEnum.PENDING && user.step !== StepEnum.NEW_PASSWORD) {
        throw new BadRequestException('Invalid step');
      }

      const { password, otp } = dto;
      if (user.otp !== otp) throw new BadRequestException('Invalid OTP');
      const updateData = {};

      updateData['password'] = generateHashedPassword(password);
      updateData['isVerified'] = true;
      updateData['otp'] = null;
      if (user.status === ShoemakerStatusEnum.PENDING) {
        updateData['step'] = StepEnum.REGISTER_INFO;
      }

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
  async login({ phone, password }: LoginShoemakerDto) {
    try {
      const user = await this.userRepository.findOneBy({ phone });
      if (!user) throw new BadRequestException('Invalid phone or password');

      if (!validPassword(password, user.password)) {
        throw new BadRequestException('Invalid phone or password');
      }
      // Check if user is verified and active
      if (user.status !== ShoemakerStatusEnum.ACTIVE || !user.isVerified || user.step !== StepEnum.COMPLETED) {
        // If step = OTP, make stringee call
        if (user.step === StepEnum.OTP) {
          // Generate OTP
          const otp = generateOTP();
          const otpText = otpToText(otp);
          const phoneNumber = makePhoneNumber(phone);
          // Update account with phone and otp
          await this.userRepository.update(user.id, { otp: otp.toString() });
          // Make call to phone number with otp
          await this.stringeeService.makeCall({
            toNumber: phoneNumber,
            otp: otpText,
          });
        }
        return { id: user.id, step: user.step, status: user.status };
      }

      await this.userRepository.update(user.id, { lastLoginDate: new Date() });

      const token = this.jwtService.sign({
        sub: user.id,
        type: AppType.customers,
      });

      await this.signPayload(token);

      return {
        token,
        user: { fullName: user.fullName, id: user.id, avatar: user.avatar },
      };
    } catch (e) {
      throw new BadRequestException(e.message);
    }
  }

  /**
   * Function to update information
   * @param userId
   * @param dto
   * @returns string
   */
  async updateInformation(userId: string, dto: UpdateInformationDto) {
    try {
      const user = await this.loadUser(userId);
      if (user.step !== StepEnum.REGISTER_INFO) {
        throw new BadRequestException('Invalid step');
      }

      const updateData = {};
      if (dto.referralCode) updateData['referralCode'] = dto.referralCode;

      // Check email is existed and not belong to user
      if (dto.email && dto.email !== user.email) {
        const foundUser = await this.userRepository.findOneBy({
          email: dto.email,
        });
        if (foundUser) throw new BadRequestException('Email is existed');
        updateData['email'] = dto.email;
      }
      if (dto.fullName) updateData['fullName'] = dto.fullName;
      if (dto.dateOfBirth) updateData['dateOfBirth'] = dto.dateOfBirth;
      if (dto.identityCard) updateData['identityCard'] = dto.identityCard;
      if (dto.placeOfOrigin) updateData['placeOfOrigin'] = dto.placeOfOrigin;
      if (dto.placeOfResidence) updateData['placeOfResidence'] = dto.placeOfResidence;
      if (dto.frontOfCardImage) updateData['frontOfCardImage'] = dto.frontOfCardImage;
      if (dto.backOfCardImage) updateData['backOfCardImage'] = dto.backOfCardImage;
      if (dto.workRegistrationArea) updateData['workRegistrationArea'] = dto.workRegistrationArea;
      if (dto.maritalStatus) updateData['maritalStatus'] = dto.maritalStatus;
      if (dto.accountNumber) updateData['accountNumber'] = dto.accountNumber;
      if (dto.accountName) updateData['accountName'] = dto.accountName;
      if (dto.bankName) updateData['bankName'] = dto.bankName;

      updateData['step'] = StepEnum.REGISTER_INFO_SUCCESS;

      await this.userRepository.update(user.id, updateData);
      return DEFAULT_MESSAGES.SUCCESS;
    } catch (e) {
      throw new BadRequestException(e.message);
    }
  }

  /**
   * Function to update avatar
   * @param userId
   * @param dto
   * @returns string
   */
  async updateAvatar(userId: string, dto: UpdateAvatarDto) {
    try {
      const user = await this.loadUser(userId);
      if (user.status !== ShoemakerStatusEnum.ACTIVE) {
        throw new BadRequestException('Account is not active');
      }

      if (user.step !== StepEnum.REGISTER_INFO_SUCCESS) {
        throw new BadRequestException('Invalid step');
      }

      await this.userRepository.update(user.id, {
        avatar: dto.avatar,
        step: StepEnum.COMPLETED,
        lastLoginDate: new Date(),
      });

      const token = this.jwtService.sign({
        sub: user.id,
        type: AppType.customers,
      });

      await this.signPayload(token);
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
  async forgotPassword({ phone }: ForgotShoemakerDto) {
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

  async signPayload(token: string) {
    try {
      const decoded: any = this.jwtService.decode(token);
      const key = `${REDIS_PREFIX}${decoded.sub}`;
      if (decoded.exp) {
        await this.redis.setExpire(key, 'true', Math.floor(decoded.exp - Date.now() / 1000));
      } else {
        await this.redis.set(key, 'true');
      }
    } catch (error) {
      throw new BadRequestException(error?.message);
    }
  }

  /**
   * Function to get signed file url
   * @param fileName
   * @returns signed file url
   */
  async getSignedFileUrl(userId: string, fileName: string) {
    try {
      await this.loadUser(userId);
      if (!fileName) throw new BadRequestException('File name is required');
      const res = this.s3.getSignedFileUrl(fileName);
      return res;
    } catch (e) {
      throw new BadRequestException(e.message);
    }
  }

  /**
   * Function to get status
   * @param userId string
   * @returns return status and step of user
   */
  async getStatus(userId: string) {
    try {
      const user = await this.loadUser(userId);
      return { status: user.status, step: user.step };
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

  async updateFCMToken(dto: UpdateFCMTokenUserDto) {
    try {
      const user = await this.loadUser(dto.userId);
      if (user.step !== StepEnum.REGISTER_INFO_SUCCESS) {
        throw new BadRequestException('Invalid step');
      }
      await this.userRepository.update(user.id, { fcmToken: dto.fcmToken });

      return DEFAULT_MESSAGES.SUCCESS;
    } catch (e) {
      throw new BadRequestException(e.message);
    }
  }
}
