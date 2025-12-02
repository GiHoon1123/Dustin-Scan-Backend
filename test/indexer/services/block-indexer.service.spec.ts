import { ChainClientService } from '@app/chain-client';
import {
  ChainBlockDto,
  ChainReceiptDto,
  ChainTransactionDto,
} from '@app/common/types/chain-rpc.types';
import {
  Block,
  Contract,
  Token,
  TokenTransfer,
  Transaction,
  TransactionReceipt,
} from '@app/database';
import { Test, TestingModule } from '@nestjs/testing';
import { DataSource } from 'typeorm';
import { BlockIndexerService } from '../../../apps/indexer/src/services/block-indexer.service';
import { getDataSourceToken } from '@nestjs/typeorm';

describe('BlockIndexerService', () => {
  let service: BlockIndexerService;
  let dataSource: jest.Mocked<DataSource>;
  let chainClient: jest.Mocked<ChainClientService>;

  const mockBlockData: ChainBlockDto = {
    number: '0x64',
    hash: '0xblockhash',
    parentHash: '0xparent',
    timestamp: '0x617e0f42',
    proposer: '0xproposer',
    transactionCount: '0x2',
    transactions: [
      {
        hash: '0xtx1',
        from: '0xfrom1',
        to: '0xto1',
        value: '0x2386f26fc10000',
        nonce: '0x1',
        v: '0x1b',
        r: '0xr',
        s: '0xs',
        timestamp: '0x617e0f42',
      },
    ],
    stateRoot: '0xstateroot',
    transactionsRoot: '0xtxroot',
    receiptsRoot: '0xreceiptroot',
  };

  const mockReceipt: ChainReceiptDto = {
    transactionHash: '0xtx1',
    transactionIndex: '0x0',
    blockHash: '0xblockhash',
    blockNumber: '0x64',
    from: '0xfrom1',
    to: '0xto1',
    status: '0x1',
    gasUsed: '0x5208',
    cumulativeGasUsed: '0x5208',
    contractAddress: null,
    logs: [],
    logsBloom: '0x0',
  };

  beforeEach(async () => {
    const mockTransaction = jest.fn((callback) => callback(mockManager));

    const mockManager = {
      findOne: jest.fn(),
      save: jest.fn(),
    };

    const mockDataSource = {
      transaction: mockTransaction,
    };

    const mockChainClient = {
      getReceipt: jest.fn(),
      getContractBytecode: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        BlockIndexerService,
        {
          provide: getDataSourceToken(),
          useValue: mockDataSource,
        },
        {
          provide: ChainClientService,
          useValue: mockChainClient,
        },
      ],
    }).compile();

    service = module.get<BlockIndexerService>(BlockIndexerService);
    dataSource = module.get(getDataSourceToken());
    chainClient = module.get(ChainClientService);
  });

  describe('indexBlock', () => {
    it('should skip if block already indexed with all child entities', async () => {
      const mockManager = {
        findOne: jest
          .fn()
          .mockResolvedValueOnce({ hash: '0xblockhash' }) // block exists
          .mockResolvedValueOnce({ hash: '0xtx1' }) // transaction exists
          .mockResolvedValueOnce({ transactionHash: '0xtx1' }), // receipt exists
        save: jest.fn(),
      };
      dataSource.transaction = jest.fn().mockImplementation(async (callback) => await callback(mockManager));
      chainClient.getReceipt.mockResolvedValue(mockReceipt);

      await service.indexBlock(mockBlockData);

      expect(mockManager.findOne).toHaveBeenCalledWith(Block, {
        where: { hash: '0xblockhash' },
      });
      // 하위 엔티티도 체크됨
      expect(mockManager.findOne).toHaveBeenCalledWith(Transaction, {
        where: { hash: '0xtx1' },
      });
      expect(mockManager.findOne).toHaveBeenCalledWith(TransactionReceipt, {
        where: { transactionHash: '0xtx1' },
      });
      // 모든 엔티티가 있으면 save 호출 안 됨
      expect(mockManager.save).not.toHaveBeenCalled();
    });

    it('should re-index when block exists but transaction is missing', async () => {
      const mockManager = {
        findOne: jest
          .fn()
          .mockResolvedValueOnce({ hash: '0xblockhash' }) // block exists
          .mockResolvedValueOnce(null), // transaction missing
        save: jest.fn(),
      };
      dataSource.transaction = jest.fn().mockImplementation(async (callback) => await callback(mockManager));
      chainClient.getReceipt.mockResolvedValue(mockReceipt);

      await service.indexBlock(mockBlockData);

      // 하위 엔티티가 없으면 재인덱싱
      expect(mockManager.save).toHaveBeenCalledWith(Block, expect.any(Object));
      expect(mockManager.save).toHaveBeenCalledWith(Transaction, expect.any(Array));
    });

    it('should index new block with transactions', async () => {
      const mockManager = {
        findOne: jest.fn().mockResolvedValue(null),
        save: jest.fn(),
      };
      dataSource.transaction = jest.fn().mockImplementation(async (callback) => await callback(mockManager));
      chainClient.getReceipt.mockResolvedValue(mockReceipt);

      await service.indexBlock(mockBlockData);

      expect(mockManager.save).toHaveBeenCalledWith(Block, expect.any(Object));
      // Batch 저장: 배열로 저장됨
      expect(mockManager.save).toHaveBeenCalledWith(Transaction, expect.any(Array));
      expect(mockManager.save).toHaveBeenCalledWith(TransactionReceipt, expect.any(Array));
      expect(chainClient.getReceipt).toHaveBeenCalled();
    });

    it('should handle missing receipt', async () => {
      const mockManager = {
        findOne: jest.fn().mockResolvedValue(null),
        save: jest.fn(),
      };
      dataSource.transaction = jest.fn().mockImplementation(async (callback) => await callback(mockManager));
      chainClient.getReceipt.mockResolvedValue(null);

      await service.indexBlock(mockBlockData);

      expect(mockManager.save).toHaveBeenCalledWith(Block, expect.any(Object));
      // Batch 저장: 배열로 저장됨
      expect(mockManager.save).toHaveBeenCalledWith(Transaction, expect.any(Array));
      // Receipt가 없으면 Receipt 저장 호출 안 됨
      const receiptSaveCalls = mockManager.save.mock.calls.filter((call) => call[0] === TransactionReceipt);
      expect(receiptSaveCalls).toHaveLength(0);
    });

    it('should save contract when contractAddress exists', async () => {
      const contractReceipt = { ...mockReceipt, contractAddress: '0xcontract' };
      const mockManager = {
        findOne: jest
          .fn()
          .mockResolvedValueOnce(null) // block check
          .mockResolvedValueOnce(null) // transaction check
          .mockResolvedValueOnce(null), // contract check
        save: jest.fn(),
      };
      dataSource.transaction = jest.fn().mockImplementation(async (callback) => await callback(mockManager));
      chainClient.getReceipt.mockResolvedValue(contractReceipt);
      chainClient.getContractBytecode.mockResolvedValue('0x6080604052');

      await service.indexBlock(mockBlockData);

      // Batch 저장: 배열로 저장됨
      expect(mockManager.save).toHaveBeenCalledWith(Contract, expect.any(Array));
      expect(chainClient.getContractBytecode).toHaveBeenCalledWith('0xcontract');
    });

    it('should handle contract bytecode fetch failure', async () => {
      const contractReceipt = { ...mockReceipt, contractAddress: '0xcontract' };
      const mockManager = {
        findOne: jest
          .fn()
          .mockResolvedValueOnce(null) // block check
          .mockResolvedValueOnce(null) // transaction check
          .mockResolvedValueOnce(null), // contract check
        save: jest.fn(),
      };
      dataSource.transaction = jest.fn().mockImplementation(async (callback) => await callback(mockManager));
      chainClient.getReceipt.mockResolvedValue(contractReceipt);
      chainClient.getContractBytecode.mockRejectedValue(new Error('Failed to fetch'));

      await service.indexBlock(mockBlockData);

      // Batch 저장: 배열로 저장됨 (bytecode는 null로 저장됨)
      expect(mockManager.save).toHaveBeenCalledWith(Contract, expect.any(Array));
    });

    it('should skip contract save when contractAddress is null', async () => {
      const receiptWithoutContract = { ...mockReceipt, contractAddress: null };
      const mockManager = {
        findOne: jest.fn().mockResolvedValueOnce(null), // block check
        save: jest.fn(),
      };
      dataSource.transaction = jest.fn().mockImplementation(async (callback) => await callback(mockManager));
      chainClient.getReceipt.mockResolvedValue(receiptWithoutContract);

      await service.indexBlock(mockBlockData);

      // Contract save가 호출되지 않아야 함
      const saveCalls = mockManager.save.mock.calls.filter((call) => call[0] === Contract);
      expect(saveCalls).toHaveLength(0);
    });

    it('should skip contract save when contract already exists', async () => {
      const contractReceipt = { ...mockReceipt, contractAddress: '0xcontract' };
      const mockManager = {
        findOne: jest
          .fn()
          .mockResolvedValueOnce(null) // block check
          .mockResolvedValueOnce(null) // transaction check
          .mockResolvedValueOnce(null) // receipt check
          .mockResolvedValueOnce({ address: '0xcontract' }), // contract exists (parseContract 내부에서 호출)
        save: jest.fn(),
      };
      dataSource.transaction = jest.fn().mockImplementation(async (callback) => await callback(mockManager));
      chainClient.getReceipt.mockResolvedValue(contractReceipt);

      await service.indexBlock(mockBlockData);

      // Contract save가 호출되지 않아야 함
      const saveCalls = mockManager.save.mock.calls.filter((call) => call[0] === Contract);
      expect(saveCalls).toHaveLength(0);
    });

    it('should save token transfers and tokens when transfer logs exist', async () => {
      const transferTopic =
        '0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef';

      const receiptWithLogs: ChainReceiptDto = {
        ...mockReceipt,
        logs: [
          {
            address: '0xTokenAddress',
            topics: [
              transferTopic,
              // 32바이트 hex (64자리) - 마지막 40자리가 주소 (20바이트)
              // 0x + 24자리 0 + 40자리 주소 = 66자리 (0x 포함)
              // from1을 40자리로 패딩: 앞에 35개의 0 추가
              '0x000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000from1',
              '0x000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000to1',
            ],
            data: '0x01',
            logIndex: 0,
          } as any,
        ],
      };

      const mockManager = {
        findOne: jest
          .fn()
          .mockResolvedValueOnce(null) // block check
          .mockResolvedValueOnce(null) // transaction check
          .mockResolvedValueOnce(null) // token transfer check
          .mockResolvedValueOnce(null), // token check
        save: jest.fn(),
      };

      dataSource.transaction = jest
        .fn()
        .mockImplementation(async (callback) => await callback(mockManager));
      chainClient.getReceipt.mockResolvedValue(receiptWithLogs);

      await service.indexBlock(mockBlockData);

      // TokenTransfer 저장 확인 (배열로 저장됨)
      const transferSaveCall = mockManager.save.mock.calls.find(
        (call) => call[0] === TokenTransfer,
      );
      expect(transferSaveCall).toBeDefined();
      const savedTransfers = transferSaveCall?.[1] as TokenTransfer[];
      expect(Array.isArray(savedTransfers)).toBe(true);
      expect(savedTransfers.length).toBeGreaterThan(0);
      const savedTransfer = savedTransfers[0];
      expect(savedTransfer.tokenAddress).toBe('0xtokenaddress');
      // decodeAddressFromTopic은 마지막 40자리를 주소로 추출
      // 토픽: '0x...00000000000000000000000000000000000from1' -> 마지막 40자리: '00000000000000000000000000000000000from1'
      expect(savedTransfer.from).toBe('0x00000000000000000000000000000000000from1');
      expect(savedTransfer.to).toBe('0x0000000000000000000000000000000000000to1');
      expect(savedTransfer.value).toBe('1');

      // Token 저장 확인
      const tokenSaveCall = mockManager.save.mock.calls.find(
        (call) => call[0] === Token,
      );
      expect(tokenSaveCall).toBeDefined();
      const savedToken = tokenSaveCall?.[1] as Token;
      expect(savedToken.address).toBe('0xtokenaddress');
    });
  });
});

