import { Column, DeleteDateColumn, Entity, Index, OneToOne } from 'typeorm';

import { BaseEntity } from './base.entity';
import { Wallet } from './wallet.entity';

@Entity({ name: 'customers' })
export class Customer extends BaseEntity {
  @OneToOne(() => Wallet, (wallet) => wallet.customer, { cascade: true })
  wallet: Wallet;

  @Column({ unique: true })
  phone: string;

  @Column({ nullable: true })
  password: string;

  @Column({ nullable: true })
  fullName: string;

  @Column({ nullable: true })
  otp: string;

  @Column({ nullable: true })
  fcmToken: string;

  @Column({ nullable: true, unique: true })
  email: string;

  @Index()
  @Column({ nullable: true })
  referralCode: string;

  @Column({ nullable: true })
  registrationDate: Date;

  @Column({ nullable: true })
  lastLoginDate: Date;

  @Column({ default: false })
  isLogin: boolean;

  @Column({ default: false })
  isVerified: boolean;

  @Column({ nullable: true })
  bankName: string;

  @Column({ nullable: true })
  bankAccountNumber: string;

  @Column({ nullable: true })
  bankAccountName: string;

  @Column({ nullable: true })
  avatar: string;

  @Column({ type: 'int', default: 0 })
  otpRequestCount: number;

  @Column({ type: 'date', nullable: true })
  lastOtpRequestDate: Date;

  @Column({ default: true })
  newUser: boolean;

  // Soft delete
  @DeleteDateColumn({ type: 'datetime' })
  deletedAt: Date;
}
