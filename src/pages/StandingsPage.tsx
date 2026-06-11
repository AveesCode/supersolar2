/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useState } from 'react';
import { db, handleFirestoreError } from '../lib/firebase';
import { collection, onSnapshot, doc, setDoc } from 'firebase/firestore';
import { Participant, Match, SystemState, OperationType } from '../types';
import { generateFullSchedule, getDefaultParticipants } from '../lib/schedule';
import StandingsTable from '../components/StandingsTable';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Trophy, 
  Sparkles, 
  CheckCircle2, 
  AlertTriangle, 
  Clock, 
  User, 
  Filter, 
  FileText, 
  Unlock, 
  MapPin, 
  LogOut, 
  Lock
} from 'lucide-react';

const SHA256 = async (str: string) => {
  const msgBuffer = new TextEncoder().encode(str.toUpperCase());                    
  const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
};

export default function StandingsPage() {
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [matches, setMatches] = useState<Match[]>([]);
  const [systemState, setSystemState] = useState<SystemState | null>(null);
  
  // Real-time synchronization readiness state
  const [dbState, setDbState] = useState<'connecting' | 'connected' | 'offline_fallback'>('connecting');

  // Participant Login Info
  const [currentUser, setCurrentUser] = useState<Participant | null>(null);
  const [loginPasscode, setLoginPasscode] = useState('');
  const [loginError, setLoginError] = useState('');
  
  // Visual Filters for Match Listing
  const [filterTab, setFilterTab] = useState<'all' | 'group' | 'playoff' | 'mine' | 'pending' | 'graded'>('all');
  const [selectedParticipant, setSelectedParticipant] = useState<any>(null);

  // Success Feedback
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'err', text: string } | null>(null);

  useEffect(() => {
    // 1. Subscribe to System Configurations
    const systemDocRef = doc(db, 'system', 'global-config');
    const unsubSystem = onSnapshot(systemDocRef, (snap) => {
      if (snap.exists()) {
        setSystemState(snap.data() as SystemState);
        setDbState('connected');
      } else {
        // Initial setup seed if configuration collection is missing
        const initialCfg: SystemState = {
          id: 'global-config',
          systemName: 'SUPER SOLAR 2026',
          isContestActive: true,
          adminHash: 'd43d008e1e431c20bf6acaa2ba6aa575e83da51eb43b1cd0eea2387e04ead39a', // "admin123" hash
          updatedAt: new Date().toISOString()
        };
        setDoc(systemDocRef, initialCfg).catch(() => {});
      }
    }, () => {
      setDbState('offline_fallback');
    });

    // 2. Subscribe to Matches Schedule
    const matchesCol = collection(db, 'matches');
    const unsubMatches = onSnapshot(matchesCol, (snap) => {
      if (!snap.empty) {
        const list: Match[] = [];
        snap.forEach((docRef) => {
          list.push(docRef.data() as Match);
        });
        // Sort numerically
        list.sort((a, b) => Number(a.id) - Number(b.id));
        setMatches(list);
        localStorage.setItem('world_cup_offline_matches', JSON.stringify(list));
      } else {
        // Empty db! Let's auto-init schedule
        const initSchedule = generateFullSchedule();
        setMatches(initSchedule);
        localStorage.setItem('world_cup_offline_matches', JSON.stringify(initSchedule));
        // Write each statically to initialize cloud Firestore DB
        initSchedule.forEach(async (m) => {
          try {
            await setDoc(doc(db, 'matches', m.id), m);
          } catch (e) {
            console.warn("Bootstrap write prevented. Using local fallback matches.", e);
          }
        });
      }
    }, () => {
      const savedMatches = localStorage.getItem('world_cup_offline_matches');
      if (savedMatches) {
        try {
          setMatches(JSON.parse(savedMatches));
          return;
        } catch (e) {}
      }
      setMatches(generateFullSchedule());
    });

    // 3. Subscribe to Participants scores
    const participantsCol = collection(db, 'participants');
    const unsubParticipants = onSnapshot(participantsCol, (snap) => {
      if (!snap.empty) {
        const list: Participant[] = [];
        snap.forEach((docRef) => {
          list.push(docRef.data() as Participant);
        });
        setParticipants(list);
        localStorage.setItem('world_cup_offline_participants', JSON.stringify(list));
        setDbState('connected');
      } else {
        // Empty db of participants! Let's auto-init players
        const initPlayers = getDefaultParticipants();
        setParticipants(initPlayers);
        localStorage.setItem('world_cup_offline_participants', JSON.stringify(initPlayers));
        initPlayers.forEach(async (p) => {
          try {
            await setDoc(doc(db, 'participants', p.id), p);
          } catch (e) {
            console.warn("Bootstrap write prevented for participants.", p.id, e);
          }
        });
      }
    }, () => {
      // Offline mock fallback if permissions not finalized yet
      setDbState('offline_fallback');
      const savedPlayers = localStorage.getItem('world_cup_offline_participants');
      if (savedPlayers) {
        try {
          setParticipants(JSON.parse(savedPlayers));
          return;
        } catch (e) {}
      }
      setParticipants(getDefaultParticipants());
    });

    return () => {
      unsubSystem();
      unsubMatches();
      unsubParticipants();
    };
  }, []);

  // Update current user if participants list changes in real time so predictions sync
  useEffect(() => {
    if (currentUser) {
      const freshUser = participants.find(p => p.id === currentUser.id);
      if (freshUser) {
        setCurrentUser(freshUser);
      }
    }
  }, [participants]);

  // Login handler
  const handleClientLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');
    const codeClean = loginPasscode.trim().toUpperCase();
    if (!codeClean) return;

    // Scan the live participants collection for this code
    const matched = participants.find((p) => p.code.toUpperCase() === codeClean && p.isActive);
    if (matched) {
      setCurrentUser(matched);
      setLoginPasscode('');
      showFeedback('success', `Logged in as ${matched.firstName} ${matched.lastName}!`);
    } else {
      setLoginError('Invalid participant credentials or suspended account.');
    }
  };

  const showFeedback = (type: 'success' | 'err', text: string) => {
    setStatusMessage({ type, text });
    setTimeout(() => setStatusMessage(null), 3000);
  };

  // Prediction submission handler
  const handleSavePick = async (matchId: string, choice: 'A' | 'B' | 'Tie') => {
    if (!currentUser) return;
    
    const targetMatch = matches.find(m => m.id === matchId);
    if (!targetMatch) return;

    // Strict kickoff lock check (comparative time bounds)
    const kickoffTime = new Date(targetMatch.t);
    const nowTime = new Date();
    if (nowTime > kickoffTime) {
      showFeedback('err', 'This match has started and is locked from further updates.');
      return;
    }

    // Prepare updated map of predictions
    const updatedPicks = {
      ...(currentUser.picks || {}),
      [matchId]: choice
    };

    try {
      const userRef = doc(db, 'participants', currentUser.id);
      await setDoc(userRef, {
        ...currentUser,
        picks: updatedPicks,
        updatedAt: new Date().toISOString()
      });
      showFeedback('success', `Saved Pick: ${choice === 'A' ? targetMatch.a : choice === 'B' ? targetMatch.b : 'Draw'}`);
    } catch (e: any) {
      // Fallback update on interface for offline/mock sandbox states
      const nextUser = { ...currentUser, picks: updatedPicks, updatedAt: new Date().toISOString() };
      setCurrentUser(nextUser);
      setParticipants((prev) => {
        const list = prev.map(p => p.id === currentUser.id ? nextUser : p);
        localStorage.setItem('world_cup_offline_participants', JSON.stringify(list));
        return list;
      });
      showFeedback('success', 'Local prediction registered (Mock Sandbox Enabled)');
    }
  };

  // Perform calculations for top stats
  const gradedMatchesCount = matches.filter(m => m.res).length;
  const totalCompetitors = participants.length;

  // Filtered Match items
  const nowObj = new Date();
  const getFilteredMatches = () => {
    return matches.filter((m) => {
      const kickoff = new Date(m.t);
      const isPast = nowObj > kickoff;
      
      switch (filterTab) {
        case 'group':
          return m.type === 'Group';
        case 'playoff':
          return m.type === 'Playoff';
        case 'mine':
          return currentUser && currentUser.picks?.[m.id];
        case 'pending':
          return !isPast;
        case 'graded':
          return m.res;
        default:
          return true; // 'all'
      }
    });
  };

  const filteredMatches = getFilteredMatches();

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 space-y-8 font-sans">
      
      {/* Header Panel */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6 bg-slate-900 border border-slate-800 text-white rounded-3xl p-8 shadow-xl relative overflow-hidden">
        <div className="absolute right-0 bottom-0 top-0 w-2/3 bg-radial from-yellow-500/5 via-transparent to-transparent pointer-events-none" />
        
        <div className="space-y-2 z-10">
          <div className="inline-flex items-center gap-1.5 bg-yellow-500/10 border border-yellow-500/20 text-yellow-500 font-mono text-[10px] font-bold px-3 py-1 rounded-lg uppercase tracking-wider">
            <Sparkles className="w-3.5 h-3.5" /> SUPER SOLAR Live Sync Activated
          </div>
          <h1 className="text-3xl md:text-5xl font-black tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 via-yellow-500 to-orange-500 font-sans">
            {systemState?.systemName || "SUPER SOLAR 2026"}
          </h1>
          <p className="text-xs text-slate-400 font-semibold uppercase tracking-widest font-mono">
            FIFA WORLD CUP 2026 PREDICTION TRACKER
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3 z-10 font-mono">
          <button 
            type="button"
            onClick={() => {
              if (confirm("⚽ Force seed/refresh matches and all 14 pre-registered World Cup participants? This resets offline data states and attempts background synchronizations.")) {
                localStorage.removeItem('world_cup_offline_matches');
                localStorage.removeItem('world_cup_offline_participants');
                
                const initPlayers = getDefaultParticipants();
                const initSchedule = generateFullSchedule();
                setParticipants(initPlayers);
                setMatches(initSchedule);
                localStorage.setItem('world_cup_offline_participants', JSON.stringify(initPlayers));
                localStorage.setItem('world_cup_offline_matches', JSON.stringify(initSchedule));

                // Auto-register background Firestore docs
                initPlayers.forEach(async (p) => {
                  try { await setDoc(doc(db, 'participants', p.id), p); } catch(e) {}
                });
                initSchedule.forEach(async (m) => {
                  try { await setDoc(doc(db, 'matches', m.id), m); } catch(e) {}
                });

                showFeedback('success', 'FIFA 2026 participants and matches schedule re-seeded successfully.');
              }
            }}
            className="flex items-center gap-1.5 bg-slate-800 hover:bg-slate-700 border border-slate-705 px-3 py-2 rounded-2xl transition text-[10px] text-slate-300 hover:text-yellow-400 font-bold uppercase tracking-wider cursor-pointer"
          >
            🔄 Force Re-Seed
          </button>

          {dbState === 'connected' ? (
            <div className="flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/20 px-4 py-2.5 rounded-2xl">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-[10px] text-emerald-400 font-bold uppercase tracking-wider">DATABASE SYSTEM ONLINE</span>
            </div>
          ) : (
            <div className="flex items-center gap-2 bg-yellow-500/10 border border-yellow-500/20 px-4 py-2.5 rounded-2xl">
              <span className="w-2.5 h-2.5 rounded-full bg-yellow-500 animate-pulse" />
              <span className="text-[10px] text-yellow-400 font-bold uppercase tracking-wider">DEMO SANDBOX FALLBACK</span>
            </div>
          )}
        </div>
      </div>

      {/* Mini Info boxes */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl flex items-center justify-between">
          <div>
            <span className="text-[10px] text-slate-400 font-bold font-mono uppercase tracking-widest block">Active Competitors</span>
            <span className="text-3xl font-black text-white font-mono block mt-1">{totalCompetitors}</span>
            <span className="text-[10px] text-slate-500 mt-1 block">Registered in scoreboard matrix</span>
          </div>
          <span className="text-3xl">👥</span>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl flex items-center justify-between">
          <div>
            <span className="text-[10px] text-slate-400 font-bold font-mono uppercase tracking-widest block">Total Match Calendar</span>
            <span className="text-3xl font-black text-white font-mono block mt-1">{matches.length}</span>
            <span className="text-[10px] text-slate-500 mt-1 block">Group & Playoff Stages</span>
          </div>
          <span className="text-3xl">📅</span>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl flex items-center justify-between">
          <div>
            <span className="text-[10px] text-slate-400 font-bold font-mono uppercase tracking-widest block">Matches Graded</span>
            <span className="text-3xl font-black text-yellow-500 font-mono block mt-1">{gradedMatchesCount}</span>
            <span className="text-[10px] text-slate-500 mt-1 block">Calculated into live standings</span>
          </div>
          <span className="text-3xl">⭐</span>
        </div>
      </div>

      {/* Main split sections */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Left/Leaderboard: Column span 5 */}
        <div className="lg:col-span-5 space-y-6">
          <StandingsTable 
            participants={participants} 
            matches={matches}
            onSelectParticipant={(p) => setSelectedParticipant(p)}
          />
        </div>

        {/* Right/Auth or Predictions List: Column span 7 */}
        <div className="lg:col-span-7 space-y-6">
          
          {/* Guest login card if locked */}
          <AnimatePresence mode="wait">
            {!currentUser ? (
              <motion.div
                key="login-auth"
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.98 }}
                className="bg-slate-900 border border-slate-800 p-8 rounded-3xl shadow-xl flex flex-col justify-center text-center space-y-6"
              >
                <div className="w-16 h-16 bg-yellow-500/10 rounded-2xl flex items-center justify-center text-yellow-500 border border-yellow-500/20 mx-auto">
                  <Clock className="w-8 h-8" />
                </div>
                
                <div>
                  <h3 className="text-xl font-extrabold text-white">Enter Predictions Dashboard</h3>
                  <p className="text-xs text-slate-400 mt-1.5 max-w-sm mx-auto">
                    Type in your verified upper-case participant login credentials/code to save match picks.
                  </p>
                </div>

                <form onSubmit={handleClientLogin} className="max-w-md mx-auto w-full flex flex-col gap-3 font-mono">
                  <input
                    type="text"
                    required
                    placeholder="ENTER PARTICIPANT CODE"
                    value={loginPasscode}
                    onChange={(e) => setLoginPasscode(e.target.value.toUpperCase())}
                    className="w-full text-center tracking-widest uppercase p-4 border border-slate-800 bg-slate-950 text-slate-100 rounded-xl outline-none focus:border-yellow-500 font-extrabold"
                  />
                  
                  {loginError && (
                    <div className="text-xs text-red-400 font-semibold p-2">
                      ⚠️ {loginError}
                    </div>
                  )}

                  <button
                    type="submit"
                    className="w-full bg-yellow-500 hover:bg-yellow-400 text-black py-4 rounded-xl font-extrabold tracking-widest uppercase transition-all shadow-lg hover:shadow-yellow-500/10 scale-100 active:scale-98"
                  >
                    ACCESS PORTAL
                  </button>
                </form>

                <div className="p-3 bg-slate-950 rounded-xl max-w-sm mx-auto text-[10px] text-slate-500 border border-slate-850">
                  ⚡ Don't have a login code? Ask your designated administrator to add you to the participant listing.
                </div>
              </motion.div>
            ) : (
              <motion.div
                key="predictions-active"
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.98 }}
                className="space-y-6"
              >
                
                {/* Logged in welcome info */}
                <div className="bg-slate-900 border border-slate-800 p-6 rounded-3xl flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl bg-yellow-500 border border-yellow-400 text-black flex items-center justify-center font-black text-base uppercase">
                      {currentUser.firstName.charAt(0)}{currentUser.lastName.charAt(0)}
                    </div>
                    <div>
                      <h3 className="font-extrabold text-white text-lg">{currentUser.firstName} {currentUser.lastName}</h3>
                      <span className="text-[10px] text-slate-400 uppercase font-bold tracking-widest font-mono">
                        Active Solver • Code <span className="text-yellow-500">{currentUser.code}</span>
                      </span>
                    </div>
                  </div>

                  <button
                    onClick={() => setCurrentUser(null)}
                    className="flex items-center gap-1 px-3 py-2 text-[10px] font-black uppercase font-mono bg-slate-950 border border-slate-850 hover:bg-red-950/30 text-slate-400 hover:text-red-400 hover:border-red-900/40 rounded-xl transition-all"
                  >
                    <LogOut className="w-3.5 h-3.5" /> Logout
                  </button>
                </div>

                {/* Match filters toolbar */}
                <div className="flex flex-wrap items-center gap-1.5 p-1 bg-slate-900/60 border border-slate-800 rounded-2xl w-full">
                  <button
                    onClick={() => setFilterTab('all')}
                    className={`px-3 py-2 rounded-xl text-[10px] font-bold uppercase transition-all flex items-center gap-1 ${
                      filterTab === 'all' ? 'bg-yellow-500 text-black font-black' : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    All ({matches.length})
                  </button>
                  <button
                    onClick={() => setFilterTab('group')}
                    className={`px-3 py-2 rounded-xl text-[10px] font-bold uppercase transition-all flex items-center gap-1 ${
                      filterTab === 'group' ? 'bg-yellow-500 text-black font-black' : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    Groups
                  </button>
                  <button
                    onClick={() => setFilterTab('playoff')}
                    className={`px-3 py-2 rounded-xl text-[10px] font-bold uppercase transition-all flex items-center gap-1 ${
                      filterTab === 'playoff' ? 'bg-yellow-500 text-black font-black' : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    Knockouts
                  </button>
                  <button
                    onClick={() => setFilterTab('mine')}
                    className={`px-3 py-2 rounded-xl text-[10px] font-bold uppercase transition-all flex items-center gap-1 ${
                      filterTab === 'mine' ? 'bg-yellow-500 text-black font-black' : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    My Predictions
                  </button>
                  <button
                    onClick={() => setFilterTab('pending')}
                    className={`px-3 py-2 rounded-xl text-[10px] font-bold uppercase transition-all flex items-center gap-1 ${
                      filterTab === 'pending' ? 'bg-yellow-500 text-black font-black' : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    Upcoming
                  </button>
                  <button
                    onClick={() => setFilterTab('graded')}
                    className={`px-3 py-2 rounded-xl text-[10px] font-bold uppercase transition-all flex items-center gap-1 ${
                      filterTab === 'graded' ? 'bg-yellow-500 text-black font-black' : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    Graded Only
                  </button>
                </div>

                {/* Match card predictions container */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-h-[800px] overflow-y-auto pr-2">
                  {filteredMatches.length === 0 ? (
                    <div className="col-span-full py-16 text-center text-xs text-slate-500 uppercase tracking-widest font-mono">
                      No matches found in this category filter
                    </div>
                  ) : (
                    filteredMatches.map((m) => {
                      const kickoff = new Date(m.t);
                      const isLocked = nowObj > kickoff;
                      const hasGraded = !!m.res;
                      const userPick = currentUser.picks?.[m.id];
                      
                      const isCorrect = hasGraded && userPick === m.res;
                      const isIncorrect = hasGraded && userPick !== m.res;

                      return (
                        <div
                          key={m.id}
                          className={`bg-slate-900 border p-5 rounded-2xl flex flex-col justify-between transition-all space-y-4 ${
                            isLocked ? 'border-slate-950 opacity-70' : 'border-slate-800'
                          } ${isCorrect ? 'ring-2 ring-emerald-500/30 border-emerald-500/20 bg-emerald-950/5' : ''} ${
                            isIncorrect ? 'ring-2 ring-red-500/20 border-red-500/20 bg-red-950/5' : ''
                          }`}
                        >
                          {/* Top Tag header */}
                          <div className="flex items-center justify-between">
                            <span className="text-[10px] font-black text-slate-500 uppercase font-mono">Match #{m.id}</span>
                            
                            <div className="flex items-center gap-1">
                              {isLocked ? (
                                <span className="flex items-center gap-1 text-[9px] font-bold text-slate-400 font-mono uppercase bg-slate-950 border border-slate-850 px-2 py-0.5 rounded-md">
                                  <Lock className="w-2.5 h-2.5" /> LOCKED
                                </span>
                              ) : (
                                <span className="flex items-center gap-1 text-[9px] font-bold text-emerald-400 font-mono uppercase bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-md">
                                  <Unlock className="w-2.5 h-2.5" /> OPEN
                                </span>
                              )}
                            </div>
                          </div>

                          {/* Match details */}
                          <div className="space-y-1">
                            <p className="text-[10px] text-slate-300 font-semibold flex items-center gap-1 tracking-tight">
                              <MapPin className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                              <span className="truncate">{m.v} • {m.c}</span>
                            </p>
                            <p className="text-[10px] text-yellow-500 font-bold font-mono uppercase tracking-wide">
                              {kickoff.toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })} ET
                            </p>
                          </div>

                          {/* Pick Selection buttons */}
                          <div className="flex flex-col gap-1.5">
                            {/* Team A Button */}
                            <button
                              disabled={isLocked}
                              onClick={() => handleSavePick(m.id, 'A')}
                              className={`flex justify-between items-center p-3 rounded-xl border text-xs font-bold font-mono transition-all uppercase ${
                                userPick === 'A'
                                  ? 'bg-yellow-500 border-yellow-400 text-black font-black shadow-md'
                                  : 'bg-slate-950 border-slate-800 text-slate-200 hover:border-slate-700 disabled:hover:border-slate-800'
                              }`}
                            >
                              <span className="truncate">{m.a}</span>
                              {m.res === 'A' && <span className="text-[10px]">⭐ RESULT</span>}
                            </button>

                            {/* Group stage DRAW option */}
                            {m.type === 'Group' && (
                              <button
                                disabled={isLocked}
                                onClick={() => handleSavePick(m.id, 'Tie')}
                                className={`p-1.5 rounded-lg border text-[9px] font-extrabold uppercase transition-all font-mono ${
                                  userPick === 'Tie'
                                    ? 'bg-slate-700 border-slate-500 text-white'
                                    : 'bg-slate-950 border-slate-900 text-slate-400 hover:border-slate-800 disabled:hover:border-slate-900'
                                }`}
                              >
                                DRAW {m.res === 'Tie' ? '⭐' : ''}
                              </button>
                            )}

                            {/* Team B Button */}
                            <button
                              disabled={isLocked}
                              onClick={() => handleSavePick(m.id, 'B')}
                              className={`flex justify-between items-center p-3 rounded-xl border text-xs font-bold font-mono transition-all uppercase ${
                                userPick === 'B'
                                  ? 'bg-yellow-500 border-yellow-400 text-black font-black shadow-md'
                                  : 'bg-slate-950 border-slate-800 text-slate-200 hover:border-slate-700 disabled:hover:border-slate-800'
                              }`}
                            >
                              <span className="truncate">{m.b}</span>
                              {m.res === 'B' && <span className="text-[10px]">⭐ RESULT</span>}
                            </button>
                          </div>

                          {/* Result status summary */}
                          {hasGraded && (
                            <div className="pt-2 border-t border-slate-850 flex items-center justify-between text-[10px] font-mono font-bold uppercase transition-all">
                              {isCorrect ? (
                                <span className="text-emerald-400 flex items-center gap-1.5">
                                  <CheckCircle2 className="w-3.5 h-3.5 shrink-0" /> Correct (+1 PTS)
                                </span>
                              ) : (
                                <span className="text-slate-400 flex items-center gap-1.5">
                                  Incorrect pick
                                </span>
                              )}
                              <span className="text-slate-500">
                                Winner: {m.res === 'A' ? m.a : m.res === 'B' ? m.b : 'Draw'}
                              </span>
                            </div>
                          )}

                        </div>
                      );
                    })
                  )}
                </div>

              </motion.div>
            )}
          </AnimatePresence>

        </div>
      </div>

      {/* Profile inspection detail modal overlay */}
      <AnimatePresence>
        {selectedParticipant && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.5 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedParticipant(null)}
              className="absolute inset-0 bg-slate-950"
            />

            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-2xl w-full max-w-md z-10 p-6 space-y-6"
            >
              <div className="flex items-center justify-between border-b border-slate-850 pb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-yellow-500/10 border border-yellow-500/20 flex items-center justify-center text-yellow-500 font-extrabold text-sm">
                    {selectedParticipant.firstName.charAt(0)}{selectedParticipant.lastName.charAt(0)}
                  </div>
                  <div>
                    <h3 className="text-white font-extrabold text-base">{selectedParticipant.fullName}</h3>
                    <p className="text-[10px] text-slate-500 font-mono mt-0.5 uppercase tracking-widest leading-none">Participant statistics</p>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedParticipant(null)}
                  className="p-1.5 rounded-lg bg-slate-950 hover:bg-slate-800 text-slate-400 hover:text-white border border-slate-850 hover:border-slate-800 transition-all text-xs font-bold"
                >
                  Close
                </button>
              </div>

              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-slate-950 p-4 rounded-xl border border-slate-850">
                    <span className="text-[9px] text-slate-500 block uppercase font-mono font-bold tracking-widest">Total score</span>
                    <span className="text-2xl font-black text-yellow-500 font-mono block mt-1">{selectedParticipant.score} PTS</span>
                  </div>
                  <div className="bg-slate-950 p-4 rounded-xl border border-slate-850">
                    <span className="text-[9px] text-slate-500 block uppercase font-mono font-bold tracking-widest">Picks accuracy</span>
                    <span className="text-2xl font-black text-slate-200 font-mono block mt-1">{selectedParticipant.accuracy}%</span>
                  </div>
                </div>

                <div className="bg-slate-950 p-4 rounded-xl border border-slate-850 divide-y divide-slate-850 font-mono text-xs text-slate-400 space-y-2.5">
                  <div className="flex justify-between items-center pb-2 pt-0.5">
                    <span>Total Predictions Saved</span>
                    <span className="font-extrabold text-slate-200">{selectedParticipant.totalPicks} / 104</span>
                  </div>
                  <div className="flex justify-between items-center py-2">
                    <span>Correct Predictions (⭐)</span>
                    <span className="font-extrabold text-yellow-500">{selectedParticipant.correct}</span>
                  </div>
                  <div className="flex justify-between items-center pt-2">
                    <span>Graded Played Matches</span>
                    <span className="font-extrabold text-slate-200">{selectedParticipant.playedGrades}</span>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Feedback Status Alert Bubble */}
      <AnimatePresence>
        {statusMessage && (
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 15 }}
            className={`fixed bottom-6 right-6 z-50 p-4 rounded-xl shadow-lg border text-xs font-semibold font-mono uppercase tracking-wide flex items-center gap-2.5 ${
              statusMessage.type === 'success'
                ? 'bg-emerald-950 border-emerald-900 text-emerald-400'
                : 'bg-red-950 border-red-900 text-red-400'
            }`}
          >
            {statusMessage.type === 'success' ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
            ) : (
              <AlertTriangle className="w-5 h-5 text-red-400 shrink-0" />
            )}
            <span>{statusMessage.text}</span>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}
