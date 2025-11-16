import { Column, CreateDateColumn, Entity, Index, PrimaryGeneratedColumn } from 'typeorm';

/**
 * Token Entity
 *
 * ERC-20 스타일 토큰 메타 정보 저장
 * - 컨트랙트 주소별 이름/심볼/소수점/타입
 */
@Entity('tokens')
export class Token {
  @PrimaryGeneratedColumn()
  id: number;

  /**
   * 토큰 컨트랙트 주소 (Unique)
   */
  @Index({ unique: true })
  @Column()
  address: string;

  /**
   * 토큰 이름 (선택)
   */
  @Column({ nullable: true })
  name: string | null;

  /**
   * 토큰 심볼 (선택)
   */
  @Column({ nullable: true })
  symbol: string | null;

  /**
   * 소수점 자리수 (decimals)
   * 기본값 18, null 허용 (미등록 토큰)
   */
  @Column('int', { nullable: true })
  decimals: number | null;

  /**
   * 토큰 타입
   * 예: 'erc20', 'erc721' 등
   */
  @Column({ default: 'erc20' })
  type: string;

  /**
   * 생성 시간 (DB 저장 시간)
   */
  @CreateDateColumn()
  createdAt: Date;
}
