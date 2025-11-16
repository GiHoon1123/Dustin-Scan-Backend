import { Column, CreateDateColumn, Entity, Index, PrimaryGeneratedColumn } from 'typeorm';

/**
 * TokenTransfer Entity
 *
 * ERC-20 Transfer 이벤트 기반 토큰 전송 내역
 * - logs에서 파싱한 from/to/value 및 블록/트랜잭션 메타데이터 저장
 */
@Entity('token_transfers')
export class TokenTransfer {
  @PrimaryGeneratedColumn()
  id: number;

  /**
   * 토큰 컨트랙트 주소
   */
  @Index()
  @Column()
  tokenAddress: string;

  /**
   * 발신자 주소
   */
  @Index()
  @Column()
  from: string;

  /**
   * 수신자 주소
   */
  @Index()
  @Column()
  to: string;

  /**
   * 전송 값 (Wei, 정수 문자열)
   */
  @Column('decimal', { precision: 78, scale: 0 })
  value: string;

  /**
   * 블록 번호
   */
  @Index()
  @Column('bigint')
  blockNumber: string;

  /**
   * 블록 해시
   */
  @Index()
  @Column()
  blockHash: string;

  /**
   * 트랜잭션 해시
   */
  @Index()
  @Column()
  transactionHash: string;

  /**
   * 로그 인덱스 (블록 내에서의 로그 순서)
   */
  @Column('int')
  logIndex: number;

  /**
   * 트랜잭션 타임스탬프 (블록 타임스탬프)
   */
  @Column('bigint')
  timestamp: string;

  /**
   * 생성 시간 (DB 저장 시간)
   */
  @CreateDateColumn()
  createdAt: Date;
}
