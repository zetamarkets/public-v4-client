import * as multisig from '@sqds/multisig';
// top level
import { useMutation, useQueryClient, useSuspenseQuery } from '@tanstack/react-query';

const DEFAULT_RPC_URL = 'https://api.mainnet-beta.solana.com'; // Default fallback

const getRpcUrl = () => {
  if (typeof document !== 'undefined') {
    return localStorage.getItem('x-rpc-url') || DEFAULT_RPC_URL;
  }
  return DEFAULT_RPC_URL;
};

export const useRpcUrl = () => {
  const queryClient = useQueryClient();

  const { data: rpcUrl } = useSuspenseQuery({
    queryKey: ['rpcUrl'],
    queryFn: () => Promise.resolve(getRpcUrl()),
  });

  const setRpcUrl = useMutation({
    mutationFn: (newRpcUrl: string) => {
      localStorage.setItem(`x-rpc-url`, newRpcUrl);
      return Promise.resolve(newRpcUrl);
    },
    onSuccess: (newRpcUrl) => {
      queryClient.setQueryData(['rpcUrl'], newRpcUrl);
    },
  });

  return { rpcUrl, setRpcUrl };
};

const DEFAULT_PROGRAM_ID = multisig.PROGRAM_ID.toBase58();

const getProgramId = () => {
  if (typeof window !== 'undefined') {
    return localStorage.getItem('x-program-id-v4') || DEFAULT_PROGRAM_ID;
  }
  return DEFAULT_PROGRAM_ID;
};

export const useProgramId = () => {
  const queryClient = useQueryClient();

  const { data: programId } = useSuspenseQuery({
    queryKey: ['programId'],
    queryFn: () => Promise.resolve(getProgramId()),
  });

  const setProgramId = useMutation({
    mutationFn: (newProgramId: string) => {
      localStorage.setItem('x-program-id-v4', newProgramId);
      return Promise.resolve(newProgramId);
    },
    onSuccess: (newProgramId) => {
      queryClient.setQueryData(['programId'], newProgramId);
    },
  });
  return { programId, setProgramId };
};

// Jito tips
const DEFAULT_JITO_TIP = 1_000; // lamports

export const useJitoTip = () => {
  const queryClient = useQueryClient();

  const { data: jitoEnabled } = useSuspenseQuery({
    queryKey: ['jitoEnabled'],
    queryFn: () => Promise.resolve(localStorage.getItem('x-jito-enabled') === 'true'),
  });

  const { data: jitoTip } = useSuspenseQuery({
    queryKey: ['jitoTip'],
    queryFn: () => Promise.resolve(Number(localStorage.getItem('x-jito-tip') || DEFAULT_JITO_TIP)),
  });

  const setJitoEnabled = useMutation({
    mutationFn: (enabled: boolean) => {
      localStorage.setItem('x-jito-enabled', String(enabled));
      return Promise.resolve(enabled);
    },
    onSuccess: (enabled) => queryClient.setQueryData(['jitoEnabled'], enabled),
  });

  const setJitoTip = useMutation({
    mutationFn: (lamports: number) => {
      localStorage.setItem('x-jito-tip', String(lamports));
      return Promise.resolve(lamports);
    },
    onSuccess: (lamports) => queryClient.setQueryData(['jitoTip'], lamports),
  });

  return { jitoEnabled: jitoEnabled ?? false, jitoTip: jitoTip ?? DEFAULT_JITO_TIP, setJitoEnabled, setJitoTip };
};

// explorer url
const DEFAULT_EXPLORER_URL = 'https://explorer.solana.com';
const getExplorerUrl = () => {
  if (typeof window !== 'undefined') {
    return localStorage.getItem('x-explorer-url') || DEFAULT_EXPLORER_URL;
  }
  return DEFAULT_EXPLORER_URL;
};

export const useExplorerUrl = () => {
  const queryClient = useQueryClient();

  const { data: explorerUrl } = useSuspenseQuery({
    queryKey: ['explorerUrl'],
    queryFn: () => Promise.resolve(getExplorerUrl()),
  });

  const setExplorerUrl = useMutation({
    mutationFn: (newExplorerUrl: string) => {
      localStorage.setItem('x-explorer-url', newExplorerUrl);
      return Promise.resolve(newExplorerUrl);
    },
    onSuccess: (newExplorerUrl) => {
      queryClient.setQueryData(['explorerUrl'], newExplorerUrl);
    },
  });
  return { explorerUrl, setExplorerUrl };
};
