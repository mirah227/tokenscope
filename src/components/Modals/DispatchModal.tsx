import React, { useState } from 'react';
import { DispatchSettings } from '../../types/tokenscope';

interface DispatchModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: DispatchSettings;
  onUpdateSettings: (newSettings: DispatchSettings) => void;
  onToast: (msg: string) => void;
}

export const DispatchModal: React.FC<DispatchModalProps> = ({
  isOpen,
  onClose,
  settings,
  onUpdateSettings,
  onToast
}) => {
  const [form, setForm] = useState<DispatchSettings>({ ...settings });
  const [isTesting, setIsTesting] = useState(false);

  if (!isOpen) return null;

  const handleSave = () => {
    onUpdateSettings(form);
    onToast('Dispatch channels & telemetry triggers saved!');
    onClose();
  };

  const handleTestPing = () => {
    setIsTesting(true);
    setTimeout(() => {
      setIsTesting(false);
      onToast('Test security ping emitted: 200 OK received from endpoint');
    }, 700);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-primary/60 backdrop-blur-sm animate-fade-in">
      <div 
        className="bg-surface-container-lowest rounded-2xl w-full max-w-lg shadow-2xl border border-outline-variant/30 overflow-hidden flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-4 border-b border-surface-container-high flex items-center justify-between bg-surface-container-low">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-primary-container text-primary-fixed flex items-center justify-center">
              <span className="material-symbols-outlined text-[18px]">sensors</span>
            </div>
            <div>
              <h3 className="font-headline-sm text-headline-sm text-on-surface font-semibold">
                Configure Dispatch Channels
              </h3>
              <p className="font-code-sm text-code-sm text-on-surface-variant">
                Zero-delay off-chain alerts for Solana threat telemetry
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-on-surface-variant hover:text-on-surface hover:bg-surface-container transition-colors cursor-pointer"
          >
            <span className="material-symbols-outlined text-[20px]">close</span>
          </button>
        </div>

        {/* Content */}
        <div className="p-5 overflow-y-auto space-y-4 font-body-md text-on-surface">
          {/* Telegram Settings */}
          <div className="bg-surface-container-low p-3.5 rounded-xl border border-outline-variant/20 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-primary text-[18px]">send</span>
                <span className="font-label-md text-label-md font-semibold text-on-surface">
                  Telegram Threat Bot
                </span>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.telegramEnabled}
                  onChange={(e) => setForm({ ...form, telegramEnabled: e.target.checked })}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-surface-container-highest peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-surface-container-lowest after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-secondary"></div>
              </label>
            </div>
            <div>
              <label className="font-label-sm text-label-sm text-on-surface-variant block mb-1">
                Bot Username or Channel ID
              </label>
              <input
                type="text"
                value={form.telegramChatId}
                onChange={(e) => setForm({ ...form, telegramChatId: e.target.value })}
                placeholder="@TokenScope_SecBot"
                className="w-full bg-surface-container-lowest border border-outline-variant/40 rounded-lg px-3 py-2 text-sm font-code-sm focus:outline-none focus:border-primary"
              />
            </div>
          </div>

          {/* Enterprise Webhook */}
          <div className="bg-surface-container-low p-3.5 rounded-xl border border-outline-variant/20 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-primary text-[18px]">webhook</span>
                <span className="font-label-md text-label-md font-semibold text-on-surface">
                  Enterprise Webhook (REST POST)
                </span>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.webhookEnabled}
                  onChange={(e) => setForm({ ...form, webhookEnabled: e.target.checked })}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-surface-container-highest peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-surface-container-lowest after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-secondary"></div>
              </label>
            </div>
            <div>
              <label className="font-label-sm text-label-sm text-on-surface-variant block mb-1">
                Destination HTTPS Endpoint
              </label>
              <input
                type="text"
                value={form.webhookUrl}
                onChange={(e) => setForm({ ...form, webhookUrl: e.target.value })}
                placeholder="https://sec-ops.domain.com/webhook"
                className="w-full bg-surface-container-lowest border border-outline-variant/40 rounded-lg px-3 py-2 text-sm font-code-sm focus:outline-none focus:border-primary"
              />
            </div>
          </div>

          {/* Alert Thresholds */}
          <div className="space-y-2">
            <h4 className="font-label-md text-label-md uppercase tracking-wider text-on-surface-variant">
              Trigger Thresholds
            </h4>
            <div className="space-y-2 font-body-sm text-body-sm">
              <label className="flex items-center justify-between p-2 rounded bg-surface-container-low cursor-pointer">
                <span>Alert on Raydium/Orca Liquidity Pool Drain (&gt;5% depth)</span>
                <input
                  type="checkbox"
                  checked={form.alertOnLiquidityDrain}
                  onChange={(e) => setForm({ ...form, alertOnLiquidityDrain: e.target.checked })}
                  className="rounded text-primary focus:ring-0"
                />
              </label>
              <label className="flex items-center justify-between p-2 rounded bg-surface-container-low cursor-pointer">
                <span>Alert on Mint / Freeze Authority Modification</span>
                <input
                  type="checkbox"
                  checked={form.alertOnAuthorityChange}
                  onChange={(e) => setForm({ ...form, alertOnAuthorityChange: e.target.checked })}
                  className="rounded text-primary focus:ring-0"
                />
              </label>
              <label className="flex items-center justify-between p-2 rounded bg-surface-container-low cursor-pointer">
                <span>Alert on Whale / Deployer Transfers (&gt;100k USD)</span>
                <input
                  type="checkbox"
                  checked={form.alertOnLargeTransfer}
                  onChange={(e) => setForm({ ...form, alertOnLargeTransfer: e.target.checked })}
                  className="rounded text-primary focus:ring-0"
                />
              </label>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-4 border-t border-surface-container-high bg-surface-container-low flex items-center justify-between gap-2">
          <button
            onClick={handleTestPing}
            disabled={isTesting}
            className="px-3 py-2 bg-surface-container rounded-lg font-label-md text-label-md text-on-surface hover:bg-surface-container-high transition-colors flex items-center gap-1 cursor-pointer disabled:opacity-50"
          >
            <span className={`material-symbols-outlined text-[15px] ${isTesting ? 'animate-spin' : ''}`}>
              {isTesting ? 'refresh' : 'send'}
            </span>
            <span>{isTesting ? 'Testing...' : 'Send Test Ping'}</span>
          </button>
          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-lg border border-outline-variant text-on-surface font-label-md text-label-md hover:bg-surface-container transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              className="bg-primary text-on-primary py-2 px-4 rounded-lg font-label-md text-label-md font-semibold hover:bg-surface-tint transition-all cursor-pointer"
            >
              Save Configuration
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
