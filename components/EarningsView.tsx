'use client';
import { Team, PAYOUT_RATES, PAYOUT_BONUSES } from '@/lib/types';

interface Props { teams: Team[]; }

export default function EarningsView({ teams }: Props) {
  const totalPool = teams.reduce((s, t) => s + (t.current_bid || 0), 0);

  const map = new Map<string, {
    spent: number; earned: number;
    teams: { name: string; flag: string; bid: number; payout: number }[];
  }>();

  for (const team of teams) {
    if (!team.current_owner) continue;
    if (!map.has(team.current_owner)) map.set(team.current_owner, { spent: 0, earned: 0, teams: [] });
    const entry = map.get(team.current_owner)!;
    const payout = (PAYOUT_RATES[team.round_status] ?? 0) * totalPool + (PAYOUT_BONUSES[team.round_status] ?? 0);
    entry.spent  += team.current_bid || 0;
    entry.earned += payout;
    entry.teams.push({ name: team.name, flag: team.flag_emoji, bid: team.current_bid || 0, payout });
  }

  const list = Array.from(map.entries())
    .map(([name, d]) => ({ name, ...d, net: d.earned - d.spent }))
    .sort((a, b) => b.net - a.net);

  if (!list.length) return <div className="text-gray-600 text-center py-16 text-sm">No bids placed yet.</div>;

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-3 gap-3 mb-2">
        {[
          { label: 'Prize Pool',       val: `$${totalPool.toFixed(2)}`,                                    color: 'text-white' },
          { label: 'Paid Out So Far',  val: `$${list.reduce((s,p)=>s+p.earned,0).toFixed(2)}`,             color: 'text-green-400' },
          { label: 'Players',          val: String(list.length),                                            color: 'text-white' },
        ].map(s => (
          <div key={s.label} className="bg-gray-900 border border-gray-800 rounded-xl p-4 text-center">
            <div className="text-gray-500 text-xs uppercase tracking-wider">{s.label}</div>
            <div className={`${s.color} font-black text-xl mt-1`}>{s.val}</div>
          </div>
        ))}
      </div>

      {list.map((person, i) => (
        <div key={person.name} className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-gray-800">
            <div className="flex items-center gap-3">
              <span className="text-gray-600 font-bold text-sm w-5">#{i + 1}</span>
              <span className="font-black text-lg">{person.name}</span>
            </div>
            <div className="flex items-center gap-4 sm:gap-6 text-right">
              <div>
                <div className="text-gray-500 text-xs">Spent</div>
                <div className="text-red-400 font-bold">-${person.spent.toFixed(2)}</div>
              </div>
              <div>
                <div className="text-gray-500 text-xs">Earned</div>
                <div className="text-green-400 font-bold">+${person.earned.toFixed(2)}</div>
              </div>
              <div>
                <div className="text-gray-500 text-xs">Net</div>
                <div className={`font-black text-lg ${person.net >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                  {person.net >= 0 ? '+' : ''}${person.net.toFixed(2)}
                </div>
              </div>
            </div>
          </div>
          <div className="divide-y divide-gray-800/50">
            {person.teams.map(t => (
              <div key={t.name} className="flex items-center justify-between px-5 py-2 text-sm">
                <div className="flex items-center gap-2 text-gray-300">
                  <span>{t.flag}</span>
                  <span>{t.name}</span>
                </div>
                <div className="flex items-center gap-4 text-xs">
                  <span className="text-gray-500">bid ${t.bid.toFixed(2)}</span>
                  <span className={t.payout > 0 ? 'text-green-400 font-semibold' : 'text-gray-600'}>
                    {t.payout > 0 ? `earns $${t.payout.toFixed(2)}` : 'eliminated'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
