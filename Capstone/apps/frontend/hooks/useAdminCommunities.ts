import { useState, useEffect } from 'react';
import { useWallet, useAnchorWallet } from '@solana/wallet-adapter-react';
import { AnchorProvider } from '@coral-xyz/anchor';
import { getProgram, getConnection } from '@/lib/anchor-setup';

export interface Community {
  id: string;
  name: string;
  address: string;
  tokenSymbol: string;
  isAdmin: boolean;
  memberCount: number;
  governanceThreshold: number;
  transferFeeBps: number;
}

export function useAdminCommunities() {
  const { publicKey } = useWallet();
  const wallet = useAnchorWallet();
  const [communities, setCommunities] = useState<Community[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!publicKey || !wallet) {
      setCommunities([]);
      setLoading(false);
      return;
    }

    fetchAdminCommunities();
  }, [publicKey, wallet]);

  const fetchAdminCommunities = async () => {
    if (!wallet || !publicKey) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const connection = getConnection();
      const provider = new AnchorProvider(connection, wallet, {});
      const program = getProgram(provider);

      // Fetch all community accounts
      const communityAccounts = await (program.account as any).community.all();
      
      // Filter communities where the connected wallet is admin
      const adminCommunities: Community[] = communityAccounts
        .filter((account: any) => account.account.admin.toString() === publicKey.toString())
        .map((account: any) => ({
          id: account.publicKey.toString(),
          name: account.account.name,
          address: account.publicKey.toString(),
          tokenSymbol: account.account.tokenSymbol,
          isAdmin: true,
          memberCount: account.account.memberCount,
          governanceThreshold: account.account.governanceThreshold,
          transferFeeBps: account.account.transferFeeBps,
        }));
      
      setCommunities(adminCommunities);
    } catch (err) {
      console.error('Error fetching admin communities:', err);
      setError('Failed to load communities');
    } finally {
      setLoading(false);
    }
  };

  const refetch = () => {
    fetchAdminCommunities();
  };

  return {
    communities,
    loading,
    error,
    refetch,
  };
}
