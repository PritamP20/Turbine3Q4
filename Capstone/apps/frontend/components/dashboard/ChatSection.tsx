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

  useEffect(() => {
    if (wallet && publicKey) {
      fetchMemberName();
    }
  }, [wallet, publicKey, communityId]);

  useEffect(() => {
    fetchMessages();
    
    const interval = setInterval(() => {
      fetchMessages();
    }, 5000);

    return () => clearInterval(interval);
  }, [communityId]);

  useEffect(() => {
    if (shouldAutoScroll && messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, shouldAutoScroll]);

  const handleScroll = () => {
    if (messagesContainerRef.current) {
      const { scrollTop, scrollHeight, clientHeight } = messagesContainerRef.current;
      const isNearBottom = scrollHeight - scrollTop - clientHeight < 100;
      setShouldAutoScroll(isNearBottom);
      
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
      
      if (previousMessageCountRef.current > 0 && newMessages.length > previousMessageCountRef.current) {
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

    if (messageInput.length > 500) {
      setSendError("Message exceeds 500 character limit");
      setTimeout(() => setSendError(""), 3000);
      return;
    }

    setSending(true);
    setSendError("");

    const optimisticMessage: ChatMessage = {
      id: `temp-${Date.now()}`,
      sender: publicKey.toString(),
      senderName: memberName || undefined,
      message: messageInput,
      timestamp: Date.now(),
    };

    const messageToSend = messageInput;
    setMessageInput("");
    
    setMessages(prev => [...prev, optimisticMessage]);
    setShouldAutoScroll(true);

    try {
      const messageBytes = new TextEncoder().encode(messageToSend);
      const signature = await signMessage(messageBytes);
      
      const bs58 = await import("bs58");
      const signatureBase58 = bs58.default.encode(signature);

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

      await fetchMessages();
    } catch (err: any) {
      const parsedError = logTransactionError('Send Message', err, {
        communityId,
        messageLength: messageToSend.length,
      });
      
      setMessages(prev => prev.filter(msg => msg.id !== optimisticMessage.id));
      setMessageInput(messageToSend);
      setSendError(parsedError.userFriendlyMessage);
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
      <div className="mb-4 pb-4 border-b-4 border-black">
        <h2 className="text-2xl sm:text-3xl font-black text-black">COMMUNITY CHAT</h2>
        <p className="text-sm sm:text-base font-bold text-black mt-1">
          Chat with other community members
        </p>
      </div>

      {error && (
        <div className="mb-4 p-4 bg-red-400 border-4 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
          <p className="text-sm font-bold text-black">{error}</p>
        </div>
      )}

      {/* Messages List */}
      <div className="relative flex-1 mb-4">
        <div 
          ref={messagesContainerRef}
          onScroll={handleScroll}
          className="h-full overflow-y-auto space-y-3 sm:space-y-4 p-4 bg-white border-4 border-black"
        >
        {messages.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <div className="w-20 h-20 bg-cyan-400 border-4 border-black mx-auto mb-4 flex items-center justify-center text-4xl">
                💬
              </div>
              <p className="text-lg font-black text-black">NO MESSAGES YET</p>
              <p className="text-sm font-bold text-black mt-2">
                Be the first to say hello!
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
                    className={`max-w-[85%] sm:max-w-[70%] p-3 border-4 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] ${
                      isOwnMessage
                        ? 'bg-cyan-400'
                        : 'bg-yellow-50'
                    }`}
                  >
                    <div className="flex flex-col sm:flex-row sm:items-baseline gap-1 sm:gap-2 mb-2">
                      <span className="text-sm font-black text-black">
                        {msg.senderName || truncateWallet(msg.sender)}
                      </span>
                      <span className="text-xs font-bold text-black opacity-70">
                        {formatTimestamp(msg.timestamp)}
                      </span>
                    </div>
                    <p className="text-sm font-bold text-black break-words">
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
            className="absolute bottom-4 left-1/2 transform -translate-x-1/2 px-4 py-2 bg-pink-400 text-black text-sm font-black border-4 border-black shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] hover:shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[3px] hover:translate-y-[3px] transition-all flex items-center gap-2"
          >
            <svg
              className="w-4 h-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={3}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M19 14l-7 7m0 0l-7-7m7 7V3"
              />
            </svg>
            NEW MESSAGES
          </button>
        )}
      </div>

      {/* Message Input */}
      <div className="space-y-3">
        {sendError && (
          <div className="p-3 bg-red-400 border-4 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] flex items-start justify-between gap-2">
            <div className="flex items-start gap-2 flex-1">
              <svg className="w-5 h-5 text-black shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p className="text-sm font-bold text-black">{sendError}</p>
            </div>
            <button
              onClick={() => setSendError("")}
              className="text-black hover:bg-black hover:text-red-400 p-1 border-2 border-black shrink-0"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        )}
        
        <div className="flex gap-3">
          <div className="flex-1 relative">
            <textarea
              value={messageInput}
              onChange={(e) => setMessageInput(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="TYPE YOUR MESSAGE..."
              disabled={sending || !publicKey}
              rows={2}
              maxLength={500}
              className="w-full px-4 py-3 text-sm sm:text-base border-4 border-black bg-white text-black placeholder-gray-400 font-bold focus:outline-none focus:border-cyan-400 disabled:opacity-50 disabled:cursor-not-allowed resize-none"
            />
            <div className="absolute bottom-2 right-2 text-xs font-black text-black bg-yellow-200 border-2 border-black px-2 py-1">
              {messageInput.length}/500
            </div>
          </div>
          
          <button
            onClick={sendMessage}
            disabled={sending || !messageInput.trim() || !publicKey}
            className="px-4 sm:px-6 py-3 bg-lime-400 hover:bg-lime-500 disabled:bg-gray-300 disabled:cursor-not-allowed text-black font-black border-4 border-black shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] hover:shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[3px] hover:translate-y-[3px] transition-all flex items-center gap-2 shrink-0 disabled:hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] disabled:hover:translate-x-0 disabled:hover:translate-y-0"
          >
            {sending ? (
              <>
                <div className="inline-block animate-spin rounded-full h-5 w-5 border-4 border-black border-t-transparent"></div>
                <span className="hidden sm:inline">SENDING...</span>
              </>
            ) : (
              <>
                <svg
                  className="w-5 h-5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={3}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"
                  />
                </svg>
                <span className="hidden sm:inline">SEND</span>
              </>
            )}
          </button>
        </div>

        {!publicKey && (
          <div className="text-center p-3 bg-yellow-100 border-4 border-black">
            <p className="text-sm font-black text-black">
              CONNECT YOUR WALLET TO SEND MESSAGES
            </p>
          </div>
        )}
      </div>
    </div>
  );
}