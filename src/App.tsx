/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import StandingsPage from './pages/StandingsPage';
import AdminDashboardPage from './pages/AdminDashboardPage';
import { Trophy, Settings, ShieldCheck } from 'lucide-react';
import { testConnection } from './lib/firebase';

export default function App() {
  const [activeTab, setActiveTab] = useState<'standings' | 'admin'>('standings');
  const [isDbLoaded, setIsDbLoaded] = useState(false);

  // Test Connection verification upon initial boot as requested by Firebase skill
  useEffect(() => {
    testConnection().then((ok) => {
      setIsDbLoaded(true);
    });
  }, []);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans antialiased selection:bg-yellow-500 selection:text-black">
      
      {/* Global Application Nav Bar */}
      <header className="sticky top-0 z-40 bg-slate-900/80 backdrop-blur-md border-b border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          
          {/* Logo Brand */}
          <div className="flex items-center gap-2.5 select-none">
            <div className="w-9 h-9 rounded-xl bg-yellow-500 flex items-center justify-center text-black font-black shadow-lg shadow-yellow-500/10 text-lg">
              ⚽
            </div>
            <div>
              <span className="font-extrabold text-white text-sm leading-none block font-sans tracking-tight">SUPER SOLAR 2026</span>
              <span className="text-[10px] text-slate-500 font-bold font-mono uppercase tracking-widest block mt-0.5">FIFA Prediction App</span>
            </div>
          </div>

          {/* Nav pills */}
          <div className="bg-slate-950 p-1.5 rounded-xl flex items-center gap-1 border border-slate-800">
            <button
              id="standings-tab-btn"
              onClick={() => setActiveTab('standings')}
              className={`px-4 py-2 rounded-lg text-xs font-black uppercase tracking-wider flex items-center gap-1.5 transition-all ${
                activeTab === 'standings'
                  ? 'bg-yellow-500 text-black shadow-md font-black'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Trophy className="w-3.5 h-3.5" />
              <span>Leaderboard</span>
            </button>

            <button
              id="admin-tab-btn"
              onClick={() => setActiveTab('admin')}
              className={`px-4 py-2 rounded-lg text-xs font-black uppercase tracking-wider flex items-center gap-1.5 transition-all ${
                activeTab === 'admin'
                  ? 'bg-yellow-500 text-black shadow-md font-black'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Settings className="w-3.5 h-3.5" />
              <span>Admin Console</span>
            </button>
          </div>

        </div>
      </header>

      {/* Main Container Viewport */}
      <main className="flex-grow bg-slate-950 pb-16">
        {activeTab === 'standings' ? (
          <StandingsPage />
        ) : (
          <AdminDashboardPage />
        )}
      </main>

      {/* Global Footer */}
      <footer className="border-t border-slate-900 bg-slate-900/50 py-8 text-slate-500">
        <div className="max-w-7xl mx-auto px-4 text-center space-y-3 text-[10px] font-sans font-medium uppercase tracking-wider">
          <p>© 2026 SUPER SOLAR PREDICTION MATRIX. SECURE WORKSPACE ENGINE SEPARATION.</p>
          <div className="flex items-center justify-center gap-3 font-mono">
            <span className="flex items-center gap-1 text-emerald-500 bg-emerald-500/10 border border-emerald-500/20 px-3 py-1 rounded-lg">
              <ShieldCheck className="w-3.5 h-3.5" /> Zero-Trust Access-Control Verification
            </span>
          </div>
        </div>
      </footer>
    </div>
  );
}
