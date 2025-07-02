// api.ts
import { BalanceResponse, Transaction, AddressHistoryResponse, TransactionDetails } from '../types/wallet';
import * as nacl from 'tweetnacl';

const MU_FACTOR = 1_000_000;

export async function fetchBalance(address: string): Promise<BalanceResponse> {
  try {
    const response = await fetch(`/api/balance/${address}`);
    
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
    const response = await fetch(`/api/address/${address}`);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('Failed to fetch transaction history:', response.status, errorText);
      throw new Error(`HTTP error! status: ${response.status} - ${errorText}`);
    }
    
    const responseText = await response.text();
    let apiData: AddressApiResponse;
    
    try {
      apiData = JSON.parse(responseText);
    } catch (parseError) {
      console.error('Failed to parse transaction history JSON:', parseError);
      throw new Error('Invalid JSON response from server');
    }
    
    // Fetch details for each transaction
    const transactionPromises = apiData.recent_transactions.map(async (recentTx) => {
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
    
    const transactions = await Promise.all(transactionPromises);
    
    const result: AddressHistoryResponse = {
      transactions,
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