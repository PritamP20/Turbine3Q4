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

      // Fetch all events for this community
      const eventAccounts = await (program.account as any).event.all([
        {
          memcmp: {
            offset: 8, // Discriminator
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
      
      // Fetch community to get name
      const community = await (program.account as any).community.fetch(communityPda);
      
      // Derive event PDA
      const [eventPda] = PublicKey.findProgramAddressSync(
        [Buffer.from('event'), communityPda.toBuffer(), Buffer.from(formData.name)],
        program.programId
      );

      // Derive member PDA
      const [memberPda] = PublicKey.findProgramAddressSync(
        [Buffer.from('member'), communityPda.toBuffer(), wallet.publicKey.toBuffer()],
        program.programId
      );

      // Convert times to Unix timestamps
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
      
      // Refresh events list
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
        <h2 className="text-2xl font-bold text-zinc-900 dark:text-zinc-50">Events Management</h2>
        <button
          onClick={() => setShowCreateForm(!showCreateForm)}
          disabled={loading}
          className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg transition-colors font-medium disabled:opacity-50"
        >
          {showCreateForm ? 'Cancel' : '+ Create Event'}
        </button>
      </div>

      {message && (
        <div className={`mb-6 p-4 rounded-lg ${
          message.includes('Error') 
            ? 'bg-red-50 dark:bg-red-950 text-red-900 dark:text-red-100 border border-red-200 dark:border-red-800' 
            : 'bg-green-50 dark:bg-green-950 text-green-900 dark:text-green-100 border border-green-200 dark:border-green-800'
        }`}>
          {message}
        </div>
      )}

      {showCreateForm && (
        <form onSubmit={handleCreateEvent} className="bg-zinc-50 dark:bg-zinc-800 rounded-lg p-6 mb-6 border border-zinc-200 dark:border-zinc-700">
          <h3 className="text-xl font-semibold text-zinc-900 dark:text-zinc-50 mb-4">Create New Event</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
                Event Name *
              </label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full bg-white dark:bg-zinc-700 border border-zinc-300 dark:border-zinc-600 rounded-lg px-4 py-2 text-zinc-900 dark:text-zinc-50"
                placeholder="Community Meetup"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
                Token Reward (optional)
              </label>
              <input
                type="number"
                value={formData.tokenReward}
                onChange={(e) => setFormData({ ...formData, tokenReward: e.target.value })}
                className="w-full bg-white dark:bg-zinc-700 border border-zinc-300 dark:border-zinc-600 rounded-lg px-4 py-2 text-zinc-900 dark:text-zinc-50"
                placeholder="100"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
                Description *
              </label>
              <textarea
                required
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="w-full bg-white dark:bg-zinc-700 border border-zinc-300 dark:border-zinc-600 rounded-lg px-4 py-2 text-zinc-900 dark:text-zinc-50 h-24"
                placeholder="Event description..."
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
                Start Time *
              </label>
              <input
                type="datetime-local"
                required
                value={formData.startTime}
                onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
                className="w-full bg-white dark:bg-zinc-700 border border-zinc-300 dark:border-zinc-600 rounded-lg px-4 py-2 text-zinc-900 dark:text-zinc-50"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
                End Time *
              </label>
              <input
                type="datetime-local"
                required
                value={formData.endTime}
                onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
                className="w-full bg-white dark:bg-zinc-700 border border-zinc-300 dark:border-zinc-600 rounded-lg px-4 py-2 text-zinc-900 dark:text-zinc-50"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
                Max Attendees (optional)
              </label>
              <input
                type="number"
                value={formData.maxAttendees}
                onChange={(e) => setFormData({ ...formData, maxAttendees: e.target.value })}
                className="w-full bg-white dark:bg-zinc-700 border border-zinc-300 dark:border-zinc-600 rounded-lg px-4 py-2 text-zinc-900 dark:text-zinc-50"
                placeholder="50"
              />
            </div>
          </div>

          <div className="flex gap-3 mt-6">
            <button
              type="submit"
              disabled={loading}
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg transition-colors font-medium disabled:opacity-50"
            >
              {loading ? 'Creating...' : 'Create Event'}
            </button>
            <button
              type="button"
              onClick={() => setShowCreateForm(false)}
              className="bg-zinc-200 dark:bg-zinc-700 hover:bg-zinc-300 dark:hover:bg-zinc-600 text-zinc-900 dark:text-zinc-50 px-6 py-2 rounded-lg transition-colors font-medium"
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      {/* Events List */}
      <div className="space-y-4">
        {loading && events.length === 0 ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
            <p className="text-zinc-600 dark:text-zinc-400">Loading events...</p>
          </div>
        ) : events.length === 0 ? (
          <div className="text-center py-12 text-zinc-600 dark:text-zinc-400 bg-zinc-50 dark:bg-zinc-800 rounded-lg border border-zinc-200 dark:border-zinc-700">
            <p className="text-lg">No events created yet</p>
            <p className="text-sm mt-2">Create your first event to get started</p>
          </div>
        ) : (
          events.map((event) => (
            <div key={event.id} className="bg-zinc-50 dark:bg-zinc-800 rounded-lg p-6 border border-zinc-200 dark:border-zinc-700">
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-xl font-semibold text-zinc-900 dark:text-zinc-50">{event.name}</h3>
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                      event.status === 'active' ? 'bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300' :
                      event.status === 'upcoming' ? 'bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300' :
                      'bg-zinc-200 dark:bg-zinc-700 text-zinc-700 dark:text-zinc-300'
                    }`}>
                      {event.status}
                    </span>
                  </div>
                  <p className="text-zinc-600 dark:text-zinc-400 mb-4">{event.description}</p>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div>
                      <span className="text-zinc-500 dark:text-zinc-400">Start:</span>
                      <p className="text-zinc-900 dark:text-zinc-50">{event.startTime.toLocaleString()}</p>
                    </div>
                    <div>
                      <span className="text-zinc-500 dark:text-zinc-400">End:</span>
                      <p className="text-zinc-900 dark:text-zinc-50">{event.endTime.toLocaleString()}</p>
                    </div>
                    <div>
                      <span className="text-zinc-500 dark:text-zinc-400">Attendees:</span>
                      <p className="text-zinc-900 dark:text-zinc-50">
                        {event.attendees}{event.maxAttendees ? ` / ${event.maxAttendees}` : ''}
                      </p>
                    </div>
                    {event.tokenReward && (
                      <div>
                        <span className="text-zinc-500 dark:text-zinc-400">Reward:</span>
                        <p className="text-zinc-900 dark:text-zinc-50">{event.tokenReward} tokens</p>
                      </div>
                    )}
                  </div>
                </div>
                <div className="flex gap-2 ml-4">
                  {event.status === 'active' && (
                    <button 
                      onClick={() => handleCloseEvent(event.id, event.name)}
                      disabled={loading}
                      className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg text-sm transition-colors font-medium disabled:opacity-50"
                    >
                      Close Event
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
