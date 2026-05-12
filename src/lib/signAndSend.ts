import { Connection, Keypair, Transaction, VersionedTransaction } from '@solana/web3.js';
import { WalletContextState } from '@solana/wallet-adapter-react';

/**
 * Sign via wallet then submit directly to the configured RPC connection,
 * bypassing any wallet-internal routing (e.g. Backpack → Jito).
 *
 * Pass extraSigners for transactions that need additional keypair signatures
 * (e.g. a freshly-generated createKey for multisig creation).
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

  if (transaction instanceof Transaction) {
    const { blockhash } = await connection.getLatestBlockhash('confirmed');
    transaction.recentBlockhash = blockhash;
    transaction.feePayer = wallet.publicKey;
    for (const kp of extraSigners) {
      transaction.partialSign(kp);
    }
  }

  const signed = await wallet.signTransaction(transaction);
  return connection.sendRawTransaction(signed.serialize(), { skipPreflight: false });
}
