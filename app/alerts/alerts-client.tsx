'use client';

import { useState, useEffect } from 'react';
import DashboardPageLayout from "@/components/dashboard/layout";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import {
  getAlertConfigs,
  saveAlertConfigs,
  getAlertHistory,
  createAlertConfig,
  deleteAlertConfig,
  acknowledgeAlert,
  clearAlertHistory,
} from '@/lib/alerts';
import type { AlertConfig, Alert } from '@/types/pnode';

const BellIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" />
    <path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" />
  </svg>
);

export default function AlertsClient() {
  const [configs, setConfigs] = useState<AlertConfig[]>([]);
  const [history, setHistory] = useState<Alert[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'configs' | 'history'>('configs');

  // Webhook testing state
  const [webhookType, setWebhookType] = useState<'discord' | 'slack' | 'telegram'>('discord');
  const [webhookUrl, setWebhookUrl] = useState('');
  const [testingWebhook, setTestingWebhook] = useState(false);
  const [webhookResult, setWebhookResult] = useState<{ success: boolean; message: string } | null>(null);

  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setConfigs(getAlertConfigs());
    setHistory(getAlertHistory());
    setLoading(false);
    setMounted(true);
  }, []);

  const handleToggleConfig = (id: string, enabled: boolean) => {
    const updated = configs.map(c => c.id === id ? { ...c, enabled } : c);
    setConfigs(updated);
    saveAlertConfigs(updated);
  };

  const handleDeleteConfig = (id: string) => {
    deleteAlertConfig(id);
    setConfigs(configs.filter(c => c.id !== id));
  };

  const handleAcknowledge = (id: string) => {
    acknowledgeAlert(id);
    setHistory(history.map(a => a.id === id ? { ...a, acknowledged: true } : a));
  };

  const handleClearHistory = () => {
    clearAlertHistory();
    setHistory([]);
  };

  const handleTestWebhook = async () => {
    setTestingWebhook(true);
    setWebhookResult(null);

    try {
      const response = await fetch('/api/webhooks/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: webhookType,
          webhookUrl: webhookUrl,
        }),
      });

      const data = await response.json();
      setWebhookResult(data);
    } catch (error) {
      setWebhookResult({
        success: false,
        message: 'Failed to send test webhook. Please check your connection.',
      });
    } finally {
      setTestingWebhook(false);
    }
  };

  const severityColors = {
    info: 'bg-blue-500/20 text-blue-400 border-blue-500/40',
    warning: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/40',
    critical: 'bg-red-500/20 text-red-400 border-red-500/40',
  };

  if (loading) {
    return (
      <DashboardPageLayout
        header={{
          title: "Alerts",
          description: "Loading...",
          icon: BellIcon,
        }}
      >
        <div className="space-y-4">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-24 rounded-lg" />
          ))}
        </div>
      </DashboardPageLayout>
    );
  }

  return (
    <DashboardPageLayout
      header={{
        title: "Alerts",
        description: "Configure notifications & view alert history",
        icon: BellIcon,
      }}
    >
      <div className="flex gap-2 mb-6">
        <button
          onClick={() => setActiveTab('configs')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${activeTab === 'configs'
            ? 'bg-primary text-primary-foreground'
            : 'bg-accent/20 hover:bg-accent/40'
            }`}
        >
          Alert Rules
        </button>
        <button
          onClick={() => setActiveTab('history')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${activeTab === 'history'
            ? 'bg-primary text-primary-foreground'
            : 'bg-accent/20 hover:bg-accent/40'
            }`}
        >
          History ({history.filter(a => !a.acknowledged).length})
        </button>
      </div>

      {activeTab === 'configs' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-display">Alert Rules</h2>
          </div>

          {configs.map((config) => (
            <div
              key={config.id}
              className="rounded-lg border-2 border-border p-4"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3">
                    <h3 className="font-display text-lg">{config.name}</h3>
                    <span className={`text-xs px-2 py-0.5 rounded border ${severityColors[config.severity]}`}>
                      {config.severity.toUpperCase()}
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">
                    Trigger when {config.type} is {config.condition} {config.threshold}
                  </p>
                  <div className="flex items-center gap-4 mt-3">
                    <span className="text-xs text-muted-foreground">
                      Channels: {config.channels.filter(c => c.enabled).map(c => c.type).join(', ') || 'None'}
                    </span>
                    {config.lastTriggered && (
                      <span className="text-xs text-muted-foreground">
                        Last triggered: {mounted ? new Date(config.lastTriggered).toLocaleDateString() : '---'}
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <Switch
                    checked={config.enabled}
                    onCheckedChange={(checked) => handleToggleConfig(config.id, checked)}
                  />
                  <button
                    onClick={() => handleDeleteConfig(config.id)}
                    className="text-red-400 hover:text-red-300 text-sm"
                  >
                    Delete
                  </button>
                </div>
              </div>
            </div>
          ))}

          {/* Webhook Testing Section */}
          <div className="rounded-lg border-2 border-border p-4">
            <h3 className="font-display text-lg mb-4">Test Webhook Integration</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Enter your webhook URL below and send a test message to verify the connection.
            </p>

            <div className="space-y-4">
              <div className="flex gap-2">
                <select
                  value={webhookType}
                  onChange={(e) => setWebhookType(e.target.value as 'discord' | 'slack' | 'telegram')}
                  className="px-3 py-2 rounded-lg bg-accent/20 border border-border text-sm"
                >
                  <option value="discord">Discord</option>
                  <option value="slack">Slack</option>
                  <option value="telegram">Telegram</option>
                </select>
                <input
                  type="url"
                  value={webhookUrl}
                  onChange={(e) => setWebhookUrl(e.target.value)}
                  placeholder={
                    webhookType === 'telegram'
                      ? 'Bot Token:Chat ID (e.g., 123456:789)'
                      : 'Enter webhook URL...'
                  }
                  className="flex-1 px-3 py-2 rounded-lg bg-accent/20 border border-border text-sm font-mono"
                />
                <button
                  onClick={handleTestWebhook}
                  disabled={testingWebhook || !webhookUrl}
                  className="px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm disabled:opacity-50"
                >
                  {testingWebhook ? 'Sending...' : 'Test'}
                </button>
              </div>

              {webhookResult && (
                <div className={`text-sm p-3 rounded-lg ${webhookResult.success
                  ? 'bg-green-500/20 text-green-400'
                  : 'bg-red-500/20 text-red-400'
                  }`}>
                  {webhookResult.message}
                </div>
              )}
            </div>

            <div className="flex flex-wrap gap-2 mt-4">
              <span className="px-3 py-1 rounded bg-[#5865F2]/20 text-[#5865F2] text-sm">Discord</span>
              <span className="px-3 py-1 rounded bg-[#0088cc]/20 text-[#0088cc] text-sm">Telegram</span>
              <span className="px-3 py-1 rounded bg-[#4A154B]/20 text-[#E01E5A] text-sm">Slack</span>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'history' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-display">Alert History</h2>
            {history.length > 0 && (
              <button
                onClick={handleClearHistory}
                className="text-sm text-red-400 hover:text-red-300"
              >
                Clear All
              </button>
            )}
          </div>

          {history.length === 0 ? (
            <div className="rounded-lg border-2 border-border p-8 text-center">
              <BellIcon className="w-12 h-12 mx-auto text-muted-foreground mb-3" />
              <p className="text-muted-foreground">No alerts yet</p>
              <p className="text-sm text-muted-foreground/70 mt-1">
                Alerts will appear here when triggered
              </p>
            </div>
          ) : (
            history.map((alert) => (
              <div
                key={alert.id}
                className={`rounded-lg border-2 p-4 ${alert.acknowledged
                  ? 'border-border opacity-60'
                  : `border-l-4 ${severityColors[alert.severity].split(' ')[0]} border-border`
                  }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3">
                      <h3 className="font-display">{alert.title}</h3>
                      <span className={`text-xs px-2 py-0.5 rounded border ${severityColors[alert.severity]}`}>
                        {alert.severity.toUpperCase()}
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">{alert.message}</p>
                    <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                      <span>{mounted ? new Date(alert.timestamp).toLocaleString() : '---'}</span>
                      {alert.nodePubkey && (
                        <span className="font-mono">{alert.nodePubkey.slice(0, 8)}...</span>
                      )}
                    </div>
                  </div>
                  {!alert.acknowledged && (
                    <button
                      onClick={() => handleAcknowledge(alert.id)}
                      className="text-sm text-primary hover:text-primary/80"
                    >
                      Acknowledge
                    </button>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </DashboardPageLayout>
  );
}
