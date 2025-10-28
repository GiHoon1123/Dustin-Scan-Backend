import { weiToDstn } from '@app/common';
import { Block, Transaction, TransactionReceipt } from '@app/database';
import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TransactionResponseDto } from '../transactions/dto/transaction-response.dto';
import { BlockDetailResponseDto } from './dto/block-detail-response.dto';
import { BlockResponseDto } from './dto/block-response.dto';

/**
 * 블록 조회 서비스
 */
@Injectable()
export class BlocksService {
  constructor(
    @InjectRepository(Block)
    private blockRepo: Repository<Block>,
    @InjectRepository(Transaction)
    private transactionRepo: Repository<Transaction>,
    @InjectRepository(TransactionReceipt)
    private receiptRepo: Repository<TransactionReceipt>,
  ) {}

  /**
   * 블록 목록 조회 (최신순)
   *
   * @param page - 페이지 번호 (1부터 시작)
   * @param limit - 페이지당 개수
   * @returns 블록 목록 및 전체 개수
   */
  async getBlocks(
    page = 1,
    limit = 20,
  ): Promise<{ blocks: BlockResponseDto[]; totalCount: number }> {
    const skip = (page - 1) * limit;

    const [blocks, totalCount] = await this.blockRepo.findAndCount({
      order: { number: 'DESC' },
      take: limit,
      skip,
    });

    return {
      blocks: blocks.map((block) => this.toListDto(block)),
      totalCount,
    };
  }

  /**
   * 블록 상세 조회 (해시로)
   *
   * @param hash - 블록 해시
   * @returns 블록 상세 (트랜잭션 포함)
   */
  async getBlockByHash(hash: string): Promise<BlockDetailResponseDto> {
    const block = await this.blockRepo.findOne({ where: { hash } });

    if (!block) {
      throw new NotFoundException(`블록 해시 ${hash}를 찾을 수 없습니다`);
    }

    return this.toDetailDto(block);
  }

  /**
   * 블록 상세 조회 (번호로)
   *
   * @param number - 블록 번호
   * @returns 블록 상세 (트랜잭션 포함)
   */
  async getBlockByNumber(number: number): Promise<BlockDetailResponseDto> {
    const block = await this.blockRepo.findOne({
      where: { number: number.toString() },
    });

    if (!block) {
      throw new NotFoundException(`블록 번호 #${number}를 찾을 수 없습니다`);
    }

    return this.toDetailDto(block);
  }

  /**
   * Entity → 목록용 DTO 변환 (트랜잭션 제외)
   */
  private toListDto(block: Block): BlockResponseDto {
    return {
      hash: block.hash,
      number: block.number,
      timestamp: block.timestamp,
      parentHash: block.parentHash,
      proposer: block.proposer,
      transactionCount: block.transactionCount,
      stateRoot: block.stateRoot,
      transactionsRoot: block.transactionsRoot,
      receiptsRoot: block.receiptsRoot,
      createdAt: block.createdAt.toISOString(),
    };
  }

  /**
   * Entity → 상세용 DTO 변환 (트랜잭션 포함)
   */
  private async toDetailDto(block: Block): Promise<BlockDetailResponseDto> {
    // 블록에 포함된 트랜잭션 조회
    const transactions = await this.transactionRepo.find({
      where: { blockHash: block.hash },
      order: { nonce: 'ASC' },
    });

    // 각 트랜잭션에 대한 Receipt 조회
    const transactionDtos = await Promise.all(
      transactions.map(async (tx) => {
        const receipt = await this.receiptRepo.findOne({
          where: { transactionHash: tx.hash },
        });

        return this.txToDto(tx, receipt);
      }),
    );

    return {
      hash: block.hash,
      number: block.number,
      timestamp: block.timestamp,
      parentHash: block.parentHash,
      proposer: block.proposer,
      transactionCount: block.transactionCount,
      stateRoot: block.stateRoot,
      transactionsRoot: block.transactionsRoot,
      receiptsRoot: block.receiptsRoot,
      createdAt: block.createdAt.toISOString(),
      transactions: transactionDtos,
    };
  }

  /**
   * Transaction Entity → DTO 변환
   */
  private txToDto(tx: Transaction, receipt: TransactionReceipt | null): TransactionResponseDto {
    return {
      hash: tx.hash,
      blockHash: tx.blockHash,
      blockNumber: tx.blockNumber,
      from: tx.from,
      to: tx.to,
      value: weiToDstn(tx.value),
      valueWei: tx.value,
      nonce: tx.nonce,
      timestamp: tx.timestamp,
      createdAt: tx.createdAt.toISOString(),
      status: receipt?.status,
      gasUsed: receipt?.gasUsed,
      cumulativeGasUsed: receipt?.cumulativeGasUsed,
      contractAddress: receipt?.contractAddress,
    };
  }
}
