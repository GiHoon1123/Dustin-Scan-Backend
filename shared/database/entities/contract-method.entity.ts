import { Column, Entity, Index, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { Contract } from './contract.entity';

/**
 * Contract Method Entity
 *
 * 컨트랙트 메서드 정보 캐싱
 * - ABI 파싱 결과를 저장하여 재사용
 * - 메서드 호출 시 빠른 조회를 위한 인덱스
 */
@Entity('contract_methods')
export class ContractMethod {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  /**
   * 컨트랙트 주소 (FK)
   */
  @Index()
  @Column()
  contractAddress: string;

  /**
   * 메서드 이름
   */
  @Index()
  @Column()
  methodName: string;

  /**
   * 메서드 시그니처 (함수 선택자, 4바이트)
   * 예: "0x55241077"
   */
  @Index()
  @Column()
  methodSignature: string;

  /**
   * 입력 파라미터 타입 정보 (JSON)
   * 예: ["uint256", "address"]
   */
  @Column('jsonb')
  inputs: Array<{ name: string; type: string; internalType?: string }>;

  /**
   * 메서드 타입 (function, constructor, event, etc.)
   */
  @Column()
  type: string;

  /**
   * 상태 변경 가능 여부 (view, pure, nonpayable, payable)
   */
  @Column({ nullable: true })
  stateMutability: string | null;

  /**
   * Contract와의 관계 (선택적, 참조용)
   */
  @ManyToOne(() => Contract, { onDelete: 'CASCADE' })
  contract: Contract;
}

