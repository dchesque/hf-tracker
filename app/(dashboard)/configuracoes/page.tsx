'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Bell, Moon, Globe, Shield, Database, Trash2 } from 'lucide-react';
import { toast } from 'sonner';

export default function SettingsPage() {
  const [notifications, setNotifications] = useState({
    email: true,
    push: false,
    sms: false,
    priceAlerts: true,
    positionUpdates: true,
  });

  const [preferences, setPreferences] = useState({
    darkMode: true,
    language: 'en',
    currency: 'USD',
    timezone: 'America/Sao_Paulo',
  });

  const [security, setSecurity] = useState({
    twoFactor: false,
    sessionTimeout: '30',
  });

  const handleSaveSettings = () => {
    toast.success('Settings saved successfully!');
  };

  const handleClearCache = () => {
    toast.success('Cache cleared successfully!');
  };

  const handleDeleteAccount = () => {
    toast.error('Account deletion is disabled in demo mode');
  };

  return (
    <div className="relative min-h-screen">
      {/* Abstract blur backgrounds */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 right-1/4 w-96 h-96 bg-yellow-500/2 rounded-full blur-3xl"></div>
        <div className="absolute bottom-1/4 left-1/3 w-80 h-80 bg-amber-500/2 rounded-full blur-3xl"></div>
        <div className="absolute top-1/2 right-1/3 w-72 h-72 bg-yellow-400/1 rounded-full blur-3xl"></div>
      </div>

      <div className="relative space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold tracking-tight">
              <span className="text-white">App</span>
              <span className="text-yellow-500"> Settings</span>
            </h1>
            <p className="text-zinc-400 mt-2 text-base">
              Customize your application preferences
            </p>
          </div>
          <Button
            onClick={handleSaveSettings}
            className="bg-yellow-500 hover:bg-yellow-600 text-black"
          >
            Save Changes
          </Button>
        </div>

        {/* Notifications */}
        <Card className="backdrop-blur-xl bg-zinc-900/40 border-zinc-800/50">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="h-12 w-12 rounded-full bg-blue-500/10 flex items-center justify-center">
                <Bell className="h-6 w-6 text-blue-400" />
              </div>
              <div>
                <CardTitle className="text-white">Notifications</CardTitle>
                <CardDescription className="text-zinc-400">
                  Manage how you receive updates
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="flex items-center justify-between p-4 bg-zinc-900/50 rounded-lg border border-zinc-800">
                <div>
                  <Label className="text-white">Email Notifications</Label>
                  <p className="text-sm text-zinc-400">Receive updates via email</p>
                </div>
                <button
                  onClick={() => setNotifications({ ...notifications, email: !notifications.email })}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    notifications.email ? 'bg-yellow-500' : 'bg-zinc-700'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      notifications.email ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>

              <div className="flex items-center justify-between p-4 bg-zinc-900/50 rounded-lg border border-zinc-800">
                <div>
                  <Label className="text-white">Push Notifications</Label>
                  <p className="text-sm text-zinc-400">Browser push notifications</p>
                </div>
                <button
                  onClick={() => setNotifications({ ...notifications, push: !notifications.push })}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    notifications.push ? 'bg-yellow-500' : 'bg-zinc-700'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      notifications.push ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>

              <div className="flex items-center justify-between p-4 bg-zinc-900/50 rounded-lg border border-zinc-800">
                <div>
                  <Label className="text-white">Price Alerts</Label>
                  <p className="text-sm text-zinc-400">Funding rate changes</p>
                </div>
                <button
                  onClick={() => setNotifications({ ...notifications, priceAlerts: !notifications.priceAlerts })}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    notifications.priceAlerts ? 'bg-yellow-500' : 'bg-zinc-700'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      notifications.priceAlerts ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>

              <div className="flex items-center justify-between p-4 bg-zinc-900/50 rounded-lg border border-zinc-800">
                <div>
                  <Label className="text-white">Position Updates</Label>
                  <p className="text-sm text-zinc-400">Real-time P&L changes</p>
                </div>
                <button
                  onClick={() => setNotifications({ ...notifications, positionUpdates: !notifications.positionUpdates })}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    notifications.positionUpdates ? 'bg-yellow-500' : 'bg-zinc-700'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      notifications.positionUpdates ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Preferences */}
        <Card className="backdrop-blur-xl bg-zinc-900/40 border-zinc-800/50">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="h-12 w-12 rounded-full bg-purple-500/10 flex items-center justify-center">
                <Globe className="h-6 w-6 text-purple-400" />
              </div>
              <div>
                <CardTitle className="text-white">Preferences</CardTitle>
                <CardDescription className="text-zinc-400">
                  Customize your experience
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label className="text-zinc-400">Theme</Label>
                <div className="flex gap-2">
                  <button
                    onClick={() => setPreferences({ ...preferences, darkMode: true })}
                    className={`flex-1 p-3 rounded-lg border transition-all ${
                      preferences.darkMode
                        ? 'bg-yellow-500/20 border-yellow-500/50 text-yellow-400'
                        : 'bg-zinc-900/50 border-zinc-800 text-zinc-400 hover:border-zinc-700'
                    }`}
                  >
                    <Moon className="h-5 w-5 mx-auto mb-1" />
                    <span className="text-sm">Dark</span>
                  </button>
                  <button
                    onClick={() => setPreferences({ ...preferences, darkMode: false })}
                    className={`flex-1 p-3 rounded-lg border transition-all ${
                      !preferences.darkMode
                        ? 'bg-yellow-500/20 border-yellow-500/50 text-yellow-400'
                        : 'bg-zinc-900/50 border-zinc-800 text-zinc-400 hover:border-zinc-700'
                    }`}
                  >
                    <Moon className="h-5 w-5 mx-auto mb-1" />
                    <span className="text-sm">Light</span>
                  </button>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="language" className="text-zinc-400">Language</Label>
                <select
                  id="language"
                  value={preferences.language}
                  onChange={(e) => setPreferences({ ...preferences, language: e.target.value })}
                  className="w-full px-3 py-2 bg-zinc-900/50 border border-zinc-800 rounded-md text-white focus:border-yellow-500/50 focus:ring-1 focus:ring-yellow-500/20"
                >
                  <option value="en">English</option>
                  <option value="pt">Português</option>
                  <option value="es">Español</option>
                </select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="currency" className="text-zinc-400">Default Currency</Label>
                <select
                  id="currency"
                  value={preferences.currency}
                  onChange={(e) => setPreferences({ ...preferences, currency: e.target.value })}
                  className="w-full px-3 py-2 bg-zinc-900/50 border border-zinc-800 rounded-md text-white focus:border-yellow-500/50 focus:ring-1 focus:ring-yellow-500/20"
                >
                  <option value="USD">USD ($)</option>
                  <option value="BRL">BRL (R$)</option>
                  <option value="EUR">EUR (€)</option>
                </select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="timezone" className="text-zinc-400">Timezone</Label>
                <select
                  id="timezone"
                  value={preferences.timezone}
                  onChange={(e) => setPreferences({ ...preferences, timezone: e.target.value })}
                  className="w-full px-3 py-2 bg-zinc-900/50 border border-zinc-800 rounded-md text-white focus:border-yellow-500/50 focus:ring-1 focus:ring-yellow-500/20"
                >
                  <option value="America/Sao_Paulo">São Paulo (GMT-3)</option>
                  <option value="America/New_York">New York (GMT-5)</option>
                  <option value="Europe/London">London (GMT+0)</option>
                  <option value="Asia/Tokyo">Tokyo (GMT+9)</option>
                </select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Security & Privacy */}
        <Card className="backdrop-blur-xl bg-zinc-900/40 border-zinc-800/50">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="h-12 w-12 rounded-full bg-green-500/10 flex items-center justify-center">
                <Shield className="h-6 w-6 text-green-400" />
              </div>
              <div>
                <CardTitle className="text-white">Security & Privacy</CardTitle>
                <CardDescription className="text-zinc-400">
                  Protect your account
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-zinc-900/50 rounded-lg border border-zinc-800">
              <div>
                <Label className="text-white">Two-Factor Authentication</Label>
                <p className="text-sm text-zinc-400">Add an extra layer of security</p>
              </div>
              <button
                onClick={() => setSecurity({ ...security, twoFactor: !security.twoFactor })}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  security.twoFactor ? 'bg-yellow-500' : 'bg-zinc-700'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    security.twoFactor ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>

            <div className="space-y-2">
              <Label htmlFor="sessionTimeout" className="text-zinc-400">Session Timeout (minutes)</Label>
              <select
                id="sessionTimeout"
                value={security.sessionTimeout}
                onChange={(e) => setSecurity({ ...security, sessionTimeout: e.target.value })}
                className="w-full px-3 py-2 bg-zinc-900/50 border border-zinc-800 rounded-md text-white focus:border-yellow-500/50 focus:ring-1 focus:ring-yellow-500/20"
              >
                <option value="15">15 minutes</option>
                <option value="30">30 minutes</option>
                <option value="60">1 hour</option>
                <option value="never">Never</option>
              </select>
            </div>
          </CardContent>
        </Card>

        {/* Data Management */}
        <Card className="backdrop-blur-xl bg-zinc-900/40 border-zinc-800/50">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="h-12 w-12 rounded-full bg-orange-500/10 flex items-center justify-center">
                <Database className="h-6 w-6 text-orange-400" />
              </div>
              <div>
                <CardTitle className="text-white">Data Management</CardTitle>
                <CardDescription className="text-zinc-400">
                  Manage your application data
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-zinc-900/50 rounded-lg border border-zinc-800">
              <div>
                <Label className="text-white">Clear Cache</Label>
                <p className="text-sm text-zinc-400">Remove temporary data to free up space</p>
              </div>
              <Button
                onClick={handleClearCache}
                variant="outline"
                className="border-zinc-700 hover:bg-zinc-800/60 hover:text-yellow-500"
              >
                Clear
              </Button>
            </div>

            <div className="flex items-center justify-between p-4 bg-red-950/20 rounded-lg border border-red-900/50">
              <div>
                <Label className="text-red-400">Delete Account</Label>
                <p className="text-sm text-red-400/70">Permanently delete your account and all data</p>
              </div>
              <Button
                onClick={handleDeleteAccount}
                variant="outline"
                className="border-red-900/50 text-red-400 hover:bg-red-950/40"
              >
                <Trash2 size={16} className="mr-2" />
                Delete
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}