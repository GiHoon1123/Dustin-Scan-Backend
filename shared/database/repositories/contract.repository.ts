import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ILike, Repository } from 'typeorm';
import { Contract } from '../entities/contract.entity';

/**
 * Contract Repository
 *
 * 컨트랙트 데이터 접근 로직 캡슐화
 */
@Injectable()
export class ContractRepository {
  constructor(
    @InjectRepository(Contract)
    private readonly repository: Repository<Contract>,
  ) {}

  /**
   * 컨트랙트 주소로 조회
   */
  async findByAddress(address: string): Promise<Contract | null> {
    return this.repository.findOne({ where: { address } });
  }

  /**
   * 배포자 주소로 조회
   */
  async findByDeployer(deployer: string): Promise<Contract[]> {
    return this.repository.find({
      where: { deployer: ILike(deployer) },
      order: { blockNumber: 'DESC', createdAt: 'DESC' },
    });
  }

  /**
   * 배포자 주소 기준 페이징 조회
   */
  async findPaginatedByDeployer(
    deployer: string,
    page: number,
    limit: number,
  ): Promise<[Contract[], number]> {
    const skip = (page - 1) * limit;

    return this.repository.findAndCount({
      where: { deployer: ILike(deployer) },
      order: { blockNumber: 'DESC', createdAt: 'DESC' },
      skip,
      take: limit,
    });
  }

  /**
   * 컨트랙트 저장
   */
  async save(contract: Contract): Promise<Contract> {
    return this.repository.save(contract);
  }

  /**
   * 컨트랙트 업데이트 (ABI 등)
   * 
   * JSONB 필드를 포함한 업데이트를 위해 save 메서드 사용
   */
  async update(address: string, updates: Partial<Contract>): Promise<void> {
    const contract = await this.findByAddress(address);
    if (!contract) {
      throw new Error(`Contract not found: ${address}`);
    }
    
    // 업데이트할 필드만 병합
    Object.assign(contract, updates);
    
    // save 메서드 사용 (JSONB 필드 업데이트 보장)
    await this.repository.save(contract);
  }

  /**
   * 전체 컨트랙트 개수 조회
   */
  async count(): Promise<number> {
    return this.repository.count();
  }

  /**
   * 컨트랙트 목록 페이징 조회 (최신순)
   * @param page - 페이지 번호 (1부터 시작)
   * @param limit - 페이지당 개수
   * @returns [컨트랙트 배열, 전체 개수]
   */
  async findPaginated(page: number, limit: number): Promise<[Contract[], number]> {
    const skip = (page - 1) * limit;

    return this.repository.findAndCount({
      order: { blockNumber: 'DESC', createdAt: 'DESC' },
      skip,
      take: limit,
    });
  }
}

