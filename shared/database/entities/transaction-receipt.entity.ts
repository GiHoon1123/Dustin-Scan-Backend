import { Column, Entity, Index, PrimaryGeneratedColumn } from 'typeorm';

/**
 * TransactionReceipt Entity
 *
 * 트랜잭션 실행 결과 정보
 * - 성공/실패 여부 (status)
 * - Gas 사용량
 * - 컨트랙트 주소 (배포 시)
 * - 이벤트 로그
 */
@Entity('transaction_receipts')
export class TransactionReceipt {
  @PrimaryGeneratedColumn()
  id: number;

  /**
   * 트랜잭션 해시 (Unique)
   * Transaction과 1:1 관계
   */
  @Index({ unique: true })
  @Column()
  transactionHash: string;

  /**
   * 트랜잭션 인덱스 (블록 내 순서)
   * 0부터 시작
   */
  @Column('int')
  transactionIndex: number;

  /**
   * 블록 해시
   */
  @Index()
  @Column()
  blockHash: string;

  /**
   * 블록 번호
   */
  @Index()
  @Column('bigint')
  blockNumber: string;

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
   * 실행 상태
   * 1: 성공
   * 0: 실패 (revert)
   *
   * 이더리움 EIP-658 표준
   */
  @Column('int')
  status: number;

  /**
   * Gas 사용량 (Wei)
   * 이 트랜잭션이 사용한 Gas
   */
  @Column('decimal', { precision: 78, scale: 0 })
  gasUsed: string;

  /**
   * 누적 Gas 사용량 (Wei)
   * 블록 내에서 이 트랜잭션까지의 총 Gas 사용량
   */
  @Column('decimal', { precision: 78, scale: 0 })
  cumulativeGasUsed: string;

  /**
   * Contract 주소
   * Contract 생성 시에만 값 존재
   * 일반 송금은 null
   */
  @Column({ nullable: true })
  contractAddress: string | null;

  /**
   * 이벤트 로그
   * Contract에서 발생한 이벤트들
   * JSON 배열로 저장
   */
  @Column('jsonb', { default: [] })
  logs: any[];

  /**
   * Logs Bloom Filter
   * 로그 검색 최적화용
   */
  @Column()
  logsBloom: string;
}
