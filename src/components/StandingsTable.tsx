/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Participant, Match } from '../types';
import { motion, AnimatePresence } from 'motion/react';
import { Search, Trophy, Medal, Award, ChevronRight, CheckCircle2, XCircle, Percent } from 'lucide-react';

interface StandingsTableProps {
  participants: Participant[];
  matches: Match[];
  onSelectParticipant?: (p: any) => void;
}

export default function StandingsTable({ participants, matches, onSelectParticipant }: StandingsTableProps) {
  const [searchTerm, setSearchTerm] = useState('');

  // Precompute calculated stats for each participant
  const listWithStats = participants.map(p => {
    let score = 0;
    let correct = 0;
    let incorrect = 0;
    let totalPicks = Object.keys(p.picks || {}).length;
    let activeGrades = 0;

    matches.forEach(m => {
      if (m && m.res) {
        const pick = p.picks?.[m.id];
        if (pick) {
          activeGrades++;
          if (pick === m.res) {
            score++;
            correct++;
          } else {
            incorrect++;
          }
        }
      }
    });

    const accuracy = activeGrades > 0 ? Math.round((correct / activeGrades) * 100) : 0;

    return {
      ...p,
      fullName: `${p.firstName} ${p.lastName}`,
      score,
      correct,
      incorrect,
      totalPicks,
      accuracy,
      playedGrades: activeGrades
    };
  });

  // Sort by score/points desc, then correct desc, then accuracy desc, then alphabetical
  const sortedParticipants = [...listWithStats].sort((a, b) => {
    if (b.score !== a.score) {
      return b.score - a.score;
    }
    if (b.correct !== a.correct) {
      return b.correct - a.correct;
    }
    if (b.accuracy !== a.accuracy) {
      return b.accuracy - a.accuracy;
    }
    return a.fullName.localeCompare(b.fullName);
  });

  const filteredParticipants = sortedParticipants.filter((p) =>
    p.fullName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getRankIcon = (index: number) => {
    switch (index) {
      case 0:
        return <Trophy className="w-5 h-5 text-amber-500 fill-amber-500/10" />;
      case 1:
        return <Medal className="w-5 h-5 text-slate-400 fill-slate-400/10" />;
      case 2:
        return <Award className="w-5 h-5 text-amber-700 fill-amber-700/10" />;
      default:
        return <span className="font-mono text-xs font-bold text-slate-500">{index + 1}</span>;
    }
  };

  return (
    <div className="bg-slate-900 rounded-3xl border border-slate-800 shadow-xl overflow-hidden">
      {/* Search Header */}
      <div className="p-6 border-b border-slate-800 bg-slate-900 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-lg font-black tracking-tight text-white flex items-center gap-2">
            <span className="text-xl">🏆</span> LEADERBOARD STANDINGS
          </h2>
          <p className="text-xs text-slate-400 mt-0.5 uppercase tracking-wider font-semibold font-mono">Real-time stats based on correct predictions</p>
        </div>
        
        <div className="relative">
          <Search className="w-4 h-4 text-slate-500 absolute left-3 w-4 h-4 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Find participant..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full sm:w-64 pl-9 pr-4 py-2 border border-slate-800 bg-slate-950 text-slate-100 rounded-xl outline-none focus:border-yellow-500 text-xs transition-all font-sans"
          />
        </div>
      </div>

      {/* Leaderboard Table */}
      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-left">
          <thead>
            <tr className="border-b border-slate-800 text-[10px] font-bold text-slate-400 uppercase tracking-widest bg-slate-950/40">
              <th className="py-4 px-6 w-16 text-center">Rank</th>
              <th className="py-4 px-6">Participant</th>
              <th className="py-4 px-4 text-center">Picks Made</th>
              <th className="py-4 px-4 text-center">Graded</th>
              <th className="py-4 px-4 text-center">Correct ⭐</th>
              <th className="py-4 px-4 text-center">Accuracy</th>
              <th className="py-4 px-6 text-right">Points</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-850">
            {filteredParticipants.length === 0 ? (
              <tr>
                <td colSpan={7} className="py-12 text-center text-xs text-slate-500 uppercase tracking-widest">
                  {searchTerm ? 'No participants match search criteria' : 'No solar prediction participants registered'}
                </td>
              </tr>
            ) : (
              <AnimatePresence initial={false}>
                {filteredParticipants.map((participant, index) => {
                  const originalIndex = sortedParticipants.findIndex(p => p.id === participant.id);
                  return (
                    <motion.tr
                      key={participant.id}
                      initial={{ opacity: 0, y: 4 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0 }}
                      onClick={() => onSelectParticipant && onSelectParticipant(participant)}
                      className={`hover:bg-slate-800/40 transition-colors cursor-pointer ${
                        originalIndex === 0 ? 'bg-yellow-500/5' : ''
                      }`}
                    >
                      {/* Rank Column */}
                      <td className="py-4 px-6 text-center">
                        <div className="flex items-center justify-center">
                          {getRankIcon(originalIndex)}
                        </div>
                      </td>

                      {/* Display Name and Login Code Tag */}
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center text-yellow-500 text-sm font-extrabold uppercase shadow-sm">
                            {participant.firstName.charAt(0)}{participant.lastName.charAt(0)}
                          </div>
                          <div>
                            <span className="font-extrabold text-slate-100 block font-sans">
                              {participant.fullName}
                            </span>
                            <span className="text-[10px] text-slate-500 font-mono block mt-0.5 uppercase tracking-wider">
                              Code: <span className="text-yellow-600 font-bold">{participant.code}</span>
                            </span>
                          </div>
                          {!participant.isActive && (
                            <span className="text-[9px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-md bg-red-950/60 border border-red-900/40 text-red-400 ml-2">
                              Suspended
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Total Picks Made Count */}
                      <td className="py-4 px-4 text-center">
                        <span className="text-xs font-bold font-mono text-slate-300">
                          {participant.totalPicks}
                        </span>
                      </td>

                      {/* Played/Graded Decisions */}
                      <td className="py-4 px-4 text-center">
                        <span className="text-xs font-bold font-mono text-slate-400">
                          {participant.playedGrades}
                        </span>
                      </td>

                      {/* Graded Correct (Wins) */}
                      <td className="py-4 px-4 text-center">
                        <span className="text-xs font-extrabold font-mono text-yellow-400 bg-yellow-500/10 px-2.5 py-1 rounded-lg border border-yellow-500/10">
                          {participant.correct}
                        </span>
                      </td>

                      {/* Accuracy % */}
                      <td className="py-4 px-4 text-center">
                        <span className="text-xs font-bold font-mono text-slate-300">
                          {participant.accuracy}%
                        </span>
                      </td>

                      {/* Total accumulated Points */}
                      <td className="py-4 px-6 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <span className="text-sm font-black font-mono text-yellow-500">
                            {participant.score} PTS
                          </span>
                          <ChevronRight className="w-4 h-4 text-slate-600" />
                        </div>
                      </td>
                    </motion.tr>
                  );
                })}
              </AnimatePresence>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
