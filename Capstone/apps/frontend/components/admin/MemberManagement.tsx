'use client';

import { useState, useEffect } from 'react';
import { useAnchorWallet } from '@solana/wallet-adapter-react';
import { AnchorProvider, BN } from '@coral-xyz/anchor';
import { PublicKey, SystemProgram } from '@solana/web3.js';
import { getProgram, getConnection } from '@/lib/anchor-setup';
import { getAccount } from '@solana/spl-token';

interface Member {
  id: string;
  address: string;
  name: string;
  joinedAt: Date;
  tokenBalance: number;
  reputation: number;
  nfcCards: number;
  isActive: boolean;
}

interface MemberManagementProps {
  communityId: string;
}

export function MemberManagement({ communityId }: MemberManagementProps) {
  const wallet = useAnchorWallet();
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'inactive'>('all');

  useEffect(() => {
    if (communityId && wallet) {
      fetchMembers();
    }
  }, [communityId, wallet]);

  const fetchMembers = async () => {
    if (!wallet) return;
    
    setLoading(true);
    try {
      const connection = getConnection();
      const provider = new AnchorProvider(connection, wallet, {});
      const program = getProgram(provider);

      const communityPda = new PublicKey(communityId);

      // Fetch all members for this community
      const memberAccounts = await (program.account as any).member.all([
        {
          memcmp: {
            offset: 8, // Discriminator
            bytes: communityPda.toBase58(),
          }
        }
      ]);

      // Fetch community to get token mint
      const community = await (program.account as any).community.fetch(communityPda);

      const membersData: Member[] = await Promise.all(
        memberAccounts.map(async (account: any) => {
          const memberData = account.account;
          
          // Try to fetch token balance
          let tokenBalance = 0;
          try {
            const [memberTokenAccount] = PublicKey.findProgramAddressSync(
              [
                Buffer.from('token_account'),
                community.tokenMint.toBuffer(),
                memberData.wallet.toBuffer(),
              ],
              program.programId
            );
            
            const tokenAccount = await getAccount(connection, memberTokenAccount);
            tokenBalance = Number(tokenAccount.amount);
          } catch (error) {
            // Token account doesn't exist yet
          }

          return {
            id: account.publicKey.toString(),
            address: memberData.wallet.toString(),
            name: memberData.name,
            joinedAt: new Date(memberData.joinedAt.toNumber() * 1000),
            tokenBalance,
            reputation: memberData.reputation,
            nfcCards: 0, // TODO: Count NFC cards
            isActive: true, // TODO: Determine activity
          };
        })
      );

      setMembers(membersData);
    } catch (error) {
      console.error('Error fetching members:', error);
      setMessage('Failed to load members');
    } finally {
      setLoading(false);
    }
  };

  const filteredMembers = members.filter((member) => {
    const matchesSearch = 
      member.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      member.address.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesFilter = 
      filterStatus === 'all' ||
      (filterStatus === 'active' && member.isActive) ||
      (filterStatus === 'inactive' && !member.isActive);

    return matchesSearch && matchesFilter;
  });

  const handleUpdateReputation = async (memberId: string, delta: number) => {
    if (!wallet) return;

    setLoading(true);
    setMessage('');

    try {
      const connection = getConnection();
      const provider = new AnchorProvider(connection, wallet, {});
      const program = getProgram(provider);

      const communityPda = new PublicKey(communityId);
      const memberPda = new PublicKey(memberId);

      const tx = await program.methods
        .updateReputation(new BN(delta), `Admin adjustment: ${delta > 0 ? '+' : ''}${delta}`)
        .accountsStrict({
          member: memberPda,
          community: communityPda,
          authority: wallet.publicKey,
          systemProgram: SystemProgram.programId,
        })
        .rpc();

      setMessage(`Reputation updated! TX: ${tx}`);
      setTimeout(() => {
        fetchMembers();
        setMessage('');
      }, 2000);
    } catch (error: any) {
      console.error('Error updating reputation:', error);
      setMessage(`Error: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <h2 className="text-2xl font-bold text-zinc-900 dark:text-zinc-50 mb-6">Member Management</h2>

      {message && (
        <div className={`mb-6 p-4 rounded-lg ${
          message.includes('Error') 
            ? 'bg-red-50 dark:bg-red-950 text-red-900 dark:text-red-100 border border-red-200 dark:border-red-800' 
            : 'bg-green-50 dark:bg-green-950 text-green-900 dark:text-green-100 border border-green-200 dark:border-green-800'
        }`}>
          {message}
        </div>
      )}

      {/* Search and Filters */}
      <div className="bg-zinc-50 dark:bg-zinc-800 rounded-lg p-4 mb-6 border border-zinc-200 dark:border-zinc-700">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by name or address..."
              className="w-full bg-white dark:bg-zinc-700 border border-zinc-300 dark:border-zinc-600 rounded-lg px-4 py-2 text-zinc-900 dark:text-zinc-50"
            />
          </div>
          <div className="flex gap-2">
            {['all', 'active', 'inactive'].map((status) => (
              <button
                key={status}
                onClick={() => setFilterStatus(status as typeof filterStatus)}
                className={`px-4 py-2 rounded-lg font-medium capitalize transition-colors ${
                  filterStatus === status
                    ? 'bg-blue-600 text-white'
                    : 'bg-zinc-200 dark:bg-zinc-700 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-300 dark:hover:bg-zinc-600'
                }`}
              >
                {status}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Members List */}
      <div className="space-y-4">
        {loading && members.length === 0 ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
            <p className="text-zinc-600 dark:text-zinc-400">Loading members...</p>
          </div>
        ) : filteredMembers.length === 0 ? (
          <div className="text-center py-12 text-zinc-600 dark:text-zinc-400 bg-zinc-50 dark:bg-zinc-800 rounded-lg border border-zinc-200 dark:border-zinc-700">
            <p className="text-lg">No members found</p>
            <p className="text-sm mt-2">
              {searchQuery ? 'Try adjusting your search' : 'Members will appear here once they join'}
            </p>
          </div>
        ) : (
          filteredMembers.map((member) => (
            <div key={member.id} className="bg-zinc-50 dark:bg-zinc-800 rounded-lg p-6 border border-zinc-200 dark:border-zinc-700">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-xl font-semibold text-zinc-900 dark:text-zinc-50">{member.name}</h3>
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                      member.isActive ? 'bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300' : 'bg-zinc-200 dark:bg-zinc-700 text-zinc-700 dark:text-zinc-300'
                    }`}>
                      {member.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                  <p className="text-zinc-600 dark:text-zinc-400 text-sm font-mono mb-4">{member.address}</p>
                  
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div>
                      <span className="text-zinc-500 dark:text-zinc-400">Joined:</span>
                      <p className="text-zinc-900 dark:text-zinc-50">{member.joinedAt.toLocaleDateString()}</p>
                    </div>
                    <div>
                      <span className="text-zinc-500 dark:text-zinc-400">Token Balance:</span>
                      <p className="text-zinc-900 dark:text-zinc-50">{member.tokenBalance.toLocaleString()}</p>
                    </div>
                    <div>
                      <span className="text-zinc-500 dark:text-zinc-400">Reputation:</span>
                      <p className="text-zinc-900 dark:text-zinc-50">{member.reputation}</p>
                    </div>
                    <div>
                      <span className="text-zinc-500 dark:text-zinc-400">NFC Cards:</span>
                      <p className="text-zinc-900 dark:text-zinc-50">{member.nfcCards}</p>
                    </div>
                  </div>
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={() => handleUpdateReputation(member.id, 10)}
                    disabled={loading}
                    className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg text-sm transition-colors font-medium disabled:opacity-50"
                  >
                    +10 Rep
                  </button>
                  <button
                    onClick={() => handleUpdateReputation(member.id, -10)}
                    disabled={loading}
                    className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg text-sm transition-colors font-medium disabled:opacity-50"
                  >
                    -10 Rep
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-6">
        <div className="bg-zinc-100 dark:bg-zinc-800 rounded-lg p-4 border border-zinc-200 dark:border-zinc-700">
          <p className="text-zinc-600 dark:text-zinc-400 text-sm mb-1">Total Members</p>
          <p className="text-2xl font-bold text-zinc-900 dark:text-zinc-50">{members.length}</p>
        </div>
        <div className="bg-zinc-100 dark:bg-zinc-800 rounded-lg p-4 border border-zinc-200 dark:border-zinc-700">
          <p className="text-zinc-600 dark:text-zinc-400 text-sm mb-1">Active Members</p>
          <p className="text-2xl font-bold text-zinc-900 dark:text-zinc-50">
            {members.filter(m => m.isActive).length}
          </p>
        </div>
        <div className="bg-zinc-100 dark:bg-zinc-800 rounded-lg p-4 border border-zinc-200 dark:border-zinc-700">
          <p className="text-zinc-600 dark:text-zinc-400 text-sm mb-1">Total Tokens</p>
          <p className="text-2xl font-bold text-zinc-900 dark:text-zinc-50">
            {members.reduce((sum, m) => sum + m.tokenBalance, 0).toLocaleString()}
          </p>
        </div>
        <div className="bg-zinc-100 dark:bg-zinc-800 rounded-lg p-4 border border-zinc-200 dark:border-zinc-700">
          <p className="text-zinc-600 dark:text-zinc-400 text-sm mb-1">Avg Reputation</p>
          <p className="text-2xl font-bold text-zinc-900 dark:text-zinc-50">
            {members.length > 0 
              ? Math.round(members.reduce((sum, m) => sum + m.reputation, 0) / members.length)
              : 0
            }
          </p>
        </div>
      </div>
    </div>
  );
}
