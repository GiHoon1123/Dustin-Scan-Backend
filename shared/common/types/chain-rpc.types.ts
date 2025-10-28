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
