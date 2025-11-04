import { ChainClientService } from '@app/chain-client';
import {
  Contract,
  ContractMethod,
  ContractMethodRepository,
  ContractRepository,
} from '@app/database';
import { BadRequestException, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { Interface } from 'ethers';
import { CallContractDto, CallContractResponseDto } from './dto/call-contract.dto';
import { ContractResponseDto } from './dto/contract-response.dto';
import { DeployContractDto, DeployContractResponseDto } from './dto/deploy-contract.dto';
import { ExecuteContractDto, ExecuteContractResponseDto } from './dto/execute-contract.dto';
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
    private readonly methodRepo: ContractMethodRepository,
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

    // ABI가 업데이트된 경우 메서드 정보 캐싱
    if (updates.abi && updated.abi) {
      await this.cacheContractMethods(address, updated.abi);
    }

    return this.toDto(updated);
  }

  /**
   * 컨트랙트 메서드 실행
   *
   * 1. DB에서 캐시된 메서드 정보 조회
   * 2. 없으면 ABI에서 파싱 후 캐싱
   * 3. 파라미터 인코딩
   * 4. 코어에 전달
   */
  async executeContract(
    address: string,
    dto: ExecuteContractDto,
  ): Promise<ExecuteContractResponseDto> {
    // 1. 컨트랙트 조회
    const contract = await this.contractRepo.findByAddress(address);
    if (!contract) {
      throw new NotFoundException(`Contract not found: ${address}`);
    }

    // 2. ABI 확인
    if (!contract.abi || contract.abi.length === 0) {
      throw new BadRequestException(
        `Contract ABI not found. Please upload ABI first using PUT /contracts/${address}/abi`,
      );
    }

    try {
      // 3. DB에서 캐시된 메서드 조회
      let cachedMethod = await this.methodRepo.findByContractAndMethod(address, dto.methodName);

      // 4. 캐시가 없으면 ABI에서 파싱 후 캐싱
      if (!cachedMethod) {
        this.logger.log(
          `[Method Cache] Cache miss for ${address}.${dto.methodName}, parsing ABI...`,
        );
        const iface = new Interface(contract.abi);
        const method = iface.getFunction(dto.methodName);

        if (!method) {
          throw new BadRequestException(`Method "${dto.methodName}" not found in contract ABI`);
        }

        // 메서드 정보 캐싱 (fragment는 이미 FunctionFragment 타입)
        cachedMethod = this.cacheMethod(address, method);
        await this.methodRepo.save(cachedMethod);
      }

      // 5. 캐시된 시그니처로 파라미터만 인코딩 (시그니처는 재사용)
      const iface = new Interface(contract.abi);
      const encodedData = iface.encodeFunctionData(dto.methodName, dto.params);
      this.logger.log(
        `[Method Cache] Using cached method "${dto.methodName}" (${cachedMethod.methodSignature})`,
      );

      // 6. 코어에 전달
      const result = await this.chainClient.executeContract(address, encodedData);

      return {
        transactionHash: result.hash,
        status: result.status,
      };
    } catch (error: any) {
      if (error instanceof BadRequestException || error instanceof NotFoundException) {
        throw error;
      }
      this.logger.error(`Failed to execute contract method: ${error.message}`, error);
      throw new BadRequestException(`Failed to execute contract method: ${error.message}`);
    }
  }

  /**
   * 컨트랙트 읽기 메서드 호출 (view, pure)
   *
   * 1. DB에서 캐시된 메서드 정보 조회
   * 2. 없으면 ABI에서 파싱 후 캐싱
   * 3. 파라미터 인코딩
   * 4. 코어에 호출 (트랜잭션 없이 직접 실행)
   * 5. 결과 디코딩
   */
  async callContract(address: string, dto: CallContractDto): Promise<CallContractResponseDto> {
    // 1. 컨트랙트 조회
    const contract = await this.contractRepo.findByAddress(address);
    if (!contract) {
      throw new NotFoundException(`Contract not found: ${address}`);
    }

    // 2. ABI 확인
    if (!contract.abi || contract.abi.length === 0) {
      throw new BadRequestException(
        `Contract ABI not found. Please upload ABI first using PUT /contracts/${address}/abi`,
      );
    }

    try {
      // 3. DB에서 캐시된 메서드 조회
      let cachedMethod = await this.methodRepo.findByContractAndMethod(address, dto.methodName);

      // 4. 캐시가 없으면 ABI에서 파싱 후 캐싱
      if (!cachedMethod) {
        this.logger.log(
          `[Method Cache] Cache miss for ${address}.${dto.methodName}, parsing ABI...`,
        );
        const iface = new Interface(contract.abi);
        const method = iface.getFunction(dto.methodName);

        if (!method) {
          throw new BadRequestException(`Method "${dto.methodName}" not found in contract ABI`);
        }

        // 메서드 정보 캐싱 (fragment는 이미 FunctionFragment 타입)
        cachedMethod = this.cacheMethod(address, method);
        await this.methodRepo.save(cachedMethod);
      }

      // 5. 파라미터 인코딩
      const iface = new Interface(contract.abi);
      const encodedData = iface.encodeFunctionData(dto.methodName, dto.params);
      this.logger.log(
        `[Method Cache] Calling method "${dto.methodName}" (${cachedMethod.methodSignature})`,
      );

      // 6. 코어에 호출 (트랜잭션 없이 직접 실행)
      const result = await this.chainClient.callContract(address, encodedData);

      // 7. 결과 디코딩
      let decodedResult: any = null;
      try {
        const decoded = iface.decodeFunctionResult(dto.methodName, result.result);
        // 단일 반환값이면 그대로, 배열이면 배열로 반환
        decodedResult = decoded.length === 1 ? decoded[0] : decoded;
      } catch (decodeError) {
        this.logger.warn(`Failed to decode result: ${decodeError}`);
        // 디코딩 실패해도 원본 hex string 반환
      }

      return {
        result: result.result,
        gasUsed: result.gasUsed,
        decodedResult,
      };
    } catch (error: any) {
      if (error instanceof BadRequestException || error instanceof NotFoundException) {
        throw error;
      }
      this.logger.error(`Failed to call contract method: ${error.message}`, error);
      throw new BadRequestException(`Failed to call contract method: ${error.message}`);
    }
  }

  /**
   * 컨트랙트 메서드 정보 캐싱 (ABI 업데이트 시)
   */
  private async cacheContractMethods(address: string, abi: any[]): Promise<void> {
    try {
      // 기존 메서드 삭제
      await this.methodRepo.deleteByContractAddress(address);

      // ABI 파싱
      const iface = new Interface(abi);
      const methods: ContractMethod[] = [];

      // 모든 함수 메서드 추출
      for (const fragment of iface.fragments) {
        if (fragment.type === 'function') {
          const method = this.cacheMethod(address, fragment);
          methods.push(method);
        }
      }

      if (methods.length > 0) {
        await this.methodRepo.saveMany(methods);
        this.logger.log(`[Method Cache] Cached ${methods.length} methods for contract ${address}`);
      }
    } catch (error: any) {
      this.logger.error(`Failed to cache contract methods: ${error.message}`, error);
      // 메서드 캐싱 실패해도 ABI 업데이트는 성공으로 처리
    }
  }

  /**
   * 개별 메서드 캐싱
   */
  private cacheMethod(address: string, fragment: any): ContractMethod {
    const iface = new Interface([fragment]);
    const methodSignature = iface.getFunction(fragment.name)?.selector || '';

    const method = new ContractMethod();
    method.contractAddress = address;
    method.methodName = fragment.name;
    method.methodSignature = methodSignature;
    method.inputs = fragment.inputs.map((input: any) => ({
      name: input.name || '',
      type: input.type,
      internalType: input.internalType,
    }));
    method.type = fragment.type;
    method.stateMutability = fragment.stateMutability || null;

    return method;
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
