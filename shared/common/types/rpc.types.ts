// Dustin-Chain RPC Response Types

export interface RpcBlock {
  number: string; // hex
  hash: string;
  parentHash: string;
  timestamp: string; // hex
  proposer: string;
  transactionCount: string; // hex
  transactions: RpcTransaction[];
  stateRoot: string;
  transactionsRoot: string;
  receiptsRoot: string;
}

export interface RpcTransaction {
  hash: string;
  from: string;
  to: string;
  value: string; // hex
  nonce: string; // hex
  v: string;
  r: string;
  s: string;
  status: string;
  timestamp: string; // hex
  blockHash?: string;
}

export interface RpcAccount {
  address: string;
  balance: string; // hex
  nonce: string; // hex
}
