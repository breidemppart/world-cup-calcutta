'use client';

import { Team, PAYOUT_RATES } from '@/lib/types';

interface Props {
  teams: Team[];
}

interface Entry {
  name: string;
  teams: Team[];
  totalOwed: number;
  projectedPayout: number;
}

export default function Leaderboard({ teams }: Props) {
  const totalPool = teams.reduce((sum, t) => sum + (t.current_bid || 0), 0);

  // Group teams by owner
  const ownerMap = new Map<string, Team[]>();
  for (const t of teams) {
    if (!t.current_owner || t.current_bid <= 0) continue;
    if (!ownerMap.has(t.current_owner)) ownerMap.set(t.current_owner, []);
    ownerMap.get(t.current_owner)!.push(t);
  }

  const entries: Entry[] = Array.from(ownerMap.entries()).map(([name, ownedTeams]) => {
    const totalOwed = ownedTeams.reduce((s, t) => s + t.current_bid, 0);
    const projectedPayout = ownedTeams.reduce((s, t) => {
      const rate = PAYOUT_RATES[t.round_status] ?? 0;
      return s + rate * totalPool;
    }, 0);
    return { name, teams: ownedTeams, totalOwed, projectedPayout };
  });

  entries.sort((a, b) => b.projectedPayout - a.projectedPayout || b.totalOwed - a.totalOwed);

  if (entries.length === 0) {
    return (
      <div className="text-center py-12 text-gray-600">
        <div className="text-3xl mb-2">🏟️</div>
        <div>No bids placed yet — leaderboard will populate as people bid.</div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {entries.map((entry, i) => {
        const net = entry.projectedPayout - entry.totalOwed;
        const hasEarnings = entry.projectedPayout > 0;
        return (
          <div key={entry.name} className="bg-gray-900 border border-gray-800 rounded-xl p-4">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-3 min-w-0">
                <div className={`text-lg font-black w-7 text-center flex-shrink-0 ${
                  i === 0 ? 'text-yellow-400' : i === 1 ? 'text-gray-400' : i === 2 ? 'text-amber-600' : 'text-gray-600'
                }`}>
                  {i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `#${i + 1}`}
                </div>
                <div className="min-w-0">
                  <div className="text-white font-bold text-base">{entry.name}</div>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {entry.teams.map(t => (
                      <span key={t.id} className="text-xs bg-gray-800 border border-gray-700 rounded px-1.5 py-0.5 text-gray-300">
                        {t.flag_emoji} {t.name}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              <div className="flex-shrink-0 text-right space-y-0.5">
                <div className="text-gray-500 text-xs">Owes</div>
                <div className="text-white font-bold tabular-nums">${entry.totalOwed.toFixed(2)}</div>
                {hasEarnings && (
                  <>
                    <div className="text-gray-500 text-xs mt-1">Projected</div>
                    <div className="text-green-400 font-bold tabular-nums">${entry.projectedPayout.toFixed(2)}</div>
                    <div className={`text-xs font-semibold tabular-nums ${net >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                      {net >= 0 ? '+' : ''}{net.toFixed(2)} net
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        );
      })}

      <div className="text-gray-600 text-xs text-center pt-2">
        * Projected payouts update as teams advance. Final payouts: Champion 40% · Runner-Up 20% · Semis 10% each · QF 5% each
      </div>
    </div>
  );
}
