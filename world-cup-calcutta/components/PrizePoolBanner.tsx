'use client';

import { Team } from '@/lib/types';

interface Props {
  teams: Team[];
}

export default function PrizePoolBanner({ teams }: Props) {
  const totalPool = teams.reduce((sum, t) => sum + (t.current_bid || 0), 0);
  const biddedTeams = teams.filter(t => t.current_bid > 0).length;

  const payoutTiers = [
    { label: '🏆 Champion',      pct: 40, est: totalPool * 0.40 + 100, note: '+$100 bonus' },
    { label: '🥈 Runner-Up',     pct: 20, est: totalPool * 0.20 + 50,  note: '+$50 bonus' },
    { label: '🎯 Semifinals',    pct: 10, est: totalPool * 0.10, note: 'each (×2)' },
    { label: '⚡ Quarterfinals', pct:  5, est: totalPool * 0.05, note: 'each (×4)' },
  ];

  return (
    <div className="bg-gradient-to-r from-yellow-950/40 via-yellow-900/20 to-yellow-950/40 border border-yellow-800/30 rounded-xl p-4 sm:p-5">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        {/* Total pool */}
        <div>
          <div className="text-yellow-500/70 text-xs uppercase tracking-widest font-semibold mb-1">
            Total Prize Pool
          </div>
          <div className="text-4xl font-black text-yellow-400 tabular-nums">
            ${totalPool.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
          <div className="text-gray-500 text-sm mt-1">
            {biddedTeams} of 48 teams have bids
          </div>
        </div>

        {/* Payout breakdown */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {payoutTiers.map(tier => (
            <div key={tier.label} className="bg-black/30 rounded-lg p-2 text-center min-w-[90px]">
              <div className="text-[10px] text-gray-400 leading-tight">{tier.label}</div>
              <div className="text-yellow-300 font-bold text-sm mt-0.5">{tier.pct}%</div>
              <div className="text-gray-300 text-xs tabular-nums">
                ${tier.est.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
              </div>
              {tier.note && <div className="text-gray-500 text-[9px]">{tier.note}</div>}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
