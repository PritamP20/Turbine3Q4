"use client";

import React, { useState, useEffect, useRef } from 'react';
import { useWallet, useAnchorWallet } from "@solana/wallet-adapter-react";
import { AnchorProvider } from "@coral-xyz/anchor";
import { PublicKey } from "@solana/web3.js";
import { getProgram, getConnection } from "@/lib/anchor-setup";
import { parseTransactionError, logTransactionError } from "@/lib/transaction-errors";
import { formatDistanceToNow } from "date-fns";
import { ChatSectionSkeleton } from "./Skeletons";
import type { ChatMessage } from "@/types/dashboard";

interface ChatSectionProps {
  communityId: string;
}

export default function ChatSection({ communityId }: ChatSectionProps) {
  const { publicKey, signMessage } = useWallet();
  const wallet = useAnchorWallet();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [messageInput, setMessageInput] = useState("");
  const [sending, setSending] = useState(false);
  const [sendError, setSendError] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const [shouldAutoScroll, setShouldAutoScroll] = useState(true);
  const [memberName, setMemberName] = useState<string>("");
  const [hasNewMessages, setHasNewMessages] = useState(false);
  const previousMessageCountRef = useRef(0);

  // Fetch member name on mount
  useEffect(() => {
    if (wallet && publicKey) {
      fetchMemberName();
    }
  }, [wallet, publicKey, communityId]);

  // Fetch messages on mount and set up polling
  useEffect(() => {
    fetchMessages();
    
    // Poll for new messages every 5 seconds
    const interval = setInterval(() => {
      fetchMessages();
    }, 5000);

    return () => clearInterval(interval);
  }, [communityId]);

  // Auto-scroll to bottom when new messages arrive (if user is near bottom)
  useEffect(() => {
    if (shouldAutoScroll && messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, shouldAutoScroll]);

  // Track if user is scrolled near bottom
  const handleScroll = () => {
    if (messagesContainerRef.current) {
      const { scrollTop, scrollHeight, clientHeight } = messagesContainerRef.current;
      const isNearBottom = scrollHeight - scrollTop - clientHeight < 100;
      setShouldAutoScroll(isNearBottom);
      
      // Clear new messages indicator when user scrolls to bottom
      if (isNearBottom && hasNewMessages) {
        setHasNewMessages(false);
      }
    }
  };

  const scrollToBottom = () => {
    setShouldAutoScroll(true);
    setHasNewMessages(false);
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  };

  const fetchMemberName = async () => {
    if (!wallet || !publicKey) return;

    try {
      const connection = getConnection();
      const provider = new AnchorProvider(connection, wallet, {});
      const program = getProgram(provider);

      const communityPda = new PublicKey(communityId);
      const [memberPda] = PublicKey.findProgramAddressSync(
        [Buffer.from("member"), communityPda.toBuffer(), publicKey.toBuffer()],
        program.programId
      );

      const memberAccount = await (program.account as any).member.fetch(memberPda);
      setMemberName(memberAccount.name || "");
    } catch (error) {
      console.error("Error fetching member name:", error);
    }
  };

  const fetchMessages = async () => {
    try {
      const response = await fetch(`/api/communities/${communityId}/messages`);
      
      if (!response.ok) {
        throw new Error("Failed to fetch messages");
      }

      const data = await response.json();
      const newMessages = data.messages || [];
      
      // Check if there are new messages
      if (previousMessageCountRef.current > 0 && newMessages.length > previousMessageCountRef.current) {
        // Only show indicator if user is not at bottom
        if (!shouldAutoScroll) {
          setHasNewMessages(true);
        }
      }
      
      previousMessageCountRef.current = newMessages.length;
      setMessages(newMessages);
      setError("");
    } catch (err: any) {
      console.error("Error fetching messages:", err);
      setError("Failed to load messages");
    } finally {
      setLoading(false);
    }
  };

  const sendMessage = async () => {
    if (!messageInput.trim() || !signMessage || !publicKey) return;

    // Validate message length
    if (messageInput.length > 500) {
      setSendError("Message exceeds 500 character limit");
      setTimeout(() => setSendError(""), 3000);
      return;
    }

    setSending(true);
    setSendError("");

    // Create optimistic message
    const optimisticMessage: ChatMessage = {
      id: `temp-${Date.now()}`,
      sender: publicKey.toString(),
      senderName: memberName || undefined,
      message: messageInput,
      timestamp: Date.now(),
    };

    // Store current input and clear it immediately for better UX
    const messageToSend = messageInput;
    setMessageInput("");
    
    // Optimistically add message to UI
    setMessages(prev => [...prev, optimisticMessage]);
    setShouldAutoScroll(true);

    try {
      // Sign the message with wallet
      const messageBytes = new TextEncoder().encode(messageToSend);
      const signature = await signMessage(messageBytes);
      
      // Convert signature to base58
      const bs58 = await import("bs58");
      const signatureBase58 = bs58.default.encode(signature);

      // Send message to API
      const response = await fetch(`/api/communities/${communityId}/messages`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          message: messageToSend,
          signature: signatureBase58,
          publicKey: publicKey.toString(),
          senderName: memberName || undefined,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to send message");
      }

      // Fetch fresh messages to replace optimistic update with real data
      await fetchMessages();
    } catch (err: any) {
      // Log error for debugging
      const parsedError = logTransactionError('Send Message', err, {
        communityId,
        messageLength: messageToSend.length,
      });
      
      // Revert optimistic update on error
      setMessages(prev => prev.filter(msg => msg.id !== optimisticMessage.id));
      
      // Restore the message input so user can retry
      setMessageInput(messageToSend);
      
      // Show user-friendly error message
      setSendError(parsedError.userFriendlyMessage);
      
      // Auto-dismiss error after 5 seconds
      setTimeout(() => setSendError(""), 5000);
    } finally {
      setSending(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const truncateWallet = (wallet: string): string => {
    if (wallet.length <= 12) return wallet;
    return `${wallet.slice(0, 6)}...${wallet.slice(-4)}`;
  };

  const formatTimestamp = (timestamp: number): string => {
    try {
      return formatDistanceToNow(new Date(timestamp), { addSuffix: true });
    } catch {
      return "just now";
    }
  };

  if (loading) {
    return <ChatSectionSkeleton />;
  }

  return (
    <div className="flex flex-col h-[500px] sm:h-[600px]">
      <div className="mb-3 sm:mb-4">
        <h2 className="text-xl sm:text-2xl font-bold text-zinc-900 dark:text-zinc-100">Community Chat</h2>
        <p className="text-xs sm:text-sm text-zinc-600 dark:text-zinc-400 mt-1">
          Chat with other community members
        </p>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 rounded-lg">
          <p className="text-sm text-red-900 dark:text-red-100">{error}</p>
        </div>
      )}

      {/* Messages List */}
      <div className="relative flex-1 mb-3 sm:mb-4">
        <div 
          ref={messagesContainerRef}
          onScroll={handleScroll}
          className="h-full overflow-y-auto space-y-3 sm:space-y-4 p-3 sm:p-4 bg-zinc-50 dark:bg-zinc-950 rounded-lg border border-zinc-200 dark:border-zinc-800"
        >
        {messages.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <svg
                className="mx-auto h-12 w-12 text-zinc-400"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                />
              </svg>
              <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
                No messages yet. Be the first to say hello!
              </p>
            </div>
          </div>
        ) : (
          <>
            {messages.map((msg) => {
              const isOwnMessage = publicKey && msg.sender === publicKey.toString();
              
              return (
                <div
                  key={msg.id}
                  className={`flex ${isOwnMessage ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[85%] sm:max-w-[70%] rounded-lg p-2 sm:p-3 ${
                      isOwnMessage
                        ? 'bg-blue-600 text-white'
                        : 'bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 border border-zinc-200 dark:border-zinc-700'
                    }`}
                  >
                    <div className="flex flex-col sm:flex-row sm:items-baseline gap-1 sm:gap-2 mb-1">
                      <span
                        className={`text-xs sm:text-sm font-medium ${
                          isOwnMessage ? 'text-blue-100' : 'text-zinc-900 dark:text-zinc-100'
                        }`}
                      >
                        {msg.senderName || truncateWallet(msg.sender)}
                      </span>
                      <span
                        className={`text-xs ${
                          isOwnMessage ? 'text-blue-200' : 'text-zinc-500 dark:text-zinc-400'
                        }`}
                      >
                        {formatTimestamp(msg.timestamp)}
                      </span>
                    </div>
                    <p
                      className={`text-xs sm:text-sm wrap-break-word ${
                        isOwnMessage ? 'text-white' : 'text-zinc-700 dark:text-zinc-300'
                      }`}
                    >
                      {msg.message}
                    </p>
                  </div>
                </div>
              );
            })}
            <div ref={messagesEndRef} />
          </>
        )}
        </div>

        {/* New Messages Indicator */}
        {hasNewMessages && (
          <button
            onClick={scrollToBottom}
            className="absolute bottom-4 left-1/2 transform -translate-x-1/2 px-3 sm:px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs sm:text-sm font-medium rounded-full shadow-lg transition-all flex items-center gap-2 animate-bounce active:scale-95 hover:shadow-xl"
          >
            <svg
              className="w-3 sm:w-4 h-3 sm:h-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 14l-7 7m0 0l-7-7m7 7V3"
              />
            </svg>
            New messages
          </button>
        )}
      </div>

      {/* Message Input */}
      <div className="space-y-2">
        {sendError && (
          <div className="p-3 bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 rounded-lg flex items-start justify-between gap-2">
            <div className="flex items-start gap-2 flex-1">
              <svg className="w-5 h-5 text-red-600 dark:text-red-400 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p className="text-sm text-red-900 dark:text-red-100">{sendError}</p>
            </div>
            <button
              onClick={() => setSendError("")}
              className="text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-200 shrink-0"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        )}
        
        <div className="flex gap-2">
          <div className="flex-1 relative">
            <textarea
              value={messageInput}
              onChange={(e) => setMessageInput(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Type your message..."
              disabled={sending || !publicKey}
              rows={2}
              maxLength={500}
              className="w-full px-3 sm:px-4 py-2 sm:py-3 text-sm sm:text-base rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 placeholder-zinc-500 dark:placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed resize-none"
            />
            <div className="absolute bottom-2 right-2 text-xs text-zinc-500 dark:text-zinc-400">
              {messageInput.length}/500
            </div>
          </div>
          
          <button
            onClick={sendMessage}
            disabled={sending || !messageInput.trim() || !publicKey}
            className="px-3 sm:px-6 py-2 sm:py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-zinc-400 disabled:cursor-not-allowed text-white font-medium rounded-lg transition-all duration-200 flex items-center gap-2 shrink-0 transform active:scale-95 hover:shadow-md"
          >
            {sending ? (
              <>
                <div className="inline-block animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                <span className="hidden sm:inline">Sending...</span>
              </>
            ) : (
              <>
                <svg
                  className="w-5 h-5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"
                  />
                </svg>
                <span className="hidden sm:inline">Send</span>
              </>
            )}
          </button>
        </div>

        {!publicKey && (
          <p className="text-sm text-zinc-600 dark:text-zinc-400 text-center">
            Connect your wallet to send messages
          </p>
        )}
      </div>
    </div>
  );
}
