'use client';

import { Bid } from '@/lib/types';

interface Props {
  bids: Bid[];
  filterTeamId?: number;
  maxRows?: number;
}

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1)  return 'just now';
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

export default function BidHistory({ bids, filterTeamId, maxRows }: Props) {
  const filtered = filterTeamId
    ? bids.filter(b => b.team_id === filterTeamId)
    : bids;

  const displayed = maxRows ? filtered.slice(0, maxRows) : filtered;

  if (displayed.length === 0) {
    return (
      <div className="text-center py-12 text-gray-600">
        <div className="text-3xl mb-2">📋</div>
        <div>No bids yet — be the first!</div>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="text-left text-gray-500 text-xs uppercase tracking-wider border-b border-gray-800">
            <th className="pb-2 pr-4 font-medium">#</th>
            {!filterTeamId && <th className="pb-2 pr-4 font-medium">Team</th>}
            <th className="pb-2 pr-4 font-medium">Bidder</th>
            <th className="pb-2 pr-4 font-medium text-right">Amount</th>
            <th className="pb-2 font-medium text-right">Time</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-800/50">
          {displayed.map((bid, i) => (
            <tr key={bid.id} className="group hover:bg-gray-800/30 transition-colors">
              <td className="py-2.5 pr-4 text-gray-600 tabular-nums">{filtered.length - i}</td>
              {!filterTeamId && (
                <td className="py-2.5 pr-4 text-gray-300 font-medium truncate max-w-[120px]">
                  {bid.team_name}
                </td>
              )}
              <td className="py-2.5 pr-4 text-white font-semibold">{bid.bidder_name}</td>
              <td className="py-2.5 pr-4 text-yellow-400 font-bold tabular-nums text-right">
                ${bid.amount.toFixed(2)}
              </td>
              <td className="py-2.5 text-gray-500 text-right whitespace-nowrap">
                {timeAgo(bid.created_at)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {maxRows && filtered.length > maxRows && (
        <div className="text-center text-gray-600 text-xs py-3">
          + {filtered.length - maxRows} more bids
        </div>
      )}
    </div>
  );
}
