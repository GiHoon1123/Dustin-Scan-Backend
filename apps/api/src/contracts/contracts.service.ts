import { ChainClientService } from '@app/chain-client';
import { Contract, ContractRepository } from '@app/database';
import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { ContractResponseDto } from './dto/contract-response.dto';
import { DeployContractDto, DeployContractResponseDto } from './dto/deploy-contract.dto';
import { UpdateContractAbiDto } from './dto/update-contract-abi.dto';

/**
 * Contracts Service
 *
 * 컨트랙트 정보 관리 서비스
 */
@Injectable()
export class ContractsService {
  private readonly logger = new Logger(ContractsService.name);

  constructor(
    private readonly contractRepo: ContractRepository,
    private readonly chainClient: ChainClientService,
  ) {}

  /**
   * 컨트랙트 조회 (주소로)
   */
  async getContract(address: string): Promise<ContractResponseDto> {
    const contract = await this.contractRepo.findByAddress(address);

    if (!contract) {
      throw new NotFoundException(`Contract not found: ${address}`);
    }

    return this.toDto(contract);
  }

  /**
   * 컨트랙트 배포
   *
   * 바이트코드를 받아서 코어의 배포 API를 호출합니다.
   * 배포 후 트랜잭션 해시를 반환하고, Indexer가 자동으로 Contract 테이블에 저장합니다.
   * ABI는 나중에 PUT /contracts/:address/abi로 업데이트 가능합니다.
   */
  async deployContract(dto: DeployContractDto): Promise<DeployContractResponseDto> {
    // 코어에 배포 요청
    const deployResult = await this.chainClient.deployContract(dto.bytecode);

    this.logger.log(`Contract deployment transaction submitted: ${deployResult.hash}`);

    return {
      transactionHash: deployResult.hash,
      status: deployResult.status,
      contractAddress: null, // 블록 포함 후 Receipt에서 확인
    };
  }

  /**
   * 컨트랙트 ABI 업데이트
   *
   * 이미 배포된 컨트랙트에 ABI 정보 추가/업데이트
   */
  async updateContractAbi(
    address: string,
    dto: UpdateContractAbiDto,
  ): Promise<ContractResponseDto> {
    const contract = await this.contractRepo.findByAddress(address);

    if (!contract) {
      throw new NotFoundException(`Contract not found: ${address}`);
    }

    // 디버깅: DTO 내용 확인
    this.logger.log(
      `[ABI Update] Contract: ${address}, DTO keys: ${Object.keys(dto).join(', ')}, ABI: ${JSON.stringify(dto.abi)?.substring(0, 100)}`,
    );

    // 업데이트할 필드만 수집
    const updates: Partial<Contract> = {};

    if (dto.abi !== undefined && dto.abi !== null) {
      this.logger.log(
        `[ABI Update] Setting ABI, length: ${Array.isArray(dto.abi) ? dto.abi.length : 'not array'}`,
      );
      updates.abi = dto.abi;
    }

    if (dto.bytecode !== undefined && dto.bytecode !== null) {
      updates.bytecode = dto.bytecode;
    }

    if (dto.name !== undefined && dto.name !== null) {
      updates.name = dto.name;
    }

    if (dto.sourceCode !== undefined && dto.sourceCode !== null) {
      updates.sourceCode = dto.sourceCode;
    }

    if (dto.compilerVersion !== undefined && dto.compilerVersion !== null) {
      updates.compilerVersion = dto.compilerVersion;
    }

    if (dto.optimization !== undefined && dto.optimization !== null) {
      updates.optimization = dto.optimization;
    }

    // 업데이트할 필드가 없으면 그대로 반환
    if (Object.keys(updates).length === 0) {
      this.logger.warn(`[ABI Update] No updates to apply for contract ${address}`);
      return this.toDto(contract);
    }

    // 직접 UPDATE 쿼리 실행
    this.logger.log(
      `[ABI Update] Updating contract ${address} with fields: ${Object.keys(updates).join(', ')}`,
    );
    await this.contractRepo.update(address, updates);
    this.logger.log(`[ABI Update] Update query executed`);

    // 업데이트된 컨트랙트 조회
    const updated = await this.contractRepo.findByAddress(address);
    if (!updated) {
      throw new NotFoundException(`Contract not found after update: ${address}`);
    }

    this.logger.log(`[ABI Update] Verified: ABI is ${updated.abi ? 'present' : 'null'}`);

    return this.toDto(updated);
  }

  /**
   * Entity → DTO 변환
   */
  private toDto(contract: Contract): ContractResponseDto {
    return {
      address: contract.address,
      deployer: contract.deployer,
      transactionHash: contract.transactionHash,
      blockNumber: contract.blockNumber,
      blockHash: contract.blockHash,
      bytecode: contract.bytecode,
      abi: contract.abi,
      name: contract.name,
      sourceCode: contract.sourceCode,
      compilerVersion: contract.compilerVersion,
      optimization: contract.optimization,
      timestamp: contract.timestamp,
      createdAt: contract.createdAt.toISOString(),
    };
  }
}
