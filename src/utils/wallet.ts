import { Wallet } from '../types/wallet';
import { generateMnemonic, validateMnemonic, generateWalletFromMnemonic, bufferToBase64, bufferToHex, createOctraAddress } from './crypto';
import * as nacl from 'tweetnacl';

export async function generateWallet(): Promise<Wallet> {
  const mnemonic = generateMnemonic();
  const walletData = await generateWalletFromMnemonic(mnemonic);
  
  return {
    address: walletData.address,
    privateKey: walletData.privateKey,
    mnemonic: walletData.mnemonic,
    publicKey: walletData.publicKey
  };
}

export async function importWalletFromPrivateKey(privateKey: string): Promise<Wallet> {
  let cleanKey = privateKey.trim();
  
  // Handle both hex and base64 formats
  let keyBuffer: Buffer;
  
  if (cleanKey.startsWith('0x')) {
    // Hex format
    cleanKey = cleanKey.slice(2);
    if (cleanKey.length !== 64) {
      throw new Error('Invalid private key length');
    }
    keyBuffer = Buffer.from(cleanKey, 'hex');
  } else {
    // Assume base64 format
    try {
      keyBuffer = Buffer.from(cleanKey, 'base64');
      if (keyBuffer.length !== 32) {
        throw new Error('Invalid private key length');
      }
    } catch (error) {
      throw new Error('Invalid private key format');
    }
  }
  
  const keyPair = nacl.sign.keyPair.fromSeed(keyBuffer);
  const publicKey = Buffer.from(keyPair.publicKey);
  const address = await createOctraAddress(publicKey);
  
  return {
    address,
    privateKey: bufferToBase64(keyBuffer),
    publicKey: bufferToHex(publicKey)
  };
}

export async function importWalletFromMnemonic(mnemonic: string): Promise<Wallet> {
  const words = mnemonic.trim().split(/\s+/);
  
  if (words.length !== 12 && words.length !== 24) {
    throw new Error('Invalid mnemonic length. Must be 12 or 24 words.');
  }
  
  if (!validateMnemonic(mnemonic)) {
    throw new Error('Invalid mnemonic phrase');
  }
  
  const walletData = await generateWalletFromMnemonic(mnemonic);
  
  return {
    address: walletData.address,
    privateKey: walletData.privateKey,
    mnemonic: walletData.mnemonic,
    publicKey: walletData.publicKey
  };
}

export function getWalletBalance(address: string): Promise<number> {
  // This would connect to the actual blockchain
  // For now, return a mock balance
  return Promise.resolve(Math.random() * 100);
}