import { Column, CreateDateColumn, Entity, Index, PrimaryColumn } from 'typeorm';

@Entity('transactions')
export class Transaction {
  @PrimaryColumn()
  hash: string;

  @Index()
  @Column({ nullable: true })
  blockHash: string;

  @Index()
  @Column('bigint', { nullable: true })
  blockNumber: string;

  @Index()
  @Column()
  from: string;

  @Index()
  @Column()
  to: string;

  @Column('decimal', { precision: 78, scale: 0 })
  value: string;

  @Column('int')
  nonce: number;

  @Column()
  status: string;

  @Column('bigint')
  timestamp: string;

  @Column('jsonb', { nullable: true })
  raw: any;

  @CreateDateColumn()
  createdAt: Date;
}
