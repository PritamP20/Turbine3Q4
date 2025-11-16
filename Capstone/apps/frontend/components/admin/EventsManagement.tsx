// EventsManagement.tsx - Include all the original logic from document index 5
'use client';

import { useState, useEffect } from 'react';
import { useAnchorWallet } from '@solana/wallet-adapter-react';
import { AnchorProvider, BN } from '@coral-xyz/anchor';
import { PublicKey, SystemProgram } from '@solana/web3.js';
import { getProgram, getConnection } from '@/lib/anchor-setup';

interface Event {
  id: string;
  name: string;
  description: string;
  startTime: Date;
  endTime: Date;
  maxAttendees?: number;
  tokenReward?: number;
  attendees: number;
  status: 'upcoming' | 'active' | 'closed';
}

interface EventsManagementProps {
  communityId: string;
}

export function EventsManagement({ communityId }: EventsManagementProps) {
  const wallet = useAnchorWallet();
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    startTime: '',
    endTime: '',
    maxAttendees: '',
    tokenReward: '',
  });

  useEffect(() => {
    if (communityId && wallet) {
      fetchEvents();
    }
  }, [communityId, wallet]);

  const fetchEvents = async () => {
    if (!wallet) return;
    
    setLoading(true);
    try {
      const connection = getConnection();
      const provider = new AnchorProvider(connection, wallet, {});
      const program = getProgram(provider);

      const eventAccounts = await (program.account as any).event.all([
        {
          memcmp: {
            offset: 8,
            bytes: communityId,
          }
        }
      ]);

      const eventsData: Event[] = eventAccounts.map((account: any) => {
        const eventData = account.account;
        let status: 'upcoming' | 'active' | 'closed' = 'upcoming';
        
        if (eventData.status.closed) status = 'closed';
        else if (eventData.status.active) status = 'active';
        else if (eventData.status.upcoming) status = 'upcoming';

        return {
          id: account.publicKey.toString(),
          name: eventData.name,
          description: eventData.description,
          startTime: new Date(eventData.startTime.toNumber() * 1000),
          endTime: new Date(eventData.endTime.toNumber() * 1000),
          maxAttendees: eventData.maxAttendees,
          tokenReward: eventData.tokenReward ? eventData.tokenReward.toNumber() : undefined,
          attendees: eventData.currentAttendees,
          status,
        };
      });

      setEvents(eventsData);
    } catch (error) {
      console.error('Error fetching events:', error);
      setMessage('Failed to load events');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!wallet) {
      setMessage('Please connect your wallet');
      return;
    }

    setLoading(true);
    setMessage('');

    try {
      const connection = getConnection();
      const provider = new AnchorProvider(connection, wallet, {});
      const program = getProgram(provider);

      const communityPda = new PublicKey(communityId);
      const community = await (program.account as any).community.fetch(communityPda);
      
      const [eventPda] = PublicKey.findProgramAddressSync(
        [Buffer.from('event'), communityPda.toBuffer(), Buffer.from(formData.name)],
        program.programId
      );

      const [memberPda] = PublicKey.findProgramAddressSync(
        [Buffer.from('member'), communityPda.toBuffer(), wallet.publicKey.toBuffer()],
        program.programId
      );

      const startTime = new BN(Math.floor(new Date(formData.startTime).getTime() / 1000));
      const endTime = new BN(Math.floor(new Date(formData.endTime).getTime() / 1000));
      
      const maxAttendees = formData.maxAttendees ? parseInt(formData.maxAttendees) : null;
      const tokenReward = formData.tokenReward ? new BN(formData.tokenReward) : null;

      const tx = await program.methods
        .createEvent(
          formData.name,
          formData.description,
          startTime,
          endTime,
          maxAttendees,
          tokenReward
        )
        .accountsStrict({
          event: eventPda,
          community: communityPda,
          member: memberPda,
          organizer: wallet.publicKey,
          systemProgram: SystemProgram.programId,
        })
        .rpc();

      setMessage(`Event created! TX: ${tx}`);
      setShowCreateForm(false);
      setFormData({
        name: '',
        description: '',
        startTime: '',
        endTime: '',
        maxAttendees: '',
        tokenReward: '',
      });
      
      setTimeout(() => fetchEvents(), 2000);
    } catch (error: any) {
      console.error('Error creating event:', error);
      setMessage(`Error: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleCloseEvent = async (eventId: string, eventName: string) => {
    if (!wallet) return;

    setLoading(true);
    try {
      const connection = getConnection();
      const provider = new AnchorProvider(connection, wallet, {});
      const program = getProgram(provider);

      const communityPda = new PublicKey(communityId);
      const eventPda = new PublicKey(eventId);

      const tx = await program.methods
        .closeEvent()
        .accountsStrict({
          event: eventPda,
          community: communityPda,
          authority: wallet.publicKey,
          systemProgram: SystemProgram.programId,
        })
        .rpc();

      setMessage(`Event closed! TX: ${tx}`);
      setTimeout(() => fetchEvents(), 2000);
    } catch (error: any) {
      console.error('Error closing event:', error);
      setMessage(`Error: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-3xl font-black text-black">EVENTS MANAGEMENT</h2>
        <button
          onClick={() => setShowCreateForm(!showCreateForm)}
          disabled={loading}
          className="bg-lime-400 text-black px-6 py-3 font-black border-4 border-black shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] hover:shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[3px] hover:translate-y-[3px] transition-all disabled:opacity-50"
        >
          {showCreateForm ? '✕ CANCEL' : '+ CREATE EVENT'}
        </button>
      </div>

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

      {showCreateForm && (
        <form onSubmit={handleCreateEvent} className="bg-yellow-50 border-4 border-black p-6 mb-6 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]">
          <h3 className="text-2xl font-black text-black mb-6 pb-3 border-b-4 border-black">CREATE NEW EVENT</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-black text-black mb-2 uppercase">
                Event Name *
              </label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full bg-white border-4 border-black px-4 py-3 text-black font-bold focus:outline-none focus:border-cyan-400"
                placeholder="Community Meetup"
              />
            </div>

            <div>
              <label className="block text-sm font-black text-black mb-2 uppercase">
                Token Reward (optional)
              </label>
              <input
                type="number"
                value={formData.tokenReward}
                onChange={(e) => setFormData({ ...formData, tokenReward: e.target.value })}
                className="w-full bg-white border-4 border-black px-4 py-3 text-black font-bold focus:outline-none focus:border-cyan-400"
                placeholder="100"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-black text-black mb-2 uppercase">
                Description *
              </label>
              <textarea
                required
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="w-full bg-white border-4 border-black px-4 py-3 text-black font-bold h-24 focus:outline-none focus:border-cyan-400"
                placeholder="Event description..."
              />
            </div>

            <div>
              <label className="block text-sm font-black text-black mb-2 uppercase">
                Start Time *
              </label>
              <input
                type="datetime-local"
                required
                value={formData.startTime}
                onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
                className="w-full bg-white border-4 border-black px-4 py-3 text-black font-bold focus:outline-none focus:border-cyan-400"
              />
            </div>

            <div>
              <label className="block text-sm font-black text-black mb-2 uppercase">
                End Time *
              </label>
              <input
                type="datetime-local"
                required
                value={formData.endTime}
                onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
                className="w-full bg-white border-4 border-black px-4 py-3 text-black font-bold focus:outline-none focus:border-cyan-400"
              />
            </div>

            <div>
              <label className="block text-sm font-black text-black mb-2 uppercase">
                Max Attendees (optional)
              </label>
              <input
                type="number"
                value={formData.maxAttendees}
                onChange={(e) => setFormData({ ...formData, maxAttendees: e.target.value })}
                className="w-full bg-white border-4 border-black px-4 py-3 text-black font-bold focus:outline-none focus:border-cyan-400"
                placeholder="50"
              />
            </div>
          </div>

          <div className="flex gap-3 mt-6">
            <button
              type="submit"
              disabled={loading}
              className="bg-cyan-400 text-black px-8 py-3 font-black border-4 border-black shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] hover:shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[3px] hover:translate-y-[3px] transition-all disabled:opacity-50"
            >
              {loading ? 'CREATING...' : 'CREATE EVENT'}
            </button>
            <button
              type="button"
              onClick={() => setShowCreateForm(false)}
              className="bg-gray-200 text-black px-8 py-3 font-black border-4 border-black shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] hover:shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[3px] hover:translate-y-[3px] transition-all"
            >
              CANCEL
            </button>
          </div>
        </form>
      )}

      {/* Events List */}
      <div className="space-y-4">
        {loading && events.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-24 h-24 border-8 border-black border-t-cyan-400 rounded-full animate-spin mx-auto mb-6"></div>
            <p className="text-xl font-black text-black">LOADING EVENTS...</p>
          </div>
        ) : events.length === 0 ? (
          <div className="text-center py-12 bg-white border-4 border-black shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]">
            <div className="w-20 h-20 bg-pink-400 border-4 border-black mx-auto mb-4 flex items-center justify-center text-4xl">
              📅
            </div>
            <p className="text-xl font-black text-black mb-2">NO EVENTS CREATED YET</p>
            <p className="text-sm font-bold text-black">Create your first event to get started</p>
          </div>
        ) : (
          events.map((event) => (
            <div key={event.id} className="bg-white border-4 border-black p-6 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]">
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-3">
                    <h3 className="text-2xl font-black text-black">{event.name}</h3>
                    <span className={`px-3 py-1 text-xs font-black border-2 border-black ${
                      event.status === 'active' ? 'bg-lime-400 text-black' :
                      event.status === 'upcoming' ? 'bg-cyan-400 text-black' :
                      'bg-gray-300 text-black'
                    }`}>
                      {event.status.toUpperCase()}
                    </span>
                  </div>
                  <p className="text-black font-bold mb-4">{event.description}</p>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    <div className="bg-gray-100 border-2 border-black p-2">
                      <span className="text-xs font-black text-black block mb-1">START</span>
                      <p className="text-sm font-bold text-black">{event.startTime.toLocaleString()}</p>
                    </div>
                    <div className="bg-gray-100 border-2 border-black p-2">
                      <span className="text-xs font-black text-black block mb-1">END</span>
                      <p className="text-sm font-bold text-black">{event.endTime.toLocaleString()}</p>
                    </div>
                    <div className="bg-gray-100 border-2 border-black p-2">
                      <span className="text-xs font-black text-black block mb-1">ATTENDEES</span>
                      <p className="text-sm font-bold text-black">
                        {event.attendees}{event.maxAttendees ? ` / ${event.maxAttendees}` : ''}
                      </p>
                    </div>
                    {event.tokenReward && (
                      <div className="bg-gray-100 border-2 border-black p-2">
                        <span className="text-xs font-black text-black block mb-1">REWARD</span>
                        <p className="text-sm font-bold text-black">{event.tokenReward} tokens</p>
                      </div>
                    )}
                  </div>
                </div>
                <div className="flex gap-2 ml-4">
                  {event.status === 'active' && (
                    <button 
                      onClick={() => handleCloseEvent(event.id, event.name)}
                      disabled={loading}
                      className="bg-red-400 text-black px-4 py-2 font-black text-sm border-4 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[2px] hover:translate-y-[2px] transition-all disabled:opacity-50"
                    >
                      CLOSE
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}