'use client';

import { useState } from 'react';

export type TabType = 'activity' | 'members' | 'leaderboard' | 'events' | 'chat';

interface TabNavigationProps {
  activeTab: TabType;
  onTabChange: (tab: TabType) => void;
  unreadChatCount?: number;
}

export default function TabNavigation({ activeTab, onTabChange, unreadChatCount }: TabNavigationProps) {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  const tabs: { id: TabType; label: string; icon: string }[] = [
    { id: 'activity', label: 'Activity', icon: '📊' },
    { id: 'members', label: 'Members', icon: '👥' },
    { id: 'leaderboard', label: 'Leaderboard', icon: '🏆' },
    { id: 'events', label: 'Events', icon: '📅' },
    { id: 'chat', label: 'Chat', icon: '💬' },
  ];

  const activeTabData = tabs.find(tab => tab.id === activeTab);

  const handleTabChange = (tabId: TabType) => {
    onTabChange(tabId);
    setIsDropdownOpen(false);
  };

  return (
    <div className="border-b border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900">
      <div className="max-w-7xl mx-auto px-4">
        {/* Desktop Navigation */}
        <nav className="hidden md:flex space-x-8" aria-label="Dashboard tabs">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => handleTabChange(tab.id)}
              className={`py-4 px-1 border-b-2 font-medium text-sm relative transition-all duration-300 ease-out transform hover:scale-105 ${
                activeTab === tab.id
                  ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                  : 'border-transparent text-zinc-500 dark:text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-300 hover:border-zinc-300 dark:hover:border-zinc-600'
              }`}
              aria-current={activeTab === tab.id ? 'page' : undefined}
            >
              <span className="mr-2">{tab.icon}</span>
              {tab.label}
              {tab.id === 'chat' && unreadChatCount && unreadChatCount > 0 && (
                <span className="absolute -top-1 -right-2 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                  {unreadChatCount}
                </span>
              )}
            </button>
          ))}
        </nav>

        {/* Mobile Dropdown Navigation */}
        <div className="md:hidden relative">
          <button
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            className="w-full py-4 px-4 flex items-center justify-between text-left font-medium text-sm text-zinc-900 dark:text-zinc-100"
            aria-expanded={isDropdownOpen}
            aria-haspopup="true"
          >
            <span className="flex items-center">
              <span className="mr-2">{activeTabData?.icon}</span>
              {activeTabData?.label}
              {activeTab === 'chat' && unreadChatCount && unreadChatCount > 0 && (
                <span className="ml-2 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                  {unreadChatCount}
                </span>
              )}
            </span>
            <svg
              className={`w-5 h-5 transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>

          {/* Dropdown Menu */}
          {isDropdownOpen && (
            <>
              {/* Backdrop */}
              <div
                className="fixed inset-0 z-10"
                onClick={() => setIsDropdownOpen(false)}
                aria-hidden="true"
              />
              
              {/* Dropdown Content */}
              <div className="absolute left-0 right-0 z-20 mt-1 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg shadow-lg animate-slideDown">
                {tabs.map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => handleTabChange(tab.id)}
                    className={`w-full px-4 py-3 text-left flex items-center justify-between transition-all duration-200 ease-out ${
                      activeTab === tab.id
                        ? 'bg-blue-50 dark:bg-blue-950 text-blue-600 dark:text-blue-400'
                        : 'text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800'
                    } ${tab.id === tabs[0].id ? 'rounded-t-lg' : ''} ${
                      tab.id === tabs[tabs.length - 1].id ? 'rounded-b-lg' : ''
                    }`}
                  >
                    <span className="flex items-center">
                      <span className="mr-2">{tab.icon}</span>
                      {tab.label}
                    </span>
                    {tab.id === 'chat' && unreadChatCount && unreadChatCount > 0 && (
                      <span className="bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                        {unreadChatCount}
                      </span>
                    )}
                    {activeTab === tab.id && (
                      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                        <path
                          fillRule="evenodd"
                          d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                          clipRule="evenodd"
                        />
                      </svg>
                    )}
                  </button>
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
