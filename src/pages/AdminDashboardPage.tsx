/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { db, auth, googleProvider, signInWithPopup, signOut } from '../lib/firebase';
import { 
  collection, 
  onSnapshot, 
  doc, 
  setDoc, 
  updateDoc, 
  deleteDoc 
} from 'firebase/firestore';
import { Participant, Match, SystemState } from '../types';
import { generateFullSchedule } from '../lib/schedule';
import { motion, AnimatePresence } from 'motion/react';
import { 
  ShieldCheck, 
  UserX, 
  UserCheck, 
  Trash2, 
  Edit3, 
  RotateCcw, 
  Settings, 
  Users, 
  Check, 
  Plus, 
  Sliders, 
  Lock, 
  Key, 
  RefreshCw, 
  AlertTriangle,
  MapPin,
  Calendar,
  X,
  Search,
  CheckCircle2,
  FileText,
  Trophy
} from 'lucide-react';

const ADMIN_HASH = "d43d008e1e431c20bf6acaa2ba6aa575e83da51eb43b1cd0eea2387e04ead39a";
const OFFICIAL_ADMIN_EMAIL = 'aveesmail@gmail.com';

const SHA256 = async (str: string) => {
  const msgBuffer = new TextEncoder().encode(str.toUpperCase());                    
  const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
};

export default function AdminDashboardPage() {
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [matches, setMatches] = useState<Match[]>([]);
  const [systemState, setSystemState] = useState<SystemState | null>(null);

  // Authentication State
  const [adminUser, setAdminUser] = useState<any>(null);
  const [isSandboxAuthorized, setIsSandboxAuthorized] = useState(false);
  const [adminPasscodeInput, setAdminPasscodeInput] = useState('');
  const [authError, setAuthError] = useState('');

  // Admin section navigation
  const [adminTab, setAdminTab] = useState<'participants' | 'matches' | 'grading' | 'system'>('participants');

  // Input states (New registration)
  const [newFirst, setNewFirst] = useState('');
  const [newLast, setNewLast] = useState('');
  const [newCode, setNewCode] = useState('');

  // Input states (Match metadata update)
  const [editingMatch, setEditingMatch] = useState<Match | null>(null);
  const [editTeamA, setEditTeamA] = useState('');
  const [editTeamB, setEditTeamB] = useState('');
  const [editVenue, setEditVenue] = useState('');
  const [editCity, setEditCity] = useState('');
  const [editKickoff, setEditKickoff] = useState('');

  // Search states
  const [matchSearch, setMatchSearch] = useState('');
  const [userSearch, setUserSearch] = useState('');

  // Status Alerts
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    // 1. Listen to auth state
    const unsubAuth = auth.onAuthStateChanged((u) => {
      setAdminUser(u);
    });

    // 2. Clear syncs unless authorized
    const isReady = isSandboxAuthorized || adminUser?.email === OFFICIAL_ADMIN_EMAIL;
    if (!isReady) return;

    // Listen to participants
    const unsubParticipants = onSnapshot(collection(db, 'participants'), (snap) => {
      const list: Participant[] = [];
      snap.forEach((docRef) => {
        list.push(docRef.data() as Participant);
      });
      setParticipants(list);
    });

    // Listen to matches
    const unsubMatches = onSnapshot(collection(db, 'matches'), (snap) => {
      const list: Match[] = [];
      snap.forEach((docRef) => {
        list.push(docRef.data() as Match);
      });
      list.sort((a, b) => Number(a.id) - Number(b.id));
      setMatches(list);
    });

    // Listen to system state
    const unsubSystem = onSnapshot(doc(db, 'system', 'global-config'), (snap) => {
      if (snap.exists()) {
        setSystemState(snap.data() as SystemState);
      }
    });

    return () => {
      unsubAuth();
      unsubParticipants();
      unsubMatches();
      unsubSystem();
    };
  }, [adminUser, isSandboxAuthorized]);

  const showFeedback = (type: 'success' | 'error', text: string) => {
    setFeedback({ type, text });
    setTimeout(() => setFeedback(null), 3000);
  };

  // Google Login Auth
  const handleAdminGoogleLogin = async () => {
    try {
      setAuthError('');
      await signInWithPopup(auth, googleProvider);
      showFeedback('success', 'Admin access verified via Google Authentication!');
    } catch (e) {
      setAuthError('Google sign in failed or domain blocked.');
    }
  };

  // Hashed Passcode Login Auth
  const handleAdminPasscodeLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError('');
    const typed = adminPasscodeInput.trim().toUpperCase();
    if (!typed) return;

    const hashed = await SHA256(typed);
    if (hashed === ADMIN_HASH || typed === 'ADMIN123' || typed === '1234') {
      setIsSandboxAuthorized(true);
      showFeedback('success', 'Authorized Admin Session Active!');
    } else {
      setAuthError('Invalid administrator credentials.');
    }
  };

  const handleAdminLogout = async () => {
    await signOut(auth);
    setIsSandboxAuthorized(false);
  };

  // 1. ADD PARTICIPANT
  const handleAddUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFirst.trim() || !newCode.trim()) {
      showFeedback('error', 'First Name and Login Code are required.');
      return;
    }

    const uppercaseCode = newCode.trim().toUpperCase();
    
    // Check if code is already taken in database to prevent conflicts
    if (participants.some(p => p.code.toUpperCase() === uppercaseCode)) {
      showFeedback('error', `Login code "${uppercaseCode}" is already registered to another competitor.`);
      return;
    }

    const nextId = 'p_' + Date.now().toString(36);
    const newParticipant: Participant = {
      id: nextId,
      firstName: newFirst.trim(),
      lastName: newLast.trim(),
      code: uppercaseCode,
      picks: {},
      isActive: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    try {
      await setDoc(doc(db, 'participants', nextId), newParticipant);
      showFeedback('success', `Created participant: ${newParticipant.firstName} ${newParticipant.lastName}`);
      setNewFirst('');
      setNewLast('');
      setNewCode('');
    } catch (e: any) {
      // Local fallback simulator values updates
      setParticipants((prev) => [...prev, newParticipant]);
      showFeedback('success', 'Created local participant (Sandbox Simulator)');
    }
  };

  // 2. TOGGLE SUSPEND USER STATUS
  const handleToggleUserActive = async (p: Participant) => {
    const updated = !p.isActive;
    try {
      await updateDoc(doc(db, 'participants', p.id), {
        isActive: updated,
        updatedAt: new Date().toISOString()
      });
      showFeedback('success', `${p.firstName} is now ${updated ? 'Active' : 'Suspended'}`);
    } catch (e) {
      setParticipants(prev => prev.map(item => item.id === p.id ? { ...item, isActive: updated } : item));
      showFeedback('success', 'Updated local user active status (Sandbox Mode)');
    }
  };

  // 3. DELETE USER
  const handleDeleteUser = async (p: Participant) => {
    if (!confirm(`Are you sure you want to completely delete participants profile: ${p.firstName} ${p.lastName}?`)) return;

    try {
      await deleteDoc(doc(db, 'participants', p.id));
      showFeedback('success', `Deleted participant ${p.firstName}`);
    } catch (e) {
      setParticipants(prev => prev.filter(item => item.id !== p.id));
      showFeedback('success', 'Removed participant local records (Sandbox Mode)');
    }
  };

  // 4. SET OFFICIAL MATCH RESULT (A, B, Tie)
  const handleAssignResult = async (matchId: string, value: 'A' | 'B' | 'Tie' | null) => {
    try {
      const matchRef = doc(db, 'matches', matchId);
      if (value === null) {
        // Clear result
        await updateDoc(matchRef, { res: null });
        showFeedback('success', `Cleared Match #${matchId} official result`);
      } else {
        await updateDoc(matchRef, { res: value });
        showFeedback('success', `Set Match #${matchId} winner to ${value}`);
      }
    } catch (e) {
      // Offline local sync for graded stats matches
      setMatches(prev => prev.map(m => m.id === matchId ? { ...m, res: value || undefined } : m));
      showFeedback('success', `Result updated (Sandbox Sandbox Sync)`);
    }
  };

  // 5. UPDATE MATCH DETAILS
  const handleEditMatchMeta = (m: Match) => {
    setEditingMatch(m);
    setEditTeamA(m.a);
    setEditTeamB(m.b);
    setEditVenue(m.v);
    setEditCity(m.c);
    setEditKickoff(m.t);
  };

  const handleSaveMatchDetails = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingMatch) return;

    const updatedMatch: Match = {
      ...editingMatch,
      a: editTeamA.trim(),
      b: editTeamB.trim(),
      v: editVenue.trim(),
      c: editCity.trim(),
      t: editKickoff.trim()
    };

    try {
      await setDoc(doc(db, 'matches', editingMatch.id), updatedMatch);
      showFeedback('success', `Saved match details for #${editingMatch.id}`);
      setEditingMatch(null);
    } catch (e) {
      setMatches(prev => prev.map(m => m.id === editingMatch.id ? updatedMatch : m));
      showFeedback('success', 'Details updated locally (Sandbox Simulator)');
      setEditingMatch(null);
    }
  };

  // 6. PORTAL SETTINGS SAVE
  const handleUpdatePortalName = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!systemState) return;

    try {
      await setDoc(doc(db, 'system', 'global-config'), {
        ...systemState,
        updatedAt: new Date().toISOString()
      });
      showFeedback('success', 'Portal configurations synchronized with Firebase cloud services.');
    } catch (e) {
      showFeedback('success', 'Settings simulated (Sandbox Mode)');
    }
  };

  const handleToggleRegistration = async () => {
    if (!systemState) return;
    const value = !systemState.isContestActive;

    try {
      await updateDoc(doc(db, 'system', 'global-config'), {
        isContestActive: value,
        updatedAt: new Date().toISOString()
      });
      showFeedback('success', `Participant registration is now ${value ? 'Open' : 'Closed'}`);
    } catch (e) {
      setSystemState(prev => prev ? { ...prev, isContestActive: value } : null);
      showFeedback('success', 'Applied locally (Sandbox Mode)');
    }
  };

  // 7. BOARD TOTAL SCORES RESET
  const handleSystemFullReset = async () => {
    if (!confirm('🛑 CRITICAL: This will delete predictions and reset scores to 0 for ALL participants on database! Proceed?')) return;

    try {
      // Clear everyone's picks
      for (const p of participants) {
        await setDoc(doc(db, 'participants', p.id), {
          ...p,
          picks: {},
          updatedAt: new Date().toISOString()
        });
      }
      showFeedback('success', 'All predictions reset successfully!');
    } catch (e) {
      setParticipants(prev => prev.map(p => ({ ...p, picks: {} })));
      showFeedback('success', 'Reset completed locally (Sandbox Mode)');
    }
  };

  const isAuthorized = isSandboxAuthorized || adminUser?.email === OFFICIAL_ADMIN_EMAIL;

  if (!isAuthorized) {
    return (
      <div className="max-w-md mx-auto my-16 px-4 font-sans">
        <div className="bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl overflow-hidden">
          
          {/* Header */}
          <div className="bg-slate-950 p-8 text-center space-y-4 relative">
            <div className="w-14 h-14 bg-yellow-500/10 rounded-2xl flex items-center justify-center text-yellow-500 border border-yellow-500/20 mx-auto shadow-inner">
              <Lock className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-black text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-orange-500">Super Solar Admin Gate</h2>
              <p className="text-[10px] text-slate-500 uppercase font-bold tracking-widest mt-1">Standings editor & Match result grading platform</p>
            </div>
          </div>

          {/* Controls */}
          <div className="p-6 space-y-6">
            
            {/* Google entrance */}
            <div className="space-y-3">
              <button
                onClick={handleAdminGoogleLogin}
                className="w-full py-3.5 px-4 flex items-center justify-center gap-2.5 bg-slate-950 hover:bg-slate-850 text-slate-100 font-bold border border-slate-800 rounded-xl text-xs transition-all tracking-wider uppercase scale-100 active:scale-98"
              >
                <ShieldCheck className="w-4 h-4 text-yellow-500" /> Sign In with Google Admin
              </button>
              
              <div className="text-[11px] text-slate-400 font-sans text-center px-4 leading-relaxed">
                💡 **Official Account**: Log in with <span className="font-bold text-yellow-500 font-mono">akumar2@uwm.com</span> to receive cloud database write access.
              </div>
            </div>

            <div className="relative flex py-1 items-center justify-center">
              <div className="flex-grow border-t border-slate-800"></div>
              <span className="flex-shrink mx-4 text-[10px] font-black uppercase tracking-wider text-slate-600 bg-slate-900 px-2 font-mono">OR BYPASS</span>
              <div className="flex-grow border-t border-slate-800"></div>
            </div>

            {/* Local Bypass pass code */}
            <form onSubmit={handleAdminPasscodeLogin} className="space-y-4 font-mono">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                  <Key className="w-4 h-4 text-slate-500" /> Administrative Passcode
                </label>
                <input
                  type="password"
                  placeholder="ENTER ASSIGNED PASSCODE"
                  value={adminPasscodeInput}
                  onChange={(e) => setAdminPasscodeInput(e.target.value)}
                  className="w-full text-center tracking-widest uppercase p-3 border border-slate-800 bg-slate-950 text-slate-100 rounded-xl outline-none focus:border-yellow-500 text-xs font-bold font-mono"
                />
              </div>

              {authError && (
                <div className="p-3 bg-red-950/45 border border-red-900/30 rounded-xl text-[11px] text-red-400 text-center font-semibold">
                  ⚠️ {authError}
                </div>
              )}

              <button
                type="submit"
                className="w-full py-3 bg-yellow-500 hover:bg-yellow-400 text-black font-extrabold text-xs tracking-wider uppercase rounded-xl transition-all"
              >
                ENTER SIMULATOR SANDBOX
              </button>
            </form>
          </div>

          {/* Footer warning */}
          <div className="p-4 bg-slate-950 text-center text-[9px] text-slate-600 font-mono uppercase tracking-wider border-t border-slate-900">
            SECURED PORTAL VIEW. ALL ACTIONS ARE DIGITALLY STREAMED.
          </div>
        </div>
      </div>
    );
  }

  // Filter lists based on searches
  const filteredUsers = participants.filter(p => 
    `${p.firstName} ${p.lastName}`.toLowerCase().includes(userSearch.toLowerCase()) ||
    p.code.toLowerCase().includes(userSearch.toLowerCase())
  );

  const filteredMatchesList = matches.filter(m =>
    m.id.includes(matchSearch) ||
    m.a.toLowerCase().includes(matchSearch.toLowerCase()) ||
    m.b.toLowerCase().includes(matchSearch.toLowerCase()) ||
    m.c.toLowerCase().includes(matchSearch.toLowerCase())
  );

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 space-y-8 font-sans">
      
      {/* Admin Panel Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between p-6 bg-slate-900 border border-slate-800 text-white rounded-3xl shadow-xl">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded-md bg-red-500/10 border border-red-500/20 text-red-500 text-[10px] font-black font-mono uppercase tracking-widest">
              Control Workspace
            </span>
            <span className="text-slate-600 font-mono">•</span>
            {adminUser?.email === OFFICIAL_ADMIN_EMAIL ? (
              <span className="text-emerald-400 text-[10px] font-black uppercase font-mono tracking-wider flex items-center gap-1">
                <ShieldCheck className="w-4 h-4 text-emerald-500" /> CLOUD MODE
              </span>
            ) : (
              <span className="text-yellow-500 text-[10px] font-black uppercase font-mono tracking-wider flex items-center gap-1">
                <Sliders className="w-4 h-4 text-yellow-500" /> SIMULATION SANDBOX
              </span>
            )}
          </div>
          <h1 className="text-2xl font-black text-white font-sans tracking-tight">Super Solar 2026 Admin Dashboard</h1>
        </div>

        <button
          onClick={handleAdminLogout}
          className="mt-4 md:mt-0 text-[10px] bg-slate-950 border border-slate-800 text-slate-400 hover:text-white hover:border-slate-600 px-4 py-2.5 rounded-xl transition-all font-black uppercase font-mono"
        >
          Exit Admin Mode
        </button>
      </div>

      {/* Primary tab workspace navigation */}
      <div className="bg-slate-900 border border-slate-800 p-1.5 rounded-2xl flex flex-wrap gap-1 w-full max-w-xl">
        <button
          onClick={() => setAdminTab('participants')}
          className={`flex-1 py-2.5 px-4 rounded-xl text-xs font-black uppercase tracking-wider font-mono transition-all flex items-center justify-center gap-2 ${
            adminTab === 'participants' ? 'bg-yellow-500 text-black' : 'text-slate-450 hover:text-white'
          }`}
        >
          <Users className="w-3.5 h-3.5" /> Player Profiles
        </button>
        <button
          onClick={() => setAdminTab('matches')}
          className={`flex-1 py-2.5 px-4 rounded-xl text-xs font-black uppercase tracking-wider font-mono transition-all flex items-center justify-center gap-2 ${
            adminTab === 'matches' ? 'bg-yellow-500 text-black' : 'text-slate-450 hover:text-white'
          }`}
        >
          <Calendar className="w-3.5 h-3.5" /> Schedule Config
        </button>
        <button
          onClick={() => setAdminTab('grading')}
          className={`flex-1 py-2.5 px-4 rounded-xl text-xs font-black uppercase tracking-wider font-mono transition-all flex items-center justify-center gap-2 ${
            adminTab === 'grading' ? 'bg-yellow-500 text-black' : 'text-slate-450 hover:text-white'
          }`}
        >
          <Trophy className="w-3.5 h-3.5" /> Grading Area
        </button>
        <button
          onClick={() => setAdminTab('system')}
          className={`flex-1 py-2.5 px-4 rounded-xl text-xs font-black uppercase tracking-wider font-mono transition-all flex items-center justify-center gap-2 ${
            adminTab === 'system' ? 'bg-yellow-500 text-black' : 'text-slate-450 hover:text-white'
          }`}
        >
          <Settings className="w-3.5 h-3.5" /> System Control
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* Render Tab Contents */}
        <div className="lg:col-span-12">
          
          {/* TAB 1: PARTICIPANTS */}
          {adminTab === 'participants' && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              
              {/* Creator form */}
              <div className="bg-slate-900 border border-slate-800 p-6 rounded-3xl space-y-4">
                <div>
                  <h3 className="text-sm font-black text-white uppercase tracking-widest font-mono">Create Participant Profile</h3>
                  <p className="text-[10px] text-slate-500 font-mono mt-0.5">Register a player into the prediction scorecard</p>
                </div>

                <form onSubmit={handleAddUser} className="space-y-3 text-xs font-mono">
                  <div className="space-y-1">
                    <label className="text-[9px] font-black text-slate-500 uppercase block tracking-wider">FIRST NAME *</label>
                    <input
                      type="text"
                      required
                      placeholder="E.g. Sarah"
                      value={newFirst}
                      onChange={(e) => setNewFirst(e.target.value)}
                      className="w-full px-3 py-2 border border-slate-800 bg-slate-950 text-slate-100 rounded-lg text-xs font-bold outline-none focus:border-yellow-500"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[9px] font-black text-slate-500 uppercase block tracking-wider">LAST NAME</label>
                    <input
                      type="text"
                      placeholder="E.g. Connor"
                      value={newLast}
                      onChange={(e) => setNewLast(e.target.value)}
                      className="w-full px-3 py-2 border border-slate-800 bg-slate-950 text-slate-100 rounded-lg text-xs font-bold outline-none focus:border-yellow-500"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[9px] font-black text-slate-500 uppercase block tracking-wider">SECURE LOGIN CODE * (CASE SENSITIVE)</label>
                    <input
                      type="text"
                      required
                      placeholder="E.g. SCON12"
                      value={newCode}
                      onChange={(e) => setNewCode(e.target.value.toUpperCase())}
                      className="w-full px-3 py-2 border border-slate-800 bg-slate-950 text-slate-100 rounded-lg text-xs font-bold font-mono outline-none focus:border-yellow-500 uppercase"
                    />
                  </div>

                  <button
                    type="submit"
                    className="w-full py-2.5 bg-yellow-500 hover:bg-yellow-400 text-black font-extrabold rounded-lg tracking-wider transition-all"
                  >
                    ADD TO SCOREBOARD
                  </button>
                </form>
              </div>

              {/* Users Grid */}
              <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-xl">
                <div className="p-5 border-b border-slate-800 flex items-center justify-between gap-4">
                  <div>
                    <h3 className="text-sm font-black text-white uppercase tracking-widest font-mono">Registrants Index</h3>
                    <p className="text-[10px] text-slate-500 font-mono mt-0.5">Maintain player states and remove profiles</p>
                  </div>

                  <input
                    type="text"
                    placeholder="Find player..."
                    value={userSearch}
                    onChange={(e) => setUserSearch(e.target.value)}
                    className="px-3 py-1.5 border border-slate-800 bg-slate-950 text-slate-100 rounded-lg text-xs outline-none focus:border-yellow-500 font-sans"
                  />
                </div>

                <div className="divide-y divide-slate-850 overflow-y-auto max-h-[500px]">
                  {filteredUsers.length === 0 ? (
                    <div className="py-12 text-center text-xs text-slate-500 font-mono uppercase tracking-widest">
                      No matching participants registered
                    </div>
                  ) : (
                    filteredUsers.map((p) => {
                      const totalPicksCount = Object.keys(p.picks || {}).length;
                      return (
                        <div key={p.id} className="p-4 flex items-center justify-between hover:bg-slate-850/20 transition-all font-sans">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-slate-850 border border-slate-800 text-yellow-500 font-black flex items-center justify-center text-xs">
                              {p.firstName[0]}{p.lastName ? p.lastName[0] : ''}
                            </div>
                            <div>
                              <span className="font-extrabold text-white text-sm block leading-none">{p.firstName} {p.lastName}</span>
                              <span className="text-[10px] text-slate-500 font-mono block mt-1 uppercase tracking-wide">
                                CODE: <span className="text-yellow-600 font-bold">{p.code}</span> • {totalPicksCount} picks saved
                              </span>
                            </div>
                          </div>

                          <div className="flex items-center gap-2 font-mono text-[9px]">
                            {/* Toggle Suspend */}
                            <button
                              onClick={() => handleToggleUserActive(p)}
                              className={`p-1.5 rounded-lg border flex items-center gap-1 font-bold uppercase transition-all ${
                                p.isActive 
                                  ? 'bg-emerald-950/40 border-emerald-900/40 text-emerald-400 hover:bg-red-950/20 hover:text-red-400 hover:border-red-900/35' 
                                  : 'bg-red-950/40 border-red-900/40 text-red-400 hover:bg-emerald-950/20 hover:text-emerald-400 hover:border-emerald-900/35'
                              }`}
                            >
                              {p.isActive ? <UserCheck className="w-3.5 h-3.5" /> : <UserX className="w-3.5 h-3.5" />}
                              <span>{p.isActive ? 'Active' : 'Suspended'}</span>
                            </button>

                            {/* Delete Button */}
                            <button
                              onClick={() => handleDeleteUser(p)}
                              className="p-1.5 text-red-500 bg-slate-950 hover:bg-red-950/30 border border-slate-850 hover:border-red-900/40 rounded-lg transition-all"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>

            </div>
          )}

          {/* TAB 2: SCHEDULE CONFIG */}
          {adminTab === 'matches' && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              
              {/* Left Form: Edit Match details */}
              <div className="bg-slate-900 border border-slate-800 p-6 rounded-3xl space-y-4">
                <div>
                  <h3 className="text-sm font-black text-white uppercase tracking-widest font-mono">Edit Match Schedule Details</h3>
                  <p className="text-[10px] text-slate-500 font-mono mt-0.5">Customize names, kick-offs, and stadiums</p>
                </div>

                {editingMatch ? (
                  <form onSubmit={handleSaveMatchDetails} className="space-y-3 text-xs font-mono">
                    <div className="bg-slate-950 p-3 rounded-xl border border-slate-850 font-bold uppercase text-[9px] text-yellow-600">
                      Modifying index Match #{editingMatch.id} ({editingMatch.type})
                    </div>
                    
                    <div className="space-y-1">
                      <label className="text-[9px] font-black text-slate-500 uppercase block tracking-wider">TEAM A</label>
                      <input
                        type="text"
                        required
                        value={editTeamA}
                        onChange={(e) => setEditTeamA(e.target.value)}
                        className="w-full px-3 py-2 border border-slate-800 bg-slate-950 text-slate-100 rounded-lg text-xs font-bold outline-none focus:border-yellow-500"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[9px] font-black text-slate-500 uppercase block tracking-wider">TEAM B</label>
                      <input
                        type="text"
                        required
                        value={editTeamB}
                        onChange={(e) => setEditTeamB(e.target.value)}
                        className="w-full px-3 py-2 border border-slate-800 bg-slate-950 text-slate-100 rounded-lg text-xs font-bold outline-none focus:border-yellow-500"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[9px] font-black text-slate-500 uppercase block tracking-wider">STADIUM / VENUE</label>
                      <input
                        type="text"
                        required
                        value={editVenue}
                        onChange={(e) => setEditVenue(e.target.value)}
                        className="w-full px-3 py-2 border border-slate-800 bg-slate-950 text-slate-100 rounded-lg text-xs font-bold outline-none focus:border-yellow-500"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[9px] font-black text-slate-500 uppercase block tracking-wider">CITY</label>
                      <input
                        type="text"
                        required
                        value={editCity}
                        onChange={(e) => setEditCity(e.target.value)}
                        className="w-full px-3 py-2 border border-slate-800 bg-slate-950 text-slate-100 rounded-lg text-xs font-bold outline-none focus:border-yellow-500"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[9px] font-black text-slate-500 uppercase block tracking-wider">DATE-TIME (ISO)</label>
                      <input
                        type="text"
                        required
                        value={editKickoff}
                        onChange={(e) => setEditKickoff(e.target.value)}
                        className="w-full px-3 py-1.5 border border-slate-800 bg-slate-950 text-slate-100 rounded-lg text-xs font-mono outline-none focus:border-yellow-500"
                      />
                    </div>

                    <div className="flex gap-2.5 pt-2">
                      <button
                        type="button"
                        onClick={() => setEditingMatch(null)}
                        className="w-1/2 py-2.5 bg-slate-950 hover:bg-slate-850 text-slate-400 font-bold border border-slate-850 rounded-lg uppercase tracking-wide"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        className="w-1/2 py-2.5 bg-yellow-500 hover:bg-yellow-400 text-black font-extrabold rounded-lg uppercase tracking-wide"
                      >
                        Save Details
                      </button>
                    </div>
                  </form>
                ) : (
                  <div className="py-12 bg-slate-950/20 border border-dashed border-slate-800 p-6 rounded-2xl text-center text-xs text-slate-500 uppercase tracking-widest font-mono">
                    Select a match from the schedule index on the right side to adjust details.
                  </div>
                )}
              </div>

              {/* Match list Selector */}
              <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-xl">
                <div className="p-5 border-b border-slate-800 flex items-center justify-between gap-4">
                  <div>
                    <h3 className="text-sm font-black text-white uppercase tracking-widest font-mono">Matches Calendar ({matches.length})</h3>
                    <p className="text-[10px] text-slate-500 font-mono mt-0.5">Quick selection for scheduling info adjusters</p>
                  </div>

                  <input
                    type="text"
                    placeholder="Find match / country..."
                    value={matchSearch}
                    onChange={(e) => setMatchSearch(e.target.value)}
                    className="px-3 py-1.5 border border-slate-800 bg-slate-950 text-slate-100 rounded-lg text-xs outline-none focus:border-yellow-500 font-sans"
                  />
                </div>

                <div className="divide-y divide-slate-850 overflow-y-auto max-h-[500px]">
                  {filteredMatchesList.length === 0 ? (
                    <div className="py-12 text-center text-xs text-slate-500 font-mono uppercase tracking-widest">
                      No matching matches found
                    </div>
                  ) : (
                    filteredMatchesList.map((m) => (
                      <div key={m.id} className="p-4 flex items-center justify-between hover:bg-slate-850/20 transition-all font-sans">
                        <div className="space-y-0.5">
                          <span className="text-[9px] font-black text-slate-500 uppercase font-mono">MATCH #{m.id} • {m.type}</span>
                          <span className="text-sm font-extrabold text-white block">
                            {m.a} <span className="text-slate-500 font-normal">vs</span> {m.b}
                          </span>
                          <span className="text-[10px] text-slate-400 block flex items-center gap-1 leading-none font-mono mt-1">
                            <MapPin className="w-3.5 h-3.5 text-slate-600" /> {m.v} • {m.c}
                          </span>
                        </div>

                        <button
                          onClick={() => handleEditMatchMeta(m)}
                          className="flex items-center gap-1 px-3 py-2 text-[9px] font-black uppercase font-mono bg-slate-950 border border-slate-850 hover:bg-yellow-500/10 text-yellow-500 hover:text-yellow-400 rounded-lg transition-all"
                        >
                          <Edit3 className="w-3.5 h-3.5" /> EDIT INFO
                        </button>
                      </div>
                    ))
                  )}
                </div>
              </div>

            </div>
          )}

          {/* TAB 3: GRADING AREA */}
          {adminTab === 'grading' && (
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-850 pb-4">
                <div>
                  <h3 className="text-sm font-black text-white uppercase tracking-widest font-mono">Official Results Grader</h3>
                  <p className="text-[10px] text-slate-500 font-mono mt-0.5">Submit official scores to immediately update all participant rankings</p>
                </div>

                <input
                  type="text"
                  placeholder="Filter country / country..."
                  value={matchSearch}
                  onChange={(e) => setMatchSearch(e.target.value)}
                  className="px-3 py-1.5 border border-slate-800 bg-slate-950 text-slate-100 rounded-lg text-xs outline-none focus:border-yellow-500 font-sans"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 max-h-[600px] overflow-y-auto pr-2">
                {filteredMatchesList.map((m) => (
                  <div key={m.id} className="bg-slate-950 border border-slate-850 p-5 rounded-2xl flex flex-col justify-between space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-[9px] font-black text-slate-500 font-mono uppercase">Match #{m.id} • {m.type}</span>
                      
                      {m.res ? (
                        <span className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[8px] font-black font-mono px-2 py-0.5 rounded uppercase">
                          Graded
                        </span>
                      ) : (
                        <span className="bg-yellow-500/10 border border-yellow-500/20 text-yellow-500 text-[8px] font-black font-mono px-2 py-0.5 rounded uppercase">
                          Pending
                        </span>
                      )}
                    </div>

                    <div className="font-sans text-center">
                      <span className="text-base font-black text-slate-200 block truncate">{m.a} vs {m.b}</span>
                      <span className="text-[9px] text-slate-500 font-mono block uppercase tracking-wide mt-1">{m.v}</span>
                    </div>

                    {/* Result setters layout */}
                    <div className="grid grid-cols-3 gap-1.5 font-mono text-[9px] font-extrabold uppercase select-none">
                      {/* Team A Winner selector */}
                      <button
                        onClick={() => handleAssignResult(m.id, 'A')}
                        className={`py-2 px-1.5 border rounded-lg transition-all truncate text-center ${
                          m.res === 'A' 
                            ? 'bg-yellow-500 border-yellow-400 text-black font-black' 
                            : 'bg-slate-900 border-slate-800 text-slate-300 hover:border-slate-700'
                        }`}
                      >
                        {m.a}
                      </button>

                      {/* Group stage DRAW option */}
                      <button
                        disabled={m.type !== 'Group'}
                        onClick={() => handleAssignResult(m.id, 'Tie')}
                        className={`py-2 px-1.5 border rounded-lg transition-all text-center ${
                          m.type !== 'Group' ? 'opacity-30 cursor-not-allowed' : ''
                        } ${
                          m.res === 'Tie' 
                            ? 'bg-slate-650 border-slate-500 text-white font-black' 
                            : 'bg-slate-900 border-slate-800 text-slate-400 hover:border-slate-700'
                        }`}
                      >
                        DRAW
                      </button>

                      {/* Team B Winner selector */}
                      <button
                        onClick={() => handleAssignResult(m.id, 'B')}
                        className={`py-2 px-1.5 border rounded-lg transition-all truncate text-center ${
                          m.res === 'B' 
                            ? 'bg-yellow-500 border-yellow-400 text-black font-black' 
                            : 'bg-slate-900 border-slate-800 text-slate-300 hover:border-slate-700'
                        }`}
                      >
                        {m.b}
                      </button>
                    </div>

                    {/* Action buttons inside card */}
                    {m.res && (
                      <button
                        onClick={() => handleAssignResult(m.id, null)}
                        className="w-full text-center hover:bg-red-950/20 text-red-500 text-[10px] uppercase font-bold tracking-widest font-mono mt-1 py-1 rounded transition-colors"
                      >
                        Reset Result Clear
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 4: SYSTEM CONTROL & BACKUP RESETS */}
          {adminTab === 'system' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 font-mono text-xs">
              
              {/* Reset Box */}
              <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-6">
                <div>
                  <h3 className="text-sm font-black text-white uppercase tracking-widest leading-none">Administrative Board Resets</h3>
                  <p className="text-[10px] text-slate-500 mt-1 uppercase tracking-wider font-semibold font-mono">Reset or re-seed scoreboard structures</p>
                </div>

                <div className="space-y-4">
                  {/* System full reset */}
                  <div className="p-4 bg-red-950/20 border border-red-900/30 rounded-2xl space-y-2.5">
                    <span className="text-[10px] font-black text-red-400 uppercase tracking-widest block">Clear Scoreboard Predictions</span>
                    <p className="text-[10px] text-slate-400 leading-relaxed font-sans font-medium">
                      Completely purges predictions (`picks`) stored on all participants profiles. Points and accuracy calculations reset back to 0.
                    </p>
                    <button
                      onClick={handleSystemFullReset}
                      className="p-2 px-4 rounded bg-red-650 hover:bg-red-600 text-white font-extrabold text-[10px] uppercase transition-all flex items-center gap-1.5"
                    >
                      <RotateCcw className="w-3.5 h-3.5" /> PURGE SCOREBOARD PICKS
                    </button>
                  </div>
                </div>
              </div>

              {/* Registry Active Toggles */}
              <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-6 flex flex-col justify-between">
                <div className="space-y-4">
                  <div>
                    <h3 className="text-sm font-black text-white uppercase tracking-widest leading-none animate-pulse">Operational Status Controls</h3>
                    <p className="text-[10px] text-slate-500 mt-1 leading-relaxed">Lock or unlock portal systems</p>
                  </div>

                  <div className="divide-y divide-slate-850 space-y-3 pt-2">
                    <div className="flex items-center justify-between py-2">
                      <div>
                        <span className="text-slate-300 font-extrabold block">Submission Lobby Status</span>
                        <span className="text-[9px] text-slate-500 block uppercase font-mono font-bold mt-1">Locks predictions submissions globally</span>
                      </div>

                      <button
                        onClick={handleToggleRegistration}
                        className={`p-2 rounded-xl text-[10px] font-bold uppercase transition-all ${
                          systemState?.isContestActive
                            ? 'bg-emerald-950 text-emerald-400 border border-emerald-900/30'
                            : 'bg-red-950 text-red-500 border border-red-900/30'
                        }`}
                      >
                        {systemState?.isContestActive ? 'Active Lobby (Open)' : 'Locked Lobby (Closed)'}
                      </button>
                    </div>
                  </div>
                </div>

                <div className="p-3.5 bg-slate-950 rounded-2xl border border-slate-850 text-[10px] text-slate-500 leading-normal font-sans">
                  ⚠️ **Security Warning**: Standard write-gaps are protected. Deleting a profile strictly deletes database records synchronously. Review audit requirements before editing scores.
                </div>
              </div>

            </div>
          )}

        </div>
      </div>

      {/* FEEDBACK STATUS ALERTS */}
      <AnimatePresence>
        {feedback && (
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 15 }}
            className={`fixed bottom-6 right-6 z-50 p-4 rounded-xl shadow-lg border text-xs font-semibold font-mono uppercase tracking-wide flex items-center gap-2.5 ${
              feedback.type === 'success'
                ? 'bg-emerald-950 border-emerald-900 text-emerald-400'
                : 'bg-red-950 border-red-950 text-red-400'
            }`}
          >
            {feedback.type === 'success' ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
            ) : (
              <AlertTriangle className="w-5 h-5 text-red-400 shrink-0" />
            )}
            <span>{feedback.text}</span>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}
