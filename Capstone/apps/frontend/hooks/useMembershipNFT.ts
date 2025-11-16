import { useState, useEffect } from 'react';
import { useAnchorWallet } from '@solana/wallet-adapter-react';
import { AnchorProvider } from '@coral-xyz/anchor';
import { PublicKey } from '@solana/web3.js';
import { getProgram, getConnection } from '@/lib/anchor-setup';

export interface MembershipNFT {
  mint: string;
  name: string;
  symbol: string;
  uri: string;
  image?: string;
}

export function useMembershipNFT(communityId: string) {
  const wallet = useAnchorWallet();
  const [nft, setNft] = useState<MembershipNFT | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (communityId && wallet) {
      fetchMembershipNFT();
    }
  }, [communityId, wallet]);

  const fetchMembershipNFT = async () => {
    if (!wallet) return;

    setLoading(true);
    setError(null);

    try {
      const connection = getConnection();
      const provider = new AnchorProvider(connection, wallet, {});
      const program = getProgram(provider);

      const communityPda = new PublicKey(communityId);

      // Fetch member account
      const [memberPda] = PublicKey.findProgramAddressSync(
        [Buffer.from('member'), communityPda.toBuffer(), wallet.publicKey.toBuffer()],
        program.programId
      );

      const memberAccount = await (program.account as any).member.fetch(memberPda);

      if (memberAccount.membershipNft) {
        const nftMint = memberAccount.membershipNft;

        // Parse metadata
        const metadata = {
          mint: nftMint.toString(),
          name: memberAccount.name || 'Membership NFT',
          symbol: 'MEM',
          uri: memberAccount.metadataUri || '',
          image: undefined as string | undefined,
        };

        // Check localStorage for uploaded image
        const storedImage = localStorage.getItem(
          `nft-image-${communityId}-${wallet.publicKey.toString()}`
        );
        
        if (storedImage) {
          metadata.image = storedImage;
        }

        setNft(metadata);
      }
    } catch (err) {
      console.error('Error fetching membership NFT:', err);
      setError('Failed to load membership NFT');
    } finally {
      setLoading(false);
    }
  };

  return {
    nft,
    loading,
    error,
    refetch: fetchMembershipNFT,
  };
}
