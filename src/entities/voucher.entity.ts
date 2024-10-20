import { Column, Entity, Index } from 'typeorm';
import { BaseEntity } from './base.entity';

@Entity({ name: 'vouchers' })
export class Voucher extends BaseEntity {
  @Column()
  name: string;

  @Column()
  description: string;

  @Index()
  @Column({
    unique: true,
  })
  code: string;

  @Column()
  paymentMethod: string;

  @Column({ type: 'double' })
  discount: number;

  @Column({ type: 'double' })
  discountToUp: number;

  @Column({ nullable: true })
  minimumOrder: number;

  @Column()
  totalUse: number;

  @Column({ nullable: true })
  quantity: number;

  @Column({ nullable: true })
  icon: string;

  @Column({ nullable: true })
  startTime: string;

  @Column()
  endTime: string;

  @Index()
  @Column()
  type: string;
}
