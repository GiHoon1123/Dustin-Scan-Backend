import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TokenTransfer } from '../entities/token-transfer.entity';

/**
 * TokenTransfer Repository
 *
 * 토큰 전송 내역에 대한 데이터 접근 캡슐화
 */
@Injectable()
export class TokenTransferRepository {
  constructor(
    @InjectRepository(TokenTransfer)
    private readonly repository: Repository<TokenTransfer>,
  ) {}

  /**
   * 특정 지갑 주소와 관련된 토큰 전송 내역 페이징 조회
   * (from 또는 to가 해당 주소인 경우)
   */
  async findByAddressPaginated(
    address: string,
    page: number,
    limit: number,
  ): Promise<[TokenTransfer[], number]> {
    const skip = (page - 1) * limit;
    const addressLower = address.toLowerCase();

    const [items, totalCount] = await this.repository.findAndCount({
      where: [{ from: addressLower }, { to: addressLower }],
      order: { blockNumber: 'DESC', logIndex: 'DESC' },
      skip,
      take: limit,
    });

    return [items, totalCount];
  }

  /**
   * 특정 토큰 + 주소 기준 전송 내역 페이징 조회
   */
  async findByTokenAndAddressPaginated(
    tokenAddress: string,
    address: string,
    page: number,
    limit: number,
  ): Promise<[TokenTransfer[], number]> {
    const skip = (page - 1) * limit;
    const addressLower = address.toLowerCase();
    const tokenLower = tokenAddress.toLowerCase();

    const [items, totalCount] = await this.repository.findAndCount({
      where: [
        { tokenAddress: tokenLower, from: addressLower },
        { tokenAddress: tokenLower, to: addressLower },
      ],
      order: { blockNumber: 'DESC', logIndex: 'DESC' },
      skip,
      take: limit,
    });

    return [items, totalCount];
  }

  /**
   * 특정 주소가 보유한 토큰 주소 목록과 각 토큰별 잔액 집계
   *
   * balance = sum(value where to=address) - sum(value where from=address)
   */
  async getTokenBalancesByAddress(
    address: string,
    page: number,
    limit: number,
  ): Promise<
    {
      tokenAddress: string;
      balance: string;
    }[]
  > {
    const addressLower = address.toLowerCase();
    const skip = (page - 1) * limit;

    const query = this.repository
      .createQueryBuilder('t')
      .select('LOWER(t.tokenAddress)', 'tokenAddress')
      .addSelect(
        `SUM(
          CASE 
            WHEN t.to = :address THEN t.value::numeric 
            WHEN t.from = :address THEN -t.value::numeric 
            ELSE 0 
          END
        )`,
        'balance',
      )
      .where('t.from = :address OR t.to = :address', { address: addressLower })
      .groupBy('LOWER(t.tokenAddress)')
      .having('SUM(CASE WHEN t.to = :address THEN t.value::numeric WHEN t.from = :address THEN -t.value::numeric ELSE 0 END) <> 0', {
        address: addressLower,
      })
      .orderBy('LOWER(t.tokenAddress)', 'ASC')
      .offset(skip)
      .limit(limit);

    const rows = await query.getRawMany<{ tokenAddress: string; balance: string }>();
    return rows;
  }

  /**
   * 토큰 전송 내역 저장
   */
  async save(transfer: TokenTransfer): Promise<TokenTransfer> {
    return this.repository.save(transfer);
  }

  /**
   * 여러 토큰 전송 내역 일괄 저장
   */
  async saveMany(transfers: TokenTransfer[]): Promise<TokenTransfer[]> {
    return this.repository.save(transfers);
  }
}


