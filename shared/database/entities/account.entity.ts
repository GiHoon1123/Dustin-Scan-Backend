import { Column, CreateDateColumn, Entity, PrimaryColumn, UpdateDateColumn } from 'typeorm';

@Entity('accounts')
export class Account {
  @PrimaryColumn()
  address: string;

  @Column('decimal', { precision: 78, scale: 0, default: '0' })
  balance: string;

  @Column('int', { default: 0 })
  nonce: number;

  @Column('int', { default: 0 })
  txCount: number;

  @UpdateDateColumn()
  lastUpdated: Date;

  @CreateDateColumn()
  createdAt: Date;
}
