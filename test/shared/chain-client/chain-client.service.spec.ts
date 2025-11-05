import { Test, TestingModule } from '@nestjs/testing';
import axios from 'axios';
import { ChainClientService } from '../../../shared/chain-client/chain-client.service';
import {
  ChainAccountDto,
  ChainBlockDto,
  ChainReceiptDto,
  ChainStatsDto,
  ChainTransactionDto,
} from '@app/common/types/chain-rpc.types';

jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

describe('ChainClientService', () => {
  let service: ChainClientService;
  let mockAxiosInstance: any;

  const mockBlock: ChainBlockDto = {
    number: '0x64',
    hash: '0xblockhash',
    parentHash: '0xparent',
    timestamp: '0x617e0f42',
    proposer: '0xproposer',
    transactionCount: '0x2',
    transactions: [],
    stateRoot: '0xstateroot',
    transactionsRoot: '0xtxroot',
    receiptsRoot: '0xreceiptroot',
  };

  const mockTx: ChainTransactionDto = {
    hash: '0xtxhash',
    from: '0xfrom',
    to: '0xto',
    value: '0x2386f26fc10000',
    nonce: '0x1',
    v: '0x1b',
    r: '0xr',
    s: '0xs',
    timestamp: '0x617e0f42',
  };

  const mockReceipt: ChainReceiptDto = {
    transactionHash: '0xtxhash',
    transactionIndex: '0x0',
    blockHash: '0xblockhash',
    blockNumber: '0x64',
    from: '0xfrom',
    to: '0xto',
    status: '0x1',
    gasUsed: '0x5208',
    cumulativeGasUsed: '0x5208',
    contractAddress: null,
    logs: [],
    logsBloom: '0x0',
  };

  beforeEach(() => {
    process.env.CHAIN_URL = 'http://localhost:3000';

    mockAxiosInstance = {
      get: jest.fn(),
      post: jest.fn(),
    };

    mockedAxios.create = jest.fn().mockReturnValue(mockAxiosInstance);
  });

  afterEach(() => {
    delete process.env.CHAIN_URL;
    jest.clearAllMocks();
  });

  describe('constructor', () => {
    it('should initialize with CHAIN_URL', () => {
      service = new ChainClientService();
      expect(mockedAxios.create).toHaveBeenCalled();
    });

    it('should throw error if CHAIN_URL is not set', () => {
      delete process.env.CHAIN_URL;
      expect(() => new ChainClientService()).toThrow('CHAIN_URL environment variable is required');
    });
  });

  describe('getLatestBlock', () => {
    beforeEach(() => {
      service = new ChainClientService();
    });

    it('should fetch latest block', async () => {
      mockAxiosInstance.get.mockResolvedValue({ data: mockBlock });

      const result = await service.getLatestBlock();

      expect(result).toEqual(mockBlock);
      expect(mockAxiosInstance.get).toHaveBeenCalledWith('/block/latest');
    });

    it('should handle errors', async () => {
      mockAxiosInstance.get.mockRejectedValue(new Error('Network error'));

      await expect(service.getLatestBlock()).rejects.toThrow('Network error');
    });
  });

  describe('getBlockByNumber', () => {
    beforeEach(() => {
      service = new ChainClientService();
    });

    it('should fetch block by number', async () => {
      mockAxiosInstance.get.mockResolvedValue({ data: mockBlock });

      const result = await service.getBlockByNumber(100);

      expect(result).toEqual(mockBlock);
      expect(mockAxiosInstance.get).toHaveBeenCalledWith('/block/number/100');
    });

    it('should return null on 404', async () => {
      const error = { response: { status: 404 } };
      mockAxiosInstance.get.mockRejectedValue(error);

      const result = await service.getBlockByNumber(999);

      expect(result).toBeNull();
    });

    it('should throw on other errors', async () => {
      mockAxiosInstance.get.mockRejectedValue(new Error('Network error'));

      await expect(service.getBlockByNumber(100)).rejects.toThrow('Network error');
    });
  });

  describe('getBlockByHash', () => {
    beforeEach(() => {
      service = new ChainClientService();
    });

    it('should fetch block by hash', async () => {
      mockAxiosInstance.get.mockResolvedValue({ data: mockBlock });

      const result = await service.getBlockByHash('0xblockhash');

      expect(result).toEqual(mockBlock);
      expect(mockAxiosInstance.get).toHaveBeenCalledWith('/block/hash/0xblockhash');
    });
  });

  describe('getChainStats', () => {
    beforeEach(() => {
      service = new ChainClientService();
    });

    it('should fetch chain stats', async () => {
      const mockStats: ChainStatsDto = {
        height: 100,
        latestBlockNumber: 100,
        latestBlockHash: '0xblockhash',
        totalTransactions: 500,
        genesisProposer: '0xgenesis',
      };
      mockAxiosInstance.get.mockResolvedValue({ data: mockStats });

      const result = await service.getChainStats();

      expect(result).toEqual(mockStats);
      expect(mockAxiosInstance.get).toHaveBeenCalledWith('/block/stats');
    });
  });

  describe('getTransaction', () => {
    beforeEach(() => {
      service = new ChainClientService();
    });

    it('should fetch transaction', async () => {
      mockAxiosInstance.get.mockResolvedValue({ data: mockTx });

      const result = await service.getTransaction('0xtxhash');

      expect(result).toEqual(mockTx);
      expect(mockAxiosInstance.get).toHaveBeenCalledWith('/transaction/0xtxhash');
    });
  });

  describe('getReceipt', () => {
    beforeEach(() => {
      service = new ChainClientService();
    });

    it('should fetch receipt', async () => {
      mockAxiosInstance.get.mockResolvedValue({ data: mockReceipt });

      const result = await service.getReceipt('0xtxhash');

      expect(result).toEqual(mockReceipt);
      expect(mockAxiosInstance.get).toHaveBeenCalledWith('/transaction/0xtxhash/receipt');
    });

    it('should return null when receipt not found', async () => {
      mockAxiosInstance.get.mockResolvedValue({ data: null });

      const result = await service.getReceipt('0xtxhash');

      expect(result).toBeNull();
    });
  });

  describe('getAccount', () => {
    beforeEach(() => {
      service = new ChainClientService();
    });

    it('should fetch account', async () => {
      const mockAccount: ChainAccountDto = {
        address: '0x123',
        balance: '0x2386f26fc10000',
        nonce: '0x5',
      };
      mockAxiosInstance.get.mockResolvedValue({ data: mockAccount });

      const result = await service.getAccount('0x123');

      expect(result).toEqual(mockAccount);
      expect(mockAxiosInstance.get).toHaveBeenCalledWith('/account/0x123');
    });
  });

  describe('healthCheck', () => {
    beforeEach(() => {
      service = new ChainClientService();
    });

    it('should return true when chain is healthy', async () => {
      mockAxiosInstance.get.mockResolvedValue({ data: { height: 100 } });

      const result = await service.healthCheck();

      expect(result).toBe(true);
    });

    it('should return false when chain is unhealthy', async () => {
      mockAxiosInstance.get.mockRejectedValue(new Error('Network error'));

      const result = await service.healthCheck();

      expect(result).toBe(false);
    });
  });

  describe('getLatestBlockNumber', () => {
    beforeEach(() => {
      service = new ChainClientService();
    });

    it('should return latest block number', async () => {
      const mockStats: ChainStatsDto = {
        height: 100,
        latestBlockNumber: 100,
        latestBlockHash: '0xblockhash',
        totalTransactions: 500,
        genesisProposer: '0xgenesis',
      };
      mockAxiosInstance.get.mockResolvedValue({ data: mockStats });

      const result = await service.getLatestBlockNumber();

      expect(result).toBe(100);
    });
  });

  describe('getContractBytecode', () => {
    beforeEach(() => {
      service = new ChainClientService();
    });

    it('should fetch contract bytecode', async () => {
      mockAxiosInstance.get.mockResolvedValue({ data: { bytecode: '0x6080604052' } });

      const result = await service.getContractBytecode('0x123');

      expect(result).toBe('0x6080604052');
      expect(mockAxiosInstance.get).toHaveBeenCalledWith('/contract/0x123/bytecode');
    });

    it('should return 0x when bytecode not found', async () => {
      mockAxiosInstance.get.mockRejectedValue(new Error('Not found'));

      const result = await service.getContractBytecode('0x123');

      expect(result).toBe('0x');
    });
  });

  describe('deployContract', () => {
    beforeEach(() => {
      service = new ChainClientService();
    });

    it('should deploy contract', async () => {
      mockAxiosInstance.post.mockResolvedValue({
        data: { hash: '0xdeployhash', status: 'pending' },
      });

      const result = await service.deployContract('0x6080604052');

      expect(result).toEqual({ hash: '0xdeployhash', status: 'pending' });
      expect(mockAxiosInstance.post).toHaveBeenCalledWith('/contract/deploy', {
        bytecode: '0x6080604052',
      });
    });
  });

  describe('executeContract', () => {
    beforeEach(() => {
      service = new ChainClientService();
    });

    it('should execute contract', async () => {
      mockAxiosInstance.post.mockResolvedValue({
        data: { hash: '0xexecHash', status: 'pending' },
      });

      const result = await service.executeContract('0x123', '0xdata');

      expect(result).toEqual({ hash: '0xexecHash', status: 'pending' });
      expect(mockAxiosInstance.post).toHaveBeenCalledWith('/contract/execute', {
        to: '0x123',
        data: '0xdata',
      });
    });
  });

  describe('callContract', () => {
    beforeEach(() => {
      service = new ChainClientService();
    });

    it('should call contract', async () => {
      mockAxiosInstance.post.mockResolvedValue({
        data: { result: '0x42', gasUsed: '0x100' },
      });

      const result = await service.callContract('0x123', '0xdata');

      expect(result).toEqual({ result: '0x42', gasUsed: '0x100' });
      expect(mockAxiosInstance.post).toHaveBeenCalledWith('/contract/call', {
        to: '0x123',
        data: '0xdata',
      });
    });

    it('should call contract with from parameter', async () => {
      mockAxiosInstance.post.mockResolvedValue({
        data: { result: '0x42', gasUsed: '0x100' },
      });

      const result = await service.callContract('0x123', '0xdata', '0xfrom');

      expect(result).toEqual({ result: '0x42', gasUsed: '0x100' });
      expect(mockAxiosInstance.post).toHaveBeenCalledWith('/contract/call', {
        to: '0x123',
        data: '0xdata',
        from: '0xfrom',
      });
    });
  });
});

