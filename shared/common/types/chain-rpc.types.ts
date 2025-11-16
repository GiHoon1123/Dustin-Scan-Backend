/**
 * Dustin-Chain RPC API 타입 정의
 *
 * Dustin-Chain (localhost:3000)에서 받아오는 데이터 타입
 * 모든 숫자는 Hex String 형식
 */

/**
 * 블록 정보 (from Chain)
 */
export interface ChainBlockDto {
  number: string; // Hex String
  hash: string;
  parentHash: string;
  timestamp: string; // Hex String (Unix timestamp)
  proposer: string;
  transactionCount: string; // Hex String
  transactions: ChainTransactionDto[];
  stateRoot: string;
  transactionsRoot: string;
  receiptsRoot: string;
  /**
   * Logs Bloom Filter (Ethereum logsBloom)
   *
   * Dustin-Chain Block.toJSON에서 Header에 포함되는 필드로,
   * 블록 내 모든 Receipt의 logsBloom을 OR 연산한 결과입니다.
   * 현재 인덱서에서는 직접 사용하지 않지만, raw 필드로 저장된
   * 원본 블록 데이터에서 참조할 수 있도록 타입에 반영합니다.
   */
  logsBloom?: string;
}

/**
 * 트랜잭션 정보 (from Chain)
 */
export interface ChainTransactionDto {
  hash: string;
  from: string;
  to: string;
  value: string; // Hex String (Wei)
  nonce: string; // Hex String
  v: string; // Hex String
  r: string;
  s: string;
  blockNumber?: string; // Hex String
  blockHash?: string;
  transactionIndex?: string; // Hex String
  timestamp: string; // Hex String (Unix timestamp)
}

/**
 * 트랜잭션 Receipt 정보 (from Chain)
 */
export interface ChainReceiptDto {
  transactionHash: string;
  transactionIndex: string; // Hex String
  blockHash: string;
  blockNumber: string; // Hex String
  from: string;
  to: string;
  status: string; // Hex String (0x0 or 0x1)
  gasUsed: string; // Hex String (Wei)
  cumulativeGasUsed: string; // Hex String (Wei)
  contractAddress: string | null;
  logs: any[];
  logsBloom: string;
}

/**
 * 계정 정보 (from Chain)
 */
export interface ChainAccountDto {
  address: string;
  balance: string; // Hex String (Wei)
  nonce: string; // Hex String
}

/**
 * 체인 통계 (from Chain)
 */
export interface ChainStatsDto {
  height: number; // Decimal
  latestBlockNumber: number; // Decimal
  latestBlockHash: string;
  totalTransactions: number; // Decimal
  genesisProposer: string;
}
