import {
  Connection,
  Keypair,
  PublicKey,
  SystemProgram,
  Transaction,
  TransactionInstruction,
  TransactionMessage,
  VersionedTransaction,
} from '@solana/web3.js';
import { WalletContextState } from '@solana/wallet-adapter-react';

// 8 official Jito tip accounts — one is chosen at random per transaction
const JITO_TIP_ACCOUNTS = [
  '96gYZGLnJYVFmbjzopPSU6QiEV5fGqZNyN9nmNhvrZU5',
  'HFqU5x63VTqvB6pKYkvYi1bKEfVda45YZrn1jQ9W9EqY3',
  'Cw8CFyM9FkoMi7K7Crf6HNQqf4uEMzpKw6QNghXLvLkY',
  'ADaUMid9yfUytqMBgopwjb2DTLSokTSzL1sMXCMt4eY4',
  'DfXygSm4jCyNCybVYYK6DwvWqjKee8pbDmJGcLWNDXjh',
  'ADuUkR4vqLUMWXxW9gh6D6L8pMSawimctcNZ5pGwDcEt',
  'DttWaMuVvTiduZRnguLF7jNxTgiMBZ1hyAumKUiL2KRL',
  '3AVi9Tg9Uo68tJfuvoKvqKNWKkC5wPdSSdeBnizKZ6jT',
] as const;

function makeTipIx(from: PublicKey, lamports: number): TransactionInstruction {
  const tip = new PublicKey(
    JITO_TIP_ACCOUNTS[Math.floor(Math.random() * JITO_TIP_ACCOUNTS.length)]
  );
  return SystemProgram.transfer({ fromPubkey: from, toPubkey: tip, lamports });
}

function readJitoSettings(): number {
  if (typeof localStorage === 'undefined') return 0;
  if (localStorage.getItem('x-jito-enabled') !== 'true') return 0;
  return Number(localStorage.getItem('x-jito-tip') || '1000');
}

/**
 * Sign via wallet then submit directly to the configured RPC connection,
 * bypassing any wallet-internal routing (e.g. Backpack → Jito).
 *
 * Pass extraSigners for transactions that need additional keypair signatures
 * (e.g. a freshly-generated createKey for multisig creation).
 *
 * When Jito tips are enabled in Settings, a SOL tip transfer is injected
 * into the transaction before signing.
 */
export async function signAndSend(
  wallet: WalletContextState,
  transaction: Transaction | VersionedTransaction,
  connection: Connection,
  extraSigners: Keypair[] = [],
): Promise<string> {
  if (!wallet.signTransaction || !wallet.publicKey) {
    throw new Error('Wallet not connected');
  }

  const jitoTipLamports = readJitoSettings();

  if (transaction instanceof Transaction) {
    const { blockhash } = await connection.getLatestBlockhash('confirmed');
    transaction.recentBlockhash = blockhash;
    transaction.feePayer = wallet.publicKey;
    if (jitoTipLamports > 0) {
      transaction.add(makeTipIx(wallet.publicKey, jitoTipLamports));
    }
  } else if (jitoTipLamports > 0) {
    // Decompile, inject tip, recompile with a fresh blockhash
    const { blockhash } = await connection.getLatestBlockhash('confirmed');
    const msg = TransactionMessage.decompile(transaction.message);
    msg.instructions.push(makeTipIx(wallet.publicKey, jitoTipLamports));
    msg.recentBlockhash = blockhash;
    transaction = new VersionedTransaction(msg.compileToV0Message());
  }

  // Sign after all instructions are finalized so the wallet sees the complete tx.
  const signed = await wallet.signTransaction(transaction);

  // partialSign AFTER wallet signs — some adapters reconstruct the Transaction
  // internally and would strip pre-existing partial signatures.
  for (const kp of extraSigners) {
    (signed as Transaction).partialSign(kp);
  }

  return connection.sendRawTransaction(signed.serialize(), { skipPreflight: false });
}
