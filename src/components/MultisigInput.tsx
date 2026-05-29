import { useState } from 'react';
import { Input } from './ui/input';
import { Button } from './ui/button';
import { useMultisigAddress } from '@/hooks/useMultisigAddress';
import { useRpcUrl, useProgramId } from '@/hooks/useSettings';
import { Connection, PublicKey } from '@solana/web3.js';
import * as multisig from '@sqds/multisig';

async function resolveMultisigPda(
  address: string,
  connection: Connection,
  programId: PublicKey
): Promise<{ multisigPda: string; note?: string }> {
  const pubkey = new PublicKey(address);

  // Try 1: direct multisig PDA
  try {
    await multisig.accounts.Multisig.fromAccountAddress(connection, pubkey);
    return { multisigPda: address };
  } catch (_) {}

  // Try 2: treat as createKey and derive multisig PDA
  const [derivedPda] = multisig.getMultisigPda({ createKey: pubkey, programId });
  try {
    await multisig.accounts.Multisig.fromAccountAddress(connection, derivedPda);
    return {
      multisigPda: derivedPda.toBase58(),
      note: `Resolved createKey → multisig PDA: ${derivedPda.toBase58()}`,
    };
  } catch (_) {}

  throw new Error(
    'Not a multisig PDA or createKey. If you copied this from app.squads.so, ' +
    'the URL shows your vault address — ask your squad admin for the multisig PDA.'
  );
}

const MultisigInput = ({ onUpdate }: { onUpdate: () => void }) => {
  const { multisigAddress, setMultisigAddress } = useMultisigAddress();
  const { rpcUrl } = useRpcUrl();
  const { programId: storedProgramId } = useProgramId();
  const [input, setInput] = useState(multisigAddress || '');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const onSubmit = async () => {
    const trimmed = input.trim();
    if (!trimmed) return;
    setError('');
    setLoading(true);
    try {
      let pubkey: PublicKey;
      try {
        pubkey = new PublicKey(trimmed);
      } catch {
        setError('Invalid public key format.');
        setLoading(false);
        return;
      }
      const connection = new Connection(rpcUrl, 'confirmed');
      const programId = storedProgramId ? new PublicKey(storedProgramId) : multisig.PROGRAM_ID;
      const { multisigPda, note } = await resolveMultisigPda(pubkey.toBase58(), connection, programId);
      if (note) console.info('[MultisigInput]', note);
      await setMultisigAddress.mutateAsync(multisigPda);
      onUpdate();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto w-full max-w-4xl space-y-4 px-4 py-6 sm:px-6 md:py-10 lg:px-8">
      <h1>Enter Multisig Config Address</h1>
      <p className="text-sm text-gray-500">
        Enter the multisig PDA or createKey. The address in app.squads.so URLs is the{' '}
        <strong>vault</strong> address — use the actual multisig PDA instead.
      </p>
      <Input
        type="text"
        placeholder="Multisig PDA or createKey"
        className="mt-2 w-full rounded-md border border-gray-300 px-4 py-2 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-200 sm:text-sm"
        value={input}
        onChange={(e) => setInput(e.target.value.trim())}
        onKeyDown={(e) => e.key === 'Enter' && onSubmit()}
      />
      {error && <p className="text-sm text-red-500">{error}</p>}
      <Button onClick={onSubmit} className="mt-4" disabled={loading}>
        {loading ? 'Resolving…' : 'Set Multisig'}
      </Button>
    </div>
  );
};

export default MultisigInput;
