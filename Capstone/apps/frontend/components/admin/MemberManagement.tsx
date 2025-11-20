'use client';

import { useState, useEffect } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { AnchorProvider, BN } from '@coral-xyz/anchor';
import { PublicKey } from '@solana/web3.js';
import { getAssociatedTokenAddress, TOKEN_PROGRAM_ID } from '@solana/spl-token';
import { getProgram, getConnection } from '@/lib/anchor-setup';

interface Member {
  publicKey: string;
  wallet: string;
  name: string;
  reputation: number;
  eventsAttended: number;
  tokenBalance: number;
  joinedAt: Date;
}

interface MemberManagementProps {
  communityId: string;
}

export function MemberManagement({ communityId }: MemberManagementProps) {
  const wallet = useWallet();
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedMember, setSelectedMember] = useState<Member | null>(null);
  const [showDistributeModal, setShowDistributeModal] = useState(false);
  const [distributeAmount, setDistributeAmount] = useState('');
  const [distributing, setDistributing] = useState(false);
  const [message, setMessage] = useState('');
  const [tokenSymbol, setTokenSymbol] = useState('TOKENS');

  useEffect(() => {
    if (wallet.connected) {
      fetchMembers();
    }
  }, [wallet.connected, communityId]);

  const fetchMembers = async () => {
    setLoading(true);
    try {
      const connection = getConnection();
      const provider = new AnchorProvider(connection, wallet as any, {});
      const program: any = getProgram(provider);

      const communityPda = new PublicKey(communityId);
      const community = await program.account.community.fetch(communityPda);
      const tokenMint = new PublicKey(community.tokenMint);
      
      setTokenSymbol(community.tokenSymbol);

      // Fetch all members for this community
      const memberAccounts = await program.account.member.all([
        {
          memcmp: {
            offset: 8,
            bytes: communityPda.toBase58(),
          },
        },
      ]);

      // Fetch token balances for each member
      const membersWithBalances = await Promise.all(
        memberAccounts.map(async (account: any) => {
          const memberData = account.account;
          let tokenBalance = 0;

          try {
            const memberTokenAccount = await getAssociatedTokenAddress(
              tokenMint,
              new PublicKey(memberData.wallet),
              false
            );
            const balance = await connection.getTokenAccountBalance(memberTokenAccount);
            tokenBalance = parseFloat(balance.value.uiAmount?.toString() || '0');
          } catch (err) {
            // Member doesn't have a token account yet
            tokenBalance = 0;
          }

          return {
            publicKey: account.publicKey.toString(),
            wallet: memberData.wallet.toString(),
            name: memberData.name,
            reputation: memberData.reputationScore,
            eventsAttended: memberData.totalEventsAttended,
            tokenBalance,
            joinedAt: new Date(memberData.joinedAt.toNumber() * 1000),
          };
        })
      );

      setMembers(membersWithBalances);
    } catch (error) {
      console.error('Error fetching members:', error);
      setMessage('Failed to load members');
    } finally {
      setLoading(false);
    }
  };

  const handleDistributeTokens = async () => {
    if (!selectedMember || !distributeAmount) return;

    setDistributing(true);
    setMessage('');

    try {
      const connection = getConnection();
      const provider = new AnchorProvider(connection, wallet as any, {});
      const program: any = getProgram(provider);

      const communityPda = new PublicKey(communityId);
      const community = await program.account.community.fetch(communityPda);
      const tokenMint = new PublicKey(community.tokenMint);

      const [treasuryPda] = PublicKey.findProgramAddressSync(
        [Buffer.from('treasury'), communityPda.toBuffer()],
        program.programId
      );

      const treasuryTokenAccount = await getAssociatedTokenAddress(
        tokenMint,
        treasuryPda,
        true
      );

      const recipientWallet = new PublicKey(selectedMember.wallet);
      const recipientTokenAccount = await getAssociatedTokenAddress(
        tokenMint,
        recipientWallet,
        false
      );

      const amount = parseFloat(distributeAmount) * Math.pow(10, 9);

      // Use transfer_tokens instruction
      const [senderMember] = PublicKey.findProgramAddressSync(
        [Buffer.from('member'), communityPda.toBuffer(), wallet.publicKey!.toBuffer()],
        program.programId
      );

      const [recipientMember] = PublicKey.findProgramAddressSync(
        [Buffer.from('member'), communityPda.toBuffer(), recipientWallet.toBuffer()],
        program.programId
      );

      const tx = await program.methods
        .transferTokens(new BN(amount), `Admin distribution`)
        .accounts({
          community: communityPda,
          senderMember: senderMember,
          recipientMember: recipientMember,
          senderTokenAccount: treasuryTokenAccount,
          recipientTokenAccount: recipientTokenAccount,
          recipient: recipientWallet,
          treasuryTokenAccount: treasuryTokenAccount,
          tokenMint: tokenMint,
          treasury: treasuryPda,
          sender: wallet.publicKey!,
          tokenProgram: TOKEN_PROGRAM_ID,
          associatedTokenProgram: new PublicKey('ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL'),
          systemProgram: new PublicKey('11111111111111111111111111111111'),
        })
        .rpc();

      setMessage(`✅ Distributed ${distributeAmount} ${tokenSymbol} to ${selectedMember.name}! TX: ${tx}`);
      setDistributeAmount('');
      setShowDistributeModal(false);
      setSelectedMember(null);
      
      setTimeout(() => fetchMembers(), 2000);
    } catch (error: any) {
      console.error('Distribution error:', error);
      setMessage(`❌ Error: ${error.message}`);
    } finally {
      setDistributing(false);
    }
  };

  const filteredMembers = members.filter(
    (member) =>
      member.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      member.wallet.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div>
      <div className="flex justify-between items-start mb-6">
        <div>
          <h2 className="text-3xl font-black text-black mb-2">MEMBER MANAGEMENT</h2>
          <p className="text-lg font-bold text-black">
            View and manage community members
          </p>
        </div>
        <button
          onClick={fetchMembers}
          disabled={loading}
          className="bg-cyan-400 text-black px-4 py-2 font-black border-4 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[2px] hover:translate-y-[2px] transition-all"
        >
          🔄 REFRESH
        </button>
      </div>

      {message && (
        <div className={`border-4 border-black p-4 mb-6 font-bold ${
          message.includes('✅') ? 'bg-green-200' : 'bg-red-200'
        }`}>
          {message}
        </div>
      )}

      {/* Search */}
      <div className="bg-cyan-50 border-4 border-black p-4 mb-6 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]">
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="SEARCH BY NAME OR ADDRESS..."
          className="w-full bg-white border-4 border-black px-4 py-3 text-black font-bold placeholder:text-gray-400 focus:outline-none focus:border-cyan-400"
        />
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-cyan-400 border-4 border-black p-4 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
          <p className="text-black text-sm font-black mb-1">TOTAL MEMBERS</p>
          <p className="text-3xl font-black text-black">{members.length}</p>
        </div>
        <div className="bg-yellow-400 border-4 border-black p-4 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
          <p className="text-black text-sm font-black mb-1">AVG REPUTATION</p>
          <p className="text-3xl font-black text-black">
            {members.length > 0 ? Math.round(members.reduce((sum, m) => sum + m.reputation, 0) / members.length) : 0}
          </p>
        </div>
        <div className="bg-pink-400 border-4 border-black p-4 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
          <p className="text-black text-sm font-black mb-1">TOTAL EVENTS</p>
          <p className="text-3xl font-black text-black">
            {members.reduce((sum, m) => sum + m.eventsAttended, 0)}
          </p>
        </div>
        <div className="bg-lime-400 border-4 border-black p-4 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
          <p className="text-black text-sm font-black mb-1">TOTAL TOKENS</p>
          <p className="text-3xl font-black text-black">
            {members.reduce((sum, m) => sum + m.tokenBalance, 0).toLocaleString()}
          </p>
        </div>
      </div>

      {/* Members List */}
      {loading ? (
        <div className="text-center py-12 bg-white border-4 border-black shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]">
          <div className="w-20 h-20 border-8 border-black border-t-cyan-400 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-xl font-black text-black">LOADING MEMBERS...</p>
        </div>
      ) : filteredMembers.length === 0 ? (
        <div className="text-center py-12 bg-white border-4 border-black shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]">
          <div className="w-20 h-20 bg-pink-400 border-4 border-black mx-auto mb-4 flex items-center justify-center text-4xl">
            👥
          </div>
          <p className="text-xl font-black text-black mb-2">NO MEMBERS FOUND</p>
          <p className="text-sm font-bold text-black">
            {searchQuery ? 'Try a different search term' : 'Members will appear here once they join'}
          </p>
        </div>
      ) : (
        <div className="bg-white border-4 border-black shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-cyan-400 border-b-4 border-black">
                <tr>
                  <th className="px-4 py-3 text-left font-black text-black">MEMBER</th>
                  <th className="px-4 py-3 text-left font-black text-black">WALLET</th>
                  <th className="px-4 py-3 text-center font-black text-black">REPUTATION</th>
                  <th className="px-4 py-3 text-center font-black text-black">EVENTS</th>
                  <th className="px-4 py-3 text-center font-black text-black">TOKENS</th>
                  <th className="px-4 py-3 text-center font-black text-black">JOINED</th>
                  <th className="px-4 py-3 text-center font-black text-black">ACTIONS</th>
                </tr>
              </thead>
              <tbody>
                {filteredMembers.map((member, index) => (
                  <tr key={member.publicKey} className={index % 2 === 0 ? 'bg-gray-50' : 'bg-white'}>
                    <td className="px-4 py-3 font-bold text-black">{member.name}</td>
                    <td className="px-4 py-3 font-mono text-sm text-black">
                      {member.wallet.slice(0, 4)}...{member.wallet.slice(-4)}
                    </td>
                    <td className="px-4 py-3 text-center font-bold text-black">{member.reputation}</td>
                    <td className="px-4 py-3 text-center font-bold text-black">{member.eventsAttended}</td>
                    <td className="px-4 py-3 text-center font-bold text-black">
                      {member.tokenBalance.toLocaleString()}
                    </td>
                    <td className="px-4 py-3 text-center text-sm font-bold text-black">
                      {member.joinedAt.toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <button
                        onClick={() => {
                          setSelectedMember(member);
                          setShowDistributeModal(true);
                        }}
                        className="bg-lime-400 text-black px-4 py-2 font-black text-sm border-4 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[2px] hover:translate-y-[2px] transition-all"
                      >
                        💰 SEND TOKENS
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Distribute Tokens Modal */}
      {showDistributeModal && selectedMember && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white border-8 border-black p-6 max-w-md w-full shadow-[12px_12px_0px_0px_rgba(0,0,0,1)]">
            <div className="flex justify-between items-center mb-6 pb-4 border-b-4 border-black">
              <h3 className="text-2xl font-black text-black">DISTRIBUTE TOKENS</h3>
              <button
                onClick={() => {
                  setShowDistributeModal(false);
                  setSelectedMember(null);
                  setDistributeAmount('');
                }}
                className="text-black hover:bg-black hover:text-white p-2 border-2 border-black font-black text-xl"
              >
                ✕
              </button>
            </div>

            <div className="mb-6">
              <p className="text-sm font-black text-black mb-2">RECIPIENT</p>
              <div className="bg-cyan-100 border-4 border-black p-4">
                <p className="font-black text-black text-lg">{selectedMember.name}</p>
                <p className="font-mono text-sm text-black">{selectedMember.wallet}</p>
                <p className="text-sm font-bold text-black mt-2">
                  Current Balance: {selectedMember.tokenBalance.toLocaleString()} {tokenSymbol}
                </p>
              </div>
            </div>

            <div className="mb-6">
              <label className="block text-sm font-black text-black mb-2 uppercase">
                Amount ({tokenSymbol}) *
              </label>
              <input
                type="number"
                step="0.000000001"
                required
                value={distributeAmount}
                onChange={(e) => setDistributeAmount(e.target.value)}
                className="w-full bg-white border-4 border-black px-4 py-3 text-black font-bold focus:outline-none focus:border-lime-400"
                placeholder="0"
                disabled={distributing}
              />
            </div>

            <div className="flex gap-3">
              <button
                onClick={handleDistributeTokens}
                disabled={distributing || !distributeAmount}
                className="flex-1 bg-lime-400 text-black px-6 py-3 font-black border-4 border-black shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] hover:shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[3px] hover:translate-y-[3px] transition-all disabled:opacity-50"
              >
                {distributing ? 'SENDING...' : 'SEND TOKENS'}
              </button>
              <button
                onClick={() => {
                  setShowDistributeModal(false);
                  setSelectedMember(null);
                  setDistributeAmount('');
                }}
                className="bg-gray-200 text-black px-6 py-3 font-black border-4 border-black shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] hover:shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[3px] hover:translate-y-[3px] transition-all"
              >
                CANCEL
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
