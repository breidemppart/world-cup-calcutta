'use client';

import { Team } from '@/lib/types';
import TeamCard from './TeamCard';
import { GROUP_COLORS, GROUP_ACCENT } from '@/lib/constants';

interface Props {
  teams: Team[];
  onBid: (team: Team) => void;
  searchQuery: string;
}

export default function GroupGrid({ teams, onBid, searchQuery }: Props) {
  // Group teams by group letter
  const groups: Record<string, Team[]> = {};
  for (const team of teams) {
    if (!groups[team.group_name]) groups[team.group_name] = [];
    groups[team.group_name].push(team);
  }

  // Filter by search query
  const query = searchQuery.toLowerCase().trim();
  const visibleGroups = Object.entries(groups)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([g, gTeams]) => ({
      group: g,
      teams: query
        ? gTeams.filter(t =>
            t.name.toLowerCase().includes(query) ||
            (t.current_owner?.toLowerCase().includes(query))
          )
        : gTeams,
    }))
    .filter(({ teams }) => teams.length > 0);

  if (visibleGroups.length === 0) {
    return (
      <div className="text-center py-12 text-gray-600">
        No teams match &quot;{searchQuery}&quot;
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {visibleGroups.map(({ group, teams: gTeams }) => {
        const colorCls = GROUP_COLORS[group] ?? 'from-gray-900/40 to-gray-950/10 border-gray-800/30';
        const accentCls = GROUP_ACCENT[group] ?? 'text-gray-400';

        return (
          <div key={group} className={`bg-gradient-to-br ${colorCls} border rounded-xl p-4`}>
            <h2 className={`text-xs font-black uppercase tracking-widest mb-3 ${accentCls}`}>
              Group {group}
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {gTeams.map(team => (
                <TeamCard key={team.id} team={team} onBid={onBid} />
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}
