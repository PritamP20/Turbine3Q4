// MemberManagement.tsx - FULL VERSION with Neo Brutalism
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

      const memberAccounts = await (program.account as any).member.all([
        {
          memcmp: {
            offset: 8,
            bytes: communityPda.toBase58(),
          }
        }
      ]);

      const community = await (program.account as any).community.fetch(communityPda);

      const membersData: Member[] = await Promise.all(
        memberAccounts.map(async (account: any) => {
          const memberData = account.account;
          
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
            nfcCards: 0,
            isActive: true,
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
      <h2 className="text-3xl font-black text-black mb-6">MEMBER MANAGEMENT</h2>

      {message && (
        <div className={`mb-6 p-4 border-4 border-black font-bold shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] ${
          message.includes('Error') ? 'bg-red-400' : 'bg-lime-400'
        }`}>
          <div className="flex items-center justify-between">
            <span className="text-black">{message}</span>
            <button onClick={() => setMessage('')} className="text-black hover:bg-black hover:text-white p-1 border-2 border-black">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
      )}

      {/* Search and Filters */}
      <div className="bg-cyan-50 border-4 border-black p-4 mb-6 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="SEARCH BY NAME OR ADDRESS..."
              className="w-full bg-white border-4 border-black px-4 py-3 text-black font-bold placeholder:text-gray-400 focus:outline-none focus:border-cyan-400"
            />
          </div>
          <div className="flex gap-2">
            {['all', 'active', 'inactive'].map((status) => (
              <button
                key={status}
                onClick={() => setFilterStatus(status as typeof filterStatus)}
                className={`px-6 py-3 font-black uppercase border-4 border-black transition-all ${
                  filterStatus === status
                    ? 'bg-cyan-400 text-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]'
                    : 'bg-white text-black hover:bg-gray-100 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]'
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
            <div className="w-24 h-24 border-8 border-black border-t-cyan-400 rounded-full animate-spin mx-auto mb-6"></div>
            <p className="text-xl font-black text-black">LOADING MEMBERS...</p>
          </div>
        ) : filteredMembers.length === 0 ? (
          <div className="text-center py-12 bg-white border-4 border-black shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]">
            <div className="w-20 h-20 bg-pink-400 border-4 border-black mx-auto mb-4 flex items-center justify-center text-4xl">
              👥
            </div>
            <p className="text-xl font-black text-black mb-2">NO MEMBERS FOUND</p>
            <p className="text-sm font-bold text-black">
              {searchQuery ? 'Try adjusting your search' : 'Members will appear here once they join'}
            </p>
          </div>
        ) : (
          filteredMembers.map((member) => (
            <div key={member.id} className="bg-white border-4 border-black p-6 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-3">
                    <h3 className="text-2xl font-black text-black">{member.name}</h3>
                    <span className={`px-3 py-1 text-xs font-black border-2 border-black ${
                      member.isActive ? 'bg-lime-400 text-black' : 'bg-gray-300 text-black'
                    }`}>
                      {member.isActive ? 'ACTIVE' : 'INACTIVE'}
                    </span>
                  </div>
                  <p className="text-black text-sm font-mono font-bold mb-4 bg-gray-100 p-2 border-2 border-black">
                    {member.address}
                  </p>
                  
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    <div className="bg-gray-50 border-2 border-black p-2">
                      <span className="text-xs font-black text-black block mb-1">JOINED</span>
                      <p className="text-sm font-bold text-black">{member.joinedAt.toLocaleDateString()}</p>
                    </div>
                    <div className="bg-gray-50 border-2 border-black p-2">
                      <span className="text-xs font-black text-black block mb-1">TOKENS</span>
                      <p className="text-sm font-bold text-black">{member.tokenBalance.toLocaleString()}</p>
                    </div>
                    <div className="bg-gray-50 border-2 border-black p-2">
                      <span className="text-xs font-black text-black block mb-1">REPUTATION</span>
                      <p className="text-sm font-bold text-black">{member.reputation}</p>
                    </div>
                    <div className="bg-gray-50 border-2 border-black p-2">
                      <span className="text-xs font-black text-black block mb-1">NFC CARDS</span>
                      <p className="text-sm font-bold text-black">{member.nfcCards}</p>
                    </div>
                  </div>
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={() => handleUpdateReputation(member.id, 10)}
                    disabled={loading}
                    className="bg-lime-400 text-black px-4 py-3 font-black text-sm border-4 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[2px] hover:translate-y-[2px] transition-all disabled:opacity-50"
                  >
                    +10 REP
                  </button>
                  <button
                    onClick={() => handleUpdateReputation(member.id, -10)}
                    disabled={loading}
                    className="bg-red-400 text-black px-4 py-3 font-black text-sm border-4 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[2px] hover:translate-y-[2px] transition-all disabled:opacity-50"
                  >
                    -10 REP
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-6">
        <div className="bg-cyan-400 border-4 border-black p-4 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
          <p className="text-black text-sm font-black mb-1">TOTAL MEMBERS</p>
          <p className="text-3xl font-black text-black">{members.length}</p>
        </div>
        <div className="bg-yellow-400 border-4 border-black p-4 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
          <p className="text-black text-sm font-black mb-1">ACTIVE MEMBERS</p>
          <p className="text-3xl font-black text-black">
            {members.filter(m => m.isActive).length}
          </p>
        </div>
        <div className="bg-pink-400 border-4 border-black p-4 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
          <p className="text-black text-sm font-black mb-1">TOTAL TOKENS</p>
          <p className="text-3xl font-black text-black">
            {members.reduce((sum, m) => sum + m.tokenBalance, 0).toLocaleString()}
          </p>
        </div>
        <div className="bg-lime-400 border-4 border-black p-4 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
          <p className="text-black text-sm font-black mb-1">AVG REPUTATION</p>
          <p className="text-3xl font-black text-black">
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