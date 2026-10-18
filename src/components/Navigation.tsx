import React from 'react';
import { TabType } from '../types/tokenscope';

interface NavigationProps {
  activeTab: TabType;
  onTabChange: (tab: TabType) => void;
}

export const Navigation: React.FC<NavigationProps> = ({ activeTab, onTabChange }) => {
  const tabs: { id: TabType; label: string; icon: string }[] = [
    { id: 'discover', label: 'Discover', icon: 'explore' },
    { id: 'audit-and-risk', label: 'Audit & Risk', icon: 'verified_user' },
    { id: 'holders', label: 'Holders', icon: 'pie_chart' },
    { id: 'watchlist', label: 'Watchlist', icon: 'bookmark_added' },
  ];

  return (
    <nav className="fixed bottom-0 inset-x-0 z-50 pb-safe bg-surface/90 backdrop-blur-xl shadow-[0_-1px_12px_rgba(11,28,48,0.05)] border-t border-outline-variant/20">
      <div className="flex justify-around items-center h-16 px-space-xs max-w-4xl mx-auto">
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={`flex flex-col items-center justify-center gap-1 min-w-[64px] h-12 transition-colors cursor-pointer ${
                isActive
                  ? 'text-primary font-semibold'
                  : 'text-on-surface-variant hover:text-on-surface'
              }`}
              aria-current={isActive ? 'page' : undefined}
            >
              <span
                className="material-symbols-outlined text-[22px]"
                style={isActive ? { fontVariationSettings: "'FILL' 1" } : undefined}
              >
                {tab.icon}
              </span>
              <span className="font-label-sm text-label-sm uppercase tracking-wider">
                {tab.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};
