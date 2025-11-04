import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ContractMethod } from '../entities/contract-method.entity';

/**
 * Contract Method Repository
 *
 * 컨트랙트 메서드 정보 접근
 */
@Injectable()
export class ContractMethodRepository {
  constructor(
    @InjectRepository(ContractMethod)
    private readonly repository: Repository<ContractMethod>,
  ) {}

  /**
   * 컨트랙트 주소로 모든 메서드 조회
   */
  async findByContractAddress(address: string): Promise<ContractMethod[]> {
    return this.repository.find({
      where: { contractAddress: address },
      order: { methodName: 'ASC' },
    });
  }

  /**
   * 컨트랙트 주소와 메서드 이름으로 조회
   */
  async findByContractAndMethod(
    address: string,
    methodName: string,
  ): Promise<ContractMethod | null> {
    return this.repository.findOne({
      where: { contractAddress: address, methodName },
    });
  }

  /**
   * 메서드 저장 (배치)
   */
  async saveMany(methods: ContractMethod[]): Promise<ContractMethod[]> {
    return this.repository.save(methods);
  }

  /**
   * 컨트랙트의 모든 메서드 삭제 (ABI 업데이트 시)
   */
  async deleteByContractAddress(address: string): Promise<void> {
    await this.repository.delete({ contractAddress: address });
  }

  /**
   * 메서드 저장
   */
  async save(method: ContractMethod): Promise<ContractMethod> {
    return this.repository.save(method);
  }
}

