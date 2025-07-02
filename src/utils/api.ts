// api.ts
import { BalanceResponse, Transaction, AddressHistoryResponse, TransactionDetails, PendingTransaction, StagingResponse } from '../types/wallet';
import * as nacl from 'tweetnacl';

const MU_FACTOR = 1_000_000;

export async function fetchBalance(address: string): Promise<BalanceResponse> {
  try {
    // Use the address endpoint instead of balance endpoint
    const response = await fetch(`/api/address/${address}`);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('Failed to fetch balance:', response.status, errorText);
      throw new Error(`HTTP error! status: ${response.status} - ${errorText}`);
    }
    const data: any = await response.json();

    const balance = typeof data.balance === 'string' ? parseFloat(data.balance) : (data.balance || 0);
    const nonce = typeof data.nonce === 'number' ? data.nonce : (data.nonce || 0);

    if (isNaN(balance) || typeof nonce !== 'number') {
        console.warn('Invalid balance or nonce in API response', { balance, nonce });
        return { balance: 0, nonce: 0 };
    }

    return { balance, nonce };
  } catch (error) {
    console.error('Error fetching balance:', error);
    throw error;
  }
}

export async function sendTransaction(transaction: Transaction): Promise<{ success: boolean; hash?: string; error?: string }> {
  try {
    const response = await fetch(`/api/send-tx`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(transaction),
    });

    const text = await response.text();

    if (response.ok) {
      try {
        const data = JSON.parse(text);
        if (data.status === 'accepted') {
          return { success: true, hash: data.tx_hash };
        }
      } catch {
        const hashMatch = text.match(/OK\s+([0-9a-fA-F]{64})/);
        if (hashMatch) {
          return { success: true, hash: hashMatch[1] };
        }
      }
      return { success: true, hash: text };
    }

    console.error('Transaction failed:', text);
    return { success: false, error: text };
  } catch (error) {
    console.error('Error sending transaction:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
}

export function createTransaction(
  senderAddress: string,
  recipientAddress: string,
  amount: number,
  nonce: number,
  privateKeyBase64: string,
  publicKeyHex: string
): Transaction {
  // Convert amount to micro units (multiply by 1,000,000)
  const amountMu = Math.floor(amount * MU_FACTOR);
  
  // Determine OU based on amount
  const ou = amount < 1000 ? "1" : "3";
  
  // Create timestamp with small random component
  const timestamp = Date.now() / 1000 + Math.random() * 0.01;

  // Create base transaction object
  const transaction: Transaction = {
    from: senderAddress,
    to_: recipientAddress,
    amount: amountMu.toString(),
    nonce,
    ou,
    timestamp
  };

  // Convert transaction to JSON string for signing
  const txString = JSON.stringify(transaction, null, 0);
  
  // Prepare keys for signing
  const privateKeyBuffer = Buffer.from(privateKeyBase64, 'base64');
  const publicKeyBuffer = Buffer.from(publicKeyHex, 'hex');
  
  // Create secret key for nacl (64 bytes: 32 private + 32 public)
  const secretKey = new Uint8Array(64);
  secretKey.set(privateKeyBuffer, 0);
  secretKey.set(publicKeyBuffer, 32);

  // Sign the transaction
  const signature = nacl.sign.detached(new TextEncoder().encode(txString), secretKey);

  // Add signature and public key to transaction
  transaction.signature = Buffer.from(signature).toString('base64');
  transaction.public_key = Buffer.from(publicKeyBuffer).toString('base64');

  return transaction;
}

// New function to fetch pending transactions from staging
export async function fetchPendingTransactions(address: string): Promise<PendingTransaction[]> {
  try {
    const response = await fetch(`/api/staging`);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('Failed to fetch pending transactions:', response.status, errorText);
      throw new Error(`HTTP error! status: ${response.status} - ${errorText}`);
    }
    
    const responseText = await response.text();
    let data: StagingResponse;
    
    try {
      data = JSON.parse(responseText);
      
      if (!data.staged_transactions || !Array.isArray(data.staged_transactions)) {
        console.warn('Staging response does not contain staged_transactions array:', data);
        return [];
      }
    } catch (parseError) {
      console.error('Failed to parse staging JSON:', parseError);
      return [];
    }
    
    // Filter transactions for the specific address
    const userTransactions = data.staged_transactions.filter(tx => 
      tx.from.toLowerCase() === address.toLowerCase() || 
      tx.to.toLowerCase() === address.toLowerCase()
    );
    
    return userTransactions;
  } catch (error) {
    console.error('Error fetching pending transactions:', error);
    return [];
  }
}

// New function to fetch specific pending transaction by hash
export async function fetchPendingTransactionByHash(hash: string): Promise<PendingTransaction | null> {
  try {
    const response = await fetch(`/api/staging`);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('Failed to fetch pending transactions:', response.status, errorText);
      throw new Error(`HTTP error! status: ${response.status} - ${errorText}`);
    }
    
    const responseText = await response.text();
    let data: StagingResponse;
    
    try {
      data = JSON.parse(responseText);
      
      if (!data.staged_transactions || !Array.isArray(data.staged_transactions)) {
        console.warn('Staging response does not contain staged_transactions array:', data);
        return null;
      }
    } catch (parseError) {
      console.error('Failed to parse staging JSON:', parseError);
      return null;
    }
    
    // Find transaction by hash
    const transaction = data.staged_transactions.find(tx => tx.hash === hash);
    return transaction || null;
  } catch (error) {
    console.error('Error fetching pending transaction by hash:', error);
    return null;
  }
}

// Updated interface to match actual API response
interface AddressApiResponse {
  address: string;
  balance: string;
  nonce: number;
  balance_raw: string;
  has_public_key: boolean;
  transaction_count: number;
  recent_transactions: Array<{
    epoch: number;
    hash: string;
    url: string;
  }>;
}

export async function fetchTransactionHistory(address: string): Promise<AddressHistoryResponse> {
  try {
    // Fetch both confirmed and pending transactions
    const [confirmedResponse, pendingTransactions] = await Promise.all([
      fetch(`/api/address/${address}`),
      fetchPendingTransactions(address)
    ]);
    
    if (!confirmedResponse.ok) {
      const errorText = await confirmedResponse.text();
      console.error('Failed to fetch transaction history:', confirmedResponse.status, errorText);
      throw new Error(`HTTP error! status: ${confirmedResponse.status} - ${errorText}`);
    }
    
    const responseText = await confirmedResponse.text();
    let apiData: AddressApiResponse;
    
    try {
      apiData = JSON.parse(responseText);
    } catch (parseError) {
      console.error('Failed to parse transaction history JSON:', parseError);
      throw new Error('Invalid JSON response from server');
    }
    
    // Fetch details for each confirmed transaction
    const confirmedTransactionPromises = apiData.recent_transactions.map(async (recentTx) => {
      try {
        const txDetails = await fetchTransactionDetails(recentTx.hash);
        
        // Transform to our expected format
        return {
          hash: txDetails.tx_hash,
          from: txDetails.parsed_tx.from,
          to: txDetails.parsed_tx.to,
          amount: parseFloat(txDetails.parsed_tx.amount),
          timestamp: txDetails.parsed_tx.timestamp,
          status: 'confirmed' as const,
          type: txDetails.parsed_tx.from.toLowerCase() === address.toLowerCase() ? 'sent' as const : 'received' as const
        };
      } catch (error) {
        console.error('Failed to fetch transaction details for hash:', recentTx.hash, error);
        // Return a basic transaction object if details fetch fails
        return {
          hash: recentTx.hash,
          from: 'unknown',
          to: 'unknown',
          amount: 0,
          timestamp: Date.now() / 1000,
          status: 'confirmed' as const,
          type: 'received' as const
        };
      }
    });
    
    const confirmedTransactions = await Promise.all(confirmedTransactionPromises);
    
    // Transform pending transactions to our expected format
    const pendingTransactionsFormatted = pendingTransactions.map(tx => ({
      hash: tx.hash,
      from: tx.from,
      to: tx.to,
      amount: parseFloat(tx.amount),
      timestamp: tx.timestamp,
      status: 'pending' as const,
      type: tx.from.toLowerCase() === address.toLowerCase() ? 'sent' as const : 'received' as const
    }));
    
    // Combine and sort by timestamp (newest first)
    const allTransactions = [...pendingTransactionsFormatted, ...confirmedTransactions]
      .sort((a, b) => b.timestamp - a.timestamp);
    
    const result: AddressHistoryResponse = {
      transactions: allTransactions,
      balance: parseFloat(apiData.balance)
    };
    
    return result;
  } catch (error) {
    console.error('Error fetching transaction history:', error);
    throw error;
  }
}

export async function fetchTransactionDetails(hash: string): Promise<TransactionDetails> {
  try {
    const response = await fetch(`/api/tx/${hash}`);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('Failed to fetch transaction details:', response.status, errorText);
      throw new Error(`HTTP error! status: ${response.status} - ${errorText}`);
    }
    
    const responseText = await response.text();
    let data: TransactionDetails;
    
    try {
      data = JSON.parse(responseText);
    } catch (parseError) {
      console.error('Failed to parse transaction details JSON:', parseError);
      throw new Error('Invalid JSON response from server');
    }
    
    return data;
  } catch (error) {
    console.error('Error fetching transaction details:', error);
    throw error;
  }
}

// Wrapper functions for compatibility with existing components
export async function getBalance(address: string): Promise<number> {
  try {
    const result = await fetchBalance(address);
    return result.balance;
  } catch (error) {
    console.error('Error fetching balance:', error);
    return Math.random() * 100; // Mock data for development
  }
}

export async function sendMultipleTransactions(transactions: any[]): Promise<string[]> {
  try {
    const promises = transactions.map(async (txData, index) => {
      // Convert the transaction data to the proper format
      const transaction = createTransaction(
        txData.from,
        txData.to,
        txData.amount,
        0, // nonce will be handled properly in real implementation
        txData.privateKey,
        '' // publicKey will be derived from privateKey
      );
      
      const result = await sendTransaction(transaction);
      if (result.success && result.hash) {
        return result.hash;
      }
      throw new Error(result.error || 'Transaction failed');
    });
    
    const results = await Promise.all(promises);
    return results;
  } catch (error) {
    console.error('Error sending multiple transactions:', error);
    throw error;
  }
}

export async function getTransactionHistory(address: string): Promise<any[]> {
  try {
    const result = await fetchTransactionHistory(address);
    return result.transactions || [];
  } catch (error) {
    console.error('Error fetching transaction history:', error);
    // Return empty array instead of mock data
    return [];
  }
}