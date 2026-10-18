import React, { useState, useEffect } from 'react';
import { TabType, TokenAsset, SecurityIncident, DispatchSettings } from './types/tokenscope';
import {
  INITIAL_TOKENS,
  INITIAL_INCIDENTS,
  MOCK_HOLDERS,
  INITIAL_DISPATCH_SETTINGS
} from './data/mockData';
import {
  loadWatchlist,
  saveWatchlist,
  toggleWatchlistToken,
  areTokensEqual
} from './services/watchlistStorage';
import { Header } from './components/Header';
import { Navigation } from './components/Navigation';
import { Toast } from './components/Toast';
import { WatchlistScreen } from './components/WatchlistScreen';
import { DiscoverScreen } from './components/DiscoverScreen';
import { AuditScreen } from './components/AuditScreen';
import { HoldersScreen } from './components/HoldersScreen';
import { AuditReportModal } from './components/Modals/AuditReportModal';
import { DispatchModal } from './components/Modals/DispatchModal';
import { IncidentModal } from './components/Modals/IncidentModal';
import { TokenDetailModal } from './components/Modals/TokenDetailModal';
import { NotificationsModal } from './components/Modals/NotificationsModal';
import { ProfileModal } from './components/Modals/ProfileModal';

export default function App() {
  const [activeTab, setActiveTab] = useState<TabType>('watchlist');
  const [tokens, setTokens] = useState<TokenAsset[]>(() => loadWatchlist());
  const [incidents] = useState<SecurityIncident[]>(INITIAL_INCIDENTS);
  const [dispatchSettings, setDispatchSettings] = useState<DispatchSettings>(INITIAL_DISPATCH_SETTINGS);

  // Continuously persist watchlist modifications to localStorage
  useEffect(() => {
    saveWatchlist(tokens);
  }, [tokens]);

  // Toast State
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [toastVisible, setToastVisible] = useState(false);

  // Modals
  const [auditModal, setAuditModal] = useState<{
    isOpen: boolean;
    tokenSymbol: string;
    auditId: string;
    token?: TokenAsset | null;
  }>({
    isOpen: false,
    tokenSymbol: '$DRIFT',
    auditId: 'TS-TEL-2025-01',
    token: null
  });
  const [isDispatchModalOpen, setIsDispatchModalOpen] = useState(false);
  const [selectedIncident, setSelectedIncident] = useState<SecurityIncident | null>(null);
  const [selectedToken, setSelectedToken] = useState<TokenAsset | null>(null);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setToastVisible(true);
    setTimeout(() => {
      setToastVisible(false);
    }, 2600);
  };

  const handleToggleWatch = (tokenToToggle: TokenAsset) => {
    setTokens(prev => {
      const { updatedTokens, isNowPinned, targetSymbol } = toggleWatchlistToken(prev, tokenToToggle);
      showToast(
        isNowPinned
          ? `Pinned ${targetSymbol} to Watchlist`
          : `Unpinned ${targetSymbol} from Watchlist`
      );
      return updatedTokens;
    });

    // Synchronize selectedToken if currently open in TokenDetailModal
    setSelectedToken(curr => {
      if (curr && areTokensEqual(curr, tokenToToggle)) {
        return { ...curr, pinned: !curr.pinned };
      }
      return curr;
    });
  };

  const handleOpenAuditReport = (tokenSymbol: string, auditId?: string, tokenAsset?: TokenAsset) => {
    const cleanSym = tokenSymbol.replace('$', '').toUpperCase();
    const matchedToken = tokenAsset || tokens.find(t => t.symbol.toUpperCase() === cleanSym) || null;
    setAuditModal({
      isOpen: true,
      tokenSymbol,
      auditId: auditId || `TS-TEL-${cleanSym}`,
      token: matchedToken
    });
  };

  const handleRefreshLiveTokens = async () => {
    const livePinned = tokens.filter(t => t.isLiveApi && t.contractAddress);
    if (livePinned.length === 0) return;
    const addrs = livePinned.map(t => t.contractAddress).join(',');
    try {
      const { fetchTokenPairsByAddress, groupPairsByToken, pairToTokenAsset } = await import('./services/dexScreener');
      const res = await fetchTokenPairsByAddress(addrs);
      if (res.pairs && res.pairs.length > 0) {
        const grouped = groupPairsByToken(res.pairs);
        setTokens(prev =>
          prev.map(t => {
            const match = grouped.find(g => areTokensEqual({ contractAddress: g.baseTokenAddress }, t));
            if (match) {
              const updated = pairToTokenAsset(match.primaryPair, match.allPairs);
              return { ...updated, pinned: t.pinned };
            }
            return t;
          })
        );
      }
    } catch {
      // Handled gracefully: API / network failures never delete or corrupt saved tokens
    }
  };

  return (
    <div className="bg-surface font-body-md text-body-md text-on-surface antialiased flex flex-col min-h-screen selection:bg-secondary-container selection:text-on-secondary-container">
      {/* Toast Notification */}
      <Toast message={toastMessage} visible={toastVisible} />

      {/* Top Fixed Header */}
      <Header
        onOpenNotifications={() => setIsNotificationsOpen(true)}
        onOpenProfile={() => setIsProfileOpen(true)}
        unreadCount={3}
      />

      {/* Main Content Area */}
      <main className="flex flex-col relative w-full pt-16 pb-20 bg-surface flex-1 min-h-[calc(100vh-4rem)]">
        {activeTab === 'watchlist' && (
          <WatchlistScreen
            tokens={tokens}
            incidents={incidents}
            dispatchSettings={dispatchSettings}
            onUpdateDispatchSettings={setDispatchSettings}
            onToggleWatch={handleToggleWatch}
            onSelectToken={(token) => setSelectedToken(token)}
            onSelectIncident={(incident) => setSelectedIncident(incident)}
            onOpenAuditReport={handleOpenAuditReport}
            onOpenDispatchModal={() => setIsDispatchModalOpen(true)}
            onToast={showToast}
            onRefreshLiveTokens={handleRefreshLiveTokens}
          />
        )}

        {activeTab === 'discover' && (
          <DiscoverScreen
            tokens={tokens}
            onSelectToken={(token) => setSelectedToken(token)}
            onToggleWatch={handleToggleWatch}
            onToast={showToast}
          />
        )}

        {activeTab === 'audit-and-risk' && (
          <AuditScreen
            tokens={tokens}
            onSelectToken={(token) => setSelectedToken(token)}
            onOpenAuditReport={handleOpenAuditReport}
            onToast={showToast}
          />
        )}

        {activeTab === 'holders' && (
          <HoldersScreen
            holders={MOCK_HOLDERS}
            onToast={showToast}
          />
        )}
      </main>

      {/* Bottom Fixed Navigation Bar */}
      <Navigation
        activeTab={activeTab}
        onTabChange={(tab) => {
          setActiveTab(tab);
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
      />

      {/* Modals & Drawers */}
      <AuditReportModal
        isOpen={auditModal.isOpen}
        onClose={() => setAuditModal(prev => ({ ...prev, isOpen: false }))}
        tokenSymbol={auditModal.tokenSymbol}
        auditId={auditModal.auditId}
        token={auditModal.token}
        onToast={showToast}
      />

      <DispatchModal
        isOpen={isDispatchModalOpen}
        onClose={() => setIsDispatchModalOpen(false)}
        settings={dispatchSettings}
        onUpdateSettings={setDispatchSettings}
        onToast={showToast}
      />

      <IncidentModal
        isOpen={selectedIncident !== null}
        onClose={() => setSelectedIncident(null)}
        incident={selectedIncident}
        onToast={showToast}
      />

      <TokenDetailModal
        isOpen={selectedToken !== null}
        onClose={() => setSelectedToken(null)}
        token={selectedToken}
        onToggleWatch={handleToggleWatch}
        onToast={showToast}
      />

      <NotificationsModal
        isOpen={isNotificationsOpen}
        onClose={() => setIsNotificationsOpen(false)}
        incidents={incidents}
        onSelectIncident={(inc) => setSelectedIncident(inc)}
        onToast={showToast}
      />

      <ProfileModal
        isOpen={isProfileOpen}
        onClose={() => setIsProfileOpen(false)}
        onToast={showToast}
      />
    </div>
  );
}
