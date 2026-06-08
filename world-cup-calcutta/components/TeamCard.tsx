'use client';

import { Team, ROUND_LABELS } from '@/lib/types';
import { BID_CLOSE_TIME } from '@/lib/constants';

interface Props {
  team: Team;
  onBid: (team: Team) => void;
}

const STATUS_BADGE: Partial<Record<string, { label: string; cls: string }>> = {
  champion:        { label: '🏆 Champion',     cls: 'bg-yellow-500/20 text-yellow-400 border-yellow-600/30' },
  runner_up:       { label: '🥈 Runner-Up',    cls: 'bg-gray-500/20 text-gray-300 border-gray-500/30' },
  sf_eliminated:   { label: '🎯 Semifinalist', cls: 'bg-purple-500/20 text-purple-400 border-purple-600/30' },
  qf_eliminated:   { label: '⚡ Quarterfinalist', cls: 'bg-blue-500/20 text-blue-400 border-blue-600/30' },
  r16_eliminated:  { label: 'Out – R16',       cls: 'bg-gray-800/60 text-gray-500 border-gray-700/30' },
  r32_eliminated:  { label: 'Out – R32',       cls: 'bg-gray-800/60 text-gray-500 border-gray-700/30' },
  group_eliminated:{ label: 'Out – Groups',    cls: 'bg-gray-800/60 text-gray-500 border-gray-700/30' },
};

export default function TeamCard({ team, onBid }: Props) {
  const isOpen = Date.now() < BID_CLOSE_TIME.getTime();
  const isEliminated = team.round_status !== 'active';
  const badge = STATUS_BADGE[team.round_status];
  const hasBid = team.current_bid > 0;

  return (
    <div className={`relative flex flex-col bg-gray-900 border rounded-xl overflow-hidden transition-all duration-200 ${
      isEliminated
        ? 'border-gray-800/50 opacity-60'
        : 'border-gray-700/50 hover:border-gray-600 hover:bg-gray-800/80'
    }`}>
      {/* Status ribbon */}
      {badge && (
        <div className={`absolute top-0 right-0 text-[9px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-bl-lg border-l border-b ${badge.cls}`}>
          {badge.label}
        </div>
      )}

      <div className="p-3 flex-1">
        {/* Flag + name */}
        <div className="flex items-center gap-2 mb-2">
          <span className="text-2xl leading-none">{team.flag_emoji}</span>
          <span className="text-white font-semibold text-sm leading-tight">{team.name}</span>
        </div>

        {/* Bid info */}
        <div className="space-y-0.5">
          {hasBid ? (
            <>
              <div className="text-yellow-400 font-black text-lg tabular-nums">
                ${team.current_bid.toFixed(2)}
              </div>
              <div className="text-gray-400 text-xs truncate">
                by <span className="text-gray-200">{team.current_owner}</span>
              </div>
            </>
          ) : (
            <div className="text-gray-600 text-sm italic">No bid yet — starts at $5</div>
          )}
        </div>
      </div>

      {/* Bid button */}
      {isOpen && !isEliminated && (
        <button
          onClick={() => onBid(team)}
          className={`w-full py-2 text-sm font-bold uppercase tracking-wide transition-colors ${
            hasBid
              ? 'bg-red-700 hover:bg-red-600 text-white'
              : 'bg-green-700 hover:bg-green-600 text-white'
          }`}
        >
          {hasBid ? `Outbid ($${(team.current_bid + 1).toFixed(0)}+)` : 'Place First Bid'}
        </button>
      )}
      {!isOpen && !isEliminated && (
        <div className="w-full py-2 text-xs text-center text-gray-600 bg-gray-900/50 font-medium">
          Bidding closed
        </div>
      )}
    </div>
  );
}
