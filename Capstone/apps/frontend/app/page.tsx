"use client";

import Link from "next/link";
import { useWallet } from "@solana/wallet-adapter-react";

export default function Home() {
  const { connected } = useWallet();

  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section */}
      <div className="relative overflow-hidden bg-gradient-to-br from-yellow-300 via-yellow-400 to-orange-300 border-b-8 border-black">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-10 left-10 w-32 h-32 bg-black transform rotate-12"></div>
          <div className="absolute bottom-20 right-20 w-40 h-40 bg-black transform -rotate-6"></div>
          <div className="absolute top-1/2 left-1/4 w-24 h-24 bg-black transform rotate-45"></div>
        </div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-32 sm:py-40">
          <div className="text-center">
            <div className="inline-block bg-pink-400 border-4 border-black px-6 py-2 mb-8 transform -rotate-2 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]">
              <span className="text-sm font-black uppercase tracking-wider">⚡ Web3 DAO Platform</span>
            </div>
            <h1 className="text-6xl sm:text-7xl lg:text-8xl font-black text-black mb-8 tracking-tight uppercase leading-none" style={{ textShadow: '8px 8px 0px #FF1493, 12px 12px 0px #00FFFF' }}>
              Build Communities
              <br />
              <span className="text-purple-600" style={{ textShadow: '8px 8px 0px #FFD700' }}>
                On-Chain
              </span>
            </h1>
            <p className="text-2xl sm:text-3xl text-black font-black max-w-4xl mx-auto mb-14 leading-tight">
              The ultimate DAO platform on Solana. <span className="bg-cyan-400 px-3 py-1 border-4 border-black inline-block transform rotate-1">Manage members</span>, govern collectively, and build <span className="bg-lime-300 px-3 py-1 border-4 border-black inline-block transform -rotate-1">decentralized orgs</span> with full transparency.
            </p>
            {!connected ? (
              <div className="flex flex-col sm:flex-row gap-6 justify-center items-center">
                <div className="bg-cyan-300 border-6 border-black px-8 py-5 text-black font-black text-xl shadow-[10px_10px_0px_0px_rgba(0,0,0,1)] transform hover:-rotate-2 transition-all">
                  👆 CONNECT YOUR WALLET TO GET STARTED
                </div>
              </div>
            ) : (
              <div className="flex flex-col sm:flex-row gap-6 justify-center">
                <Link
                  href="/communities"
                  className="group px-10 py-5 bg-black text-white border-6 border-black font-black text-xl uppercase hover:bg-pink-500 transition-all shadow-[10px_10px_0px_0px_rgba(0,0,0,1)] hover:shadow-[5px_5px_0px_0px_rgba(0,0,0,1)] hover:translate-x-1 hover:translate-y-1 active:translate-x-2 active:translate-y-2 active:shadow-none"
                >
                  🚀 Create Community
                </Link>
                <Link
                  href="/members"
                  className="group px-10 py-5 bg-cyan-300 text-black border-6 border-black font-black text-xl uppercase hover:bg-lime-300 transition-all shadow-[10px_10px_0px_0px_rgba(0,0,0,1)] hover:shadow-[5px_5px_0px_0px_rgba(0,0,0,1)] hover:translate-x-1 hover:translate-y-1 active:translate-x-2 active:translate-y-2 active:shadow-none"
                >
                  👤 Join as Member
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Stats Bar */}
      <div className="bg-black border-b-8 border-black">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <StatItem number="10K+" label="Communities" color="bg-pink-400" />
            <StatItem number="50K+" label="Members" color="bg-cyan-400" />
            <StatItem number="100K+" label="Proposals" color="bg-lime-300" />
            <StatItem number="$5M+" label="Treasury" color="bg-yellow-300" />
          </div>
        </div>
      </div>

      {/* What is SolChain Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 bg-white">
        <div className="text-center mb-20">
          <h2 className="text-5xl sm:text-6xl font-black text-black mb-6 uppercase inline-block border-8 border-black bg-purple-300 px-8 py-4 transform -rotate-1 shadow-[12px_12px_0px_0px_rgba(0,0,0,1)]" style={{ textShadow: '4px 4px 0px rgba(255,255,0,0.5)' }}>
            What is SolChain?
          </h2>
          <p className="text-2xl text-black font-black max-w-4xl mx-auto mt-12 leading-relaxed">
            A complete infrastructure for building and managing <span className="bg-orange-300 px-2 py-1 border-4 border-black">decentralized autonomous organizations</span> (DAOs) on Solana blockchain with native token support, governance mechanisms, and community tools.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-10 mb-24">
          <div className="bg-cyan-300 p-10 border-8 border-black shadow-[12px_12px_0px_0px_rgba(0,0,0,1)] transform hover:-translate-y-2 hover:shadow-[16px_16px_0px_0px_rgba(0,0,0,1)] transition-all">
            <div className="w-16 h-16 bg-yellow-400 border-6 border-black flex items-center justify-center mb-6 transform -rotate-6 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
              <span className="text-3xl">🏛️</span>
            </div>
            <h3 className="text-2xl font-black text-black mb-4 uppercase">
              Decentralized Governance
            </h3>
            <p className="text-black font-bold text-lg leading-relaxed">
              Create proposals, vote on decisions, and execute changes through transparent on-chain governance 
              with customizable voting thresholds.
            </p>
            <div className="mt-6 inline-block bg-black text-white px-4 py-2 font-black text-sm transform rotate-2">
              ON-CHAIN VOTING
            </div>
          </div>

          <div className="bg-pink-300 p-10 border-8 border-black shadow-[12px_12px_0px_0px_rgba(0,0,0,1)] transform hover:-translate-y-2 hover:shadow-[16px_16px_0px_0px_rgba(0,0,0,1)] transition-all">
            <div className="w-16 h-16 bg-purple-400 border-6 border-black flex items-center justify-center mb-6 transform rotate-6 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
              <span className="text-3xl">🪙</span>
            </div>
            <h3 className="text-2xl font-black text-black mb-4 uppercase">
              Native Token System
            </h3>
            <p className="text-black font-bold text-lg leading-relaxed">
              Each community gets its own SPL token for governance, rewards, and payments. Manage treasury 
              and token distribution seamlessly.
            </p>
            <div className="mt-6 inline-block bg-black text-white px-4 py-2 font-black text-sm transform -rotate-2">
              SPL TOKENS
            </div>
          </div>

          <div className="bg-lime-300 p-10 border-8 border-black shadow-[12px_12px_0px_0px_rgba(0,0,0,1)] transform hover:-translate-y-2 hover:shadow-[16px_16px_0px_0px_rgba(0,0,0,1)] transition-all">
            <div className="w-16 h-16 bg-green-400 border-6 border-black flex items-center justify-center mb-6 transform rotate-3 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
              <span className="text-3xl">👥</span>
            </div>
            <h3 className="text-2xl font-black text-black mb-4 uppercase">
              Member Management
            </h3>
            <p className="text-black font-bold text-lg leading-relaxed">
              Register members with on-chain profiles, track reputation, manage social connections, 
              and issue NFC membership cards.
            </p>
            <div className="mt-6 inline-block bg-black text-white px-4 py-2 font-black text-sm transform rotate-1">
              NFC CARDS
            </div>
          </div>
        </div>

        {/* Key Features */}
        <div className="bg-gradient-to-br from-orange-300 via-yellow-300 to-pink-300 border-8 border-black p-16 shadow-[16px_16px_0px_0px_rgba(0,0,0,1)] relative overflow-hidden">
          <div className="absolute top-4 right-4 w-20 h-20 bg-black transform rotate-12 opacity-10"></div>
          <div className="absolute bottom-4 left-4 w-24 h-24 bg-black transform -rotate-12 opacity-10"></div>
          <h2 className="text-4xl font-black text-black mb-12 text-center uppercase bg-white border-6 border-black inline-block px-8 py-4 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] relative left-1/2 transform -translate-x-1/2" style={{ textShadow: '3px 3px 0px rgba(0,255,255,0.5)' }}>
            ⚡ Platform Features ⚡
          </h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 relative z-10">
            <FeatureItem icon="🗳️" title="Proposal System" description="Create and vote on community proposals" color="bg-cyan-300" />
            <FeatureItem icon="📅" title="Event Management" description="Organize events with RSVP tracking" color="bg-pink-300" />
            <FeatureItem icon="💳" title="NFC Cards" description="Physical membership verification" color="bg-lime-300" />
            <FeatureItem icon="💰" title="Treasury" description="Manage community funds on-chain" color="bg-purple-300" />
            <FeatureItem icon="💸" title="Payment Requests" description="Request and settle payments" color="bg-yellow-300" />
            <FeatureItem icon="🤝" title="Social Graph" description="Build connections and track interactions" color="bg-orange-300" />
          </div>
        </div>
      </div>

      {/* How It Works */}
      <div className="bg-gradient-to-r from-purple-400 via-pink-400 to-purple-400 border-y-8 border-black">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
          <h2 className="text-5xl font-black text-black mb-16 text-center uppercase bg-yellow-300 inline-block px-12 py-6 border-8 border-black shadow-[12px_12px_0px_0px_rgba(0,0,0,1)] relative left-1/2 transform -translate-x-1/2 -rotate-1" style={{ textShadow: '4px 4px 0px rgba(255,255,255,0.7)' }}>
            🔥 How It Works 🔥
          </h2>
          <div className="grid md:grid-cols-4 gap-10">
            <Step number="1" title="Connect Wallet" description="Use Phantom or Solflare to connect" color="bg-cyan-300" />
            <Step number="2" title="Create/Join Community" description="Start a new DAO or join existing ones" color="bg-lime-300" />
            <Step number="3" title="Register as Member" description="Get your on-chain member profile" color="bg-pink-300" />
            <Step number="4" title="Participate" description="Vote, create events, and build together" color="bg-yellow-300" />
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 bg-white">
        <div className="bg-gradient-to-br from-pink-400 via-yellow-400 to-cyan-400 border-8 border-black p-16 text-center shadow-[20px_20px_0px_0px_rgba(0,0,0,1)] relative overflow-hidden">
          <div className="absolute inset-0 opacity-5">
            <div className="absolute top-0 left-0 w-full h-full" style={{ backgroundImage: 'repeating-linear-gradient(45deg, black 0, black 2px, transparent 0, transparent 50%)' }}></div>
          </div>
          <h2 className="text-4xl sm:text-5xl font-black text-black mb-6 uppercase relative z-10" style={{ textShadow: '5px 5px 0px rgba(255,255,255,0.8)' }}>
            Ready to Build Your Community?
          </h2>
          <p className="text-2xl text-black font-black mb-12 max-w-3xl mx-auto relative z-10">
            Join the future of <span className="bg-black text-white px-3 py-1 border-4 border-white">decentralized organizations</span> on Solana
          </p>
          {connected ? (
            <Link
              href="/communities"
              className="inline-block px-12 py-6 bg-black text-white border-6 border-black font-black text-2xl uppercase hover:bg-purple-600 transition-all shadow-[12px_12px_0px_0px_rgba(0,0,0,1)] hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] hover:translate-x-1 hover:translate-y-1 active:translate-x-2 active:translate-y-2 active:shadow-none relative z-10 transform hover:-rotate-1"
            >
              🚀 Get Started Now
            </Link>
          ) : (
            <p className="text-black text-2xl font-black relative z-10 bg-white border-6 border-black px-8 py-4 inline-block shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">⚠️ CONNECT YOUR WALLET ABOVE TO BEGIN</p>
          )}
        </div>
      </div>

      {/* Footer */}
      <div className="bg-black border-t-8 border-black py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <p className="text-white font-black text-xl uppercase tracking-wider">
            BUILT ON <span className="bg-purple-500 px-3 py-1 border-4 border-white inline-block transform rotate-2">SOLANA</span>
          </p>
        </div>
      </div>
    </div>
  );
}

function StatItem({ number, label, color }: { number: string; label: string; color: string }) {
  return (
    <div className={`${color} border-6 border-black p-6 text-center shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] transform hover:-translate-y-1 hover:shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] transition-all`}>
      <div className="text-4xl font-black text-black mb-2">{number}</div>
      <div className="text-sm font-black text-black uppercase tracking-wide">{label}</div>
    </div>
  );
}

function FeatureItem({ icon, title, description, color }: { icon: string; title: string; description: string; color: string }) {
  return (
    <div className={`flex flex-col ${color} border-6 border-black p-6 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] transform hover:scale-105 hover:shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] transition-all`}>
      <span className="text-4xl mb-4">{icon}</span>
      <div>
        <h4 className="font-black text-black mb-2 uppercase text-lg">{title}</h4>
        <p className="text-sm text-black font-bold leading-relaxed">{description}</p>
      </div>
    </div>
  );
}

function Step({ number, title, description, color }: { number: string; title: string; description: string; color: string }) {
  return (
    <div className="text-center">
      <div className={`w-20 h-20 ${color} text-black border-6 border-black flex items-center justify-center text-3xl font-black mx-auto mb-6 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] transform hover:rotate-12 transition-all`}>
        {number}
      </div>
      <h3 className="text-xl font-black text-black mb-3 uppercase">{title}</h3>
      <p className="text-black font-bold text-lg leading-relaxed">{description}</p>
    </div>
  );
}