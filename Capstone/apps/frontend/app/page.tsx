"use client";

import Link from "next/link";
import { useWallet } from "@solana/wallet-adapter-react";

export default function Home() {
  const { connected } = useWallet();

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <div className="relative overflow-hidden bg-gradient-to-br from-zinc-900 via-zinc-800 to-zinc-900 dark:from-black dark:via-zinc-950 dark:to-black">
        <div className="absolute inset-0 bg-grid-white/[0.02] bg-[size:60px_60px]" />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 sm:py-32">
          <div className="text-center">
            <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold text-white mb-6 tracking-tight">
              Build Communities
              <br />
              <span className="bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">
                On-Chain
              </span>
            </h1>
            <p className="text-xl sm:text-2xl text-zinc-300 max-w-3xl mx-auto mb-12 leading-relaxed">
              SolChain is a comprehensive DAO platform on Solana that enables communities to manage members, 
              govern collectively, organize events, and build decentralized organizations with full transparency.
            </p>
            {!connected ? (
              <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
                <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg px-6 py-3 text-blue-300">
                  👆 Connect your wallet to get started
                </div>
              </div>
            ) : (
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link
                  href="/communities"
                  className="px-8 py-4 bg-white text-zinc-900 rounded-lg font-semibold hover:bg-zinc-100 transition-all transform hover:scale-105"
                >
                  Create Community
                </Link>
                <Link
                  href="/members"
                  className="px-8 py-4 bg-zinc-800 text-white rounded-lg font-semibold hover:bg-zinc-700 transition-all border border-zinc-700"
                >
                  Join as Member
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* What is SolChain Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold text-zinc-900 dark:text-zinc-50 mb-4">
            What is SolChain?
          </h2>
          <p className="text-lg text-zinc-600 dark:text-zinc-400 max-w-3xl mx-auto">
            A complete infrastructure for building and managing decentralized autonomous organizations (DAOs) 
            on Solana blockchain with native token support, governance mechanisms, and community tools.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8 mb-20">
          <div className="bg-white dark:bg-zinc-900 rounded-xl p-8 border border-zinc-200 dark:border-zinc-800 shadow-sm">
            <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center mb-4">
              <span className="text-2xl">🏛️</span>
            </div>
            <h3 className="text-xl font-semibold text-zinc-900 dark:text-zinc-50 mb-3">
              Decentralized Governance
            </h3>
            <p className="text-zinc-600 dark:text-zinc-400">
              Create proposals, vote on decisions, and execute changes through transparent on-chain governance 
              with customizable voting thresholds.
            </p>
          </div>

          <div className="bg-white dark:bg-zinc-900 rounded-xl p-8 border border-zinc-200 dark:border-zinc-800 shadow-sm">
            <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900/30 rounded-lg flex items-center justify-center mb-4">
              <span className="text-2xl">🪙</span>
            </div>
            <h3 className="text-xl font-semibold text-zinc-900 dark:text-zinc-50 mb-3">
              Native Token System
            </h3>
            <p className="text-zinc-600 dark:text-zinc-400">
              Each community gets its own SPL token for governance, rewards, and payments. Manage treasury 
              and token distribution seamlessly.
            </p>
          </div>

          <div className="bg-white dark:bg-zinc-900 rounded-xl p-8 border border-zinc-200 dark:border-zinc-800 shadow-sm">
            <div className="w-12 h-12 bg-green-100 dark:bg-green-900/30 rounded-lg flex items-center justify-center mb-4">
              <span className="text-2xl">👥</span>
            </div>
            <h3 className="text-xl font-semibold text-zinc-900 dark:text-zinc-50 mb-3">
              Member Management
            </h3>
            <p className="text-zinc-600 dark:text-zinc-400">
              Register members with on-chain profiles, track reputation, manage social connections, 
              and issue NFC membership cards.
            </p>
          </div>
        </div>

        {/* Key Features */}
        <div className="bg-gradient-to-br from-zinc-100 to-zinc-50 dark:from-zinc-900 dark:to-zinc-800 rounded-2xl p-12 border border-zinc-200 dark:border-zinc-700">
          <h2 className="text-3xl font-bold text-zinc-900 dark:text-zinc-50 mb-8 text-center">
            Platform Features
          </h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            <FeatureItem icon="🗳️" title="Proposal System" description="Create and vote on community proposals" />
            <FeatureItem icon="📅" title="Event Management" description="Organize events with RSVP tracking" />
            <FeatureItem icon="💳" title="NFC Cards" description="Physical membership verification" />
            <FeatureItem icon="💰" title="Treasury" description="Manage community funds on-chain" />
            <FeatureItem icon="💸" title="Payment Requests" description="Request and settle payments" />
            <FeatureItem icon="🤝" title="Social Graph" description="Build connections and track interactions" />
          </div>
        </div>
      </div>

      {/* How It Works */}
      <div className="bg-white dark:bg-zinc-900 border-y border-zinc-200 dark:border-zinc-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <h2 className="text-4xl font-bold text-zinc-900 dark:text-zinc-50 mb-12 text-center">
            How It Works
          </h2>
          <div className="grid md:grid-cols-4 gap-8">
            <Step number="1" title="Connect Wallet" description="Use Phantom or Solflare to connect" />
            <Step number="2" title="Create/Join Community" description="Start a new DAO or join existing ones" />
            <Step number="3" title="Register as Member" description="Get your on-chain member profile" />
            <Step number="4" title="Participate" description="Vote, create events, and build together" />
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl p-12 text-center">
          <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
            Ready to Build Your Community?
          </h2>
          <p className="text-xl text-blue-100 mb-8 max-w-2xl mx-auto">
            Join the future of decentralized organizations on Solana
          </p>
          {connected ? (
            <Link
              href="/communities"
              className="inline-block px-8 py-4 bg-white text-blue-600 rounded-lg font-semibold hover:bg-blue-50 transition-all transform hover:scale-105"
            >
              Get Started Now
            </Link>
          ) : (
            <p className="text-white text-lg">Connect your wallet above to begin</p>
          )}
        </div>
      </div>
    </div>
  );
}

function FeatureItem({ icon, title, description }: { icon: string; title: string; description: string }) {
  return (
    <div className="flex items-start gap-3">
      <span className="text-2xl">{icon}</span>
      <div>
        <h4 className="font-semibold text-zinc-900 dark:text-zinc-50 mb-1">{title}</h4>
        <p className="text-sm text-zinc-600 dark:text-zinc-400">{description}</p>
      </div>
    </div>
  );
}

function Step({ number, title, description }: { number: string; title: string; description: string }) {
  return (
    <div className="text-center">
      <div className="w-16 h-16 bg-blue-600 text-white rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-4">
        {number}
      </div>
      <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50 mb-2">{title}</h3>
      <p className="text-zinc-600 dark:text-zinc-400">{description}</p>
    </div>
  );
}
