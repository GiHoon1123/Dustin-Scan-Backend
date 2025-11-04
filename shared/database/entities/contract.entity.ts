import { Column, CreateDateColumn, Entity, Index, PrimaryColumn } from 'typeorm';

/**
 * Contract Entity
 *
 * 컨트랙트 정보 저장
 * - 배포된 컨트랙트의 메타데이터
 * - ABI, 소스코드 등
 */
@Entity('contracts')
export class Contract {
  /**
   * 컨트랙트 주소 (Primary Key)
   * Receipt의 contractAddress와 동일
   */
  @PrimaryColumn()
  address: string;

  /**
   * 배포한 계정 주소
   */
  @Index()
  @Column()
  deployer: string;

  /**
   * 배포 트랜잭션 해시
   */
  @Index()
  @Column()
  transactionHash: string;

  /**
   * 배포된 블록 번호
   */
  @Index()
  @Column('bigint')
  blockNumber: string;

  /**
   * 배포된 블록 해시
   */
  @Index()
  @Column()
  blockHash: string;

  /**
   * 컨트랙트 바이트코드 (배포된 코드)
   * 0x 접두사 포함 Hex String
   * 체인에서 조회 가능
   */
  @Column('text', { nullable: true })
  bytecode: string | null;

  /**
   * ABI (Application Binary Interface)
   * JSON 배열 형태로 저장
   * 옵셔널: 나중에 UI에서 업데이트 가능
   */
  @Column('jsonb', { nullable: true })
  abi: any[] | null;

  /**
   * Solidity 소스 코드 (선택)
   * 프론트에서 입력받은 소스 코드
   */
  @Column('text', { nullable: true })
  sourceCode: string | null;

  /**
   * 컨트랙트 이름 (선택)
   */
  @Column({ nullable: true })
  name: string | null;

  /**
   * 컴파일러 버전 (선택)
   * 예: "0.8.20"
   */
  @Column({ nullable: true })
  compilerVersion: string | null;

  /**
   * 최적화 설정 (선택)
   */
  @Column({ nullable: true })
  optimization: boolean | null;

  /**
   * 배포 시간 (블록 타임스탬프)
   */
  @Column('bigint')
  timestamp: string;

  /**
   * 생성 시간 (DB 저장 시간)
   */
  @CreateDateColumn()
  createdAt: Date;
}

