export interface Wallet {
  address: string;
  privateKey: string;
  mnemonic?: string;
  publicKey?: string;
}

export interface WalletData {
  address: string;
  privateKey: string;
  publicKey: string;
  balance: number;
  nonce: number;
  mnemonic?: string;
}

export interface MultiSendRecipient {
  address: string;
  amount: number;
}

export interface TransactionData {
  from: string;
  to: string;
  amount: number;
  gasPrice: number;
  gasLimit: number;
  privateKey: string;
}

export interface WalletBalance {
  balance: number;
  currency: string;
}

// New interfaces for the actual API
export interface BalanceResponse {
  balance: number;
  nonce: number;
}

export interface Transaction {
  from: string;
  to_: string;
  amount: string;
  nonce: number;
  ou: string;
  timestamp: number;
  signature?: string;
  public_key?: string;
}

export interface AddressHistoryResponse {
  transactions: TransactionHistoryItem[];
  balance: number;
}

export interface TransactionHistoryItem {
  hash: string;
  from: string;
  to: string;
  amount: number;
  timestamp: number;
  status: 'confirmed' | 'pending' | 'failed';
  type: 'sent' | 'received';
}

// New interface for transaction details
export interface TransactionDetails {
  parsed_tx: {
    from: string;
    to: string;
    amount: string;
    amount_raw: string;
    nonce: number;
    ou: string;
    timestamp: number;
    message: string | null;
  };
  epoch: number;
  tx_hash: string;
  data: string;
  source: string;
}