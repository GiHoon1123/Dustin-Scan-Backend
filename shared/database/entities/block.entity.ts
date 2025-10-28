import { Column, CreateDateColumn, Entity, Index, PrimaryColumn } from 'typeorm';

@Entity('blocks')
export class Block {
  @PrimaryColumn()
  hash: string;

  @Index()
  @Column('bigint', { unique: true })
  number: string;

  @Column('bigint')
  timestamp: string;

  @Column()
  parentHash: string;

  @Column()
  proposer: string;

  @Column('int')
  transactionCount: number;

  @Column()
  stateRoot: string;

  @Column()
  transactionsRoot: string;

  @Column()
  receiptsRoot: string;

  @Column('jsonb', { nullable: true })
  raw: any;

  @CreateDateColumn()
  createdAt: Date;
}
