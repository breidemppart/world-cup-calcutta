// Bidding closes Thursday June 11 2026 at 12:00 PM ET (UTC-4 = 16:00 UTC)
export const BID_CLOSE_TIME = new Date('2026-06-11T16:00:00.000Z');

export const MIN_OPENING_BID = 5;
export const MIN_BID_INCREMENT = 1;

export const ALL_TEAMS = [
  // Group A
  { name: 'Mexico',            group_name: 'A', flag_emoji: '🇲🇽' },
  { name: 'South Africa',      group_name: 'A', flag_emoji: '🇿🇦' },
  { name: 'South Korea',       group_name: 'A', flag_emoji: '🇰🇷' },
  { name: 'Czechia',           group_name: 'A', flag_emoji: '🇨🇿' },
  // Group B
  { name: 'Canada',            group_name: 'B', flag_emoji: '🇨🇦' },
  { name: 'Bosnia & Herzegovina', group_name: 'B', flag_emoji: '🇧🇦' },
  { name: 'Qatar',             group_name: 'B', flag_emoji: '🇶🇦' },
  { name: 'Switzerland',       group_name: 'B', flag_emoji: '🇨🇭' },
  // Group C
  { name: 'Brazil',            group_name: 'C', flag_emoji: '🇧🇷' },
  { name: 'Morocco',           group_name: 'C', flag_emoji: '🇲🇦' },
  { name: 'Haiti',             group_name: 'C', flag_emoji: '🇭🇹' },
  { name: 'Scotland',          group_name: 'C', flag_emoji: '🏴󠁧󠁢󠁳󠁣󠁴󠁿' },
  // Group D
  { name: 'United States',     group_name: 'D', flag_emoji: '🇺🇸' },
  { name: 'Paraguay',          group_name: 'D', flag_emoji: '🇵🇾' },
  { name: 'Australia',         group_name: 'D', flag_emoji: '🇦🇺' },
  { name: 'Türkiye',           group_name: 'D', flag_emoji: '🇹🇷' },
  // Group E
  { name: 'Germany',           group_name: 'E', flag_emoji: '🇩🇪' },
  { name: 'Curaçao',           group_name: 'E', flag_emoji: '🇨🇼' },
  { name: 'Ivory Coast',       group_name: 'E', flag_emoji: '🇨🇮' },
  { name: 'Ecuador',           group_name: 'E', flag_emoji: '🇪🇨' },
  // Group F
  { name: 'Netherlands',       group_name: 'F', flag_emoji: '🇳🇱' },
  { name: 'Japan',             group_name: 'F', flag_emoji: '🇯🇵' },
  { name: 'Sweden',            group_name: 'F', flag_emoji: '🇸🇪' },
  { name: 'Tunisia',           group_name: 'F', flag_emoji: '🇹🇳' },
  // Group G
  { name: 'Belgium',           group_name: 'G', flag_emoji: '🇧🇪' },
  { name: 'Egypt',             group_name: 'G', flag_emoji: '🇪🇬' },
  { name: 'Iran',              group_name: 'G', flag_emoji: '🇮🇷' },
  { name: 'New Zealand',       group_name: 'G', flag_emoji: '🇳🇿' },
  // Group H
  { name: 'Spain',             group_name: 'H', flag_emoji: '🇪🇸' },
  { name: 'Cape Verde',        group_name: 'H', flag_emoji: '🇨🇻' },
  { name: 'Saudi Arabia',      group_name: 'H', flag_emoji: '🇸🇦' },
  { name: 'Uruguay',           group_name: 'H', flag_emoji: '🇺🇾' },
  // Group I
  { name: 'France',            group_name: 'I', flag_emoji: '🇫🇷' },
  { name: 'Senegal',           group_name: 'I', flag_emoji: '🇸🇳' },
  { name: 'Iraq',              group_name: 'I', flag_emoji: '🇮🇶' },
  { name: 'Norway',            group_name: 'I', flag_emoji: '🇳🇴' },
  // Group J
  { name: 'Argentina',         group_name: 'J', flag_emoji: '🇦🇷' },
  { name: 'Algeria',           group_name: 'J', flag_emoji: '🇩🇿' },
  { name: 'Austria',           group_name: 'J', flag_emoji: '🇦🇹' },
  { name: 'Jordan',            group_name: 'J', flag_emoji: '🇯🇴' },
  // Group K
  { name: 'Portugal',          group_name: 'K', flag_emoji: '🇵🇹' },
  { name: 'Congo DR',          group_name: 'K', flag_emoji: '🇨🇩' },
  { name: 'Uzbekistan',        group_name: 'K', flag_emoji: '🇺🇿' },
  { name: 'Colombia',          group_name: 'K', flag_emoji: '🇨🇴' },
  // Group L
  { name: 'England',           group_name: 'L', flag_emoji: '🏴󠁧󠁢󠁥󠁮󠁧󠁿' },
  { name: 'Croatia',           group_name: 'L', flag_emoji: '🇭🇷' },
  { name: 'Ghana',             group_name: 'L', flag_emoji: '🇬🇭' },
  { name: 'Panama',            group_name: 'L', flag_emoji: '🇵🇦' },
] as const;

export const GROUP_COLORS: Record<string, string> = {
  A: 'from-red-900/40 to-red-950/10 border-red-800/30',
  B: 'from-orange-900/40 to-orange-950/10 border-orange-800/30',
  C: 'from-yellow-900/40 to-yellow-950/10 border-yellow-800/30',
  D: 'from-green-900/40 to-green-950/10 border-green-800/30',
  E: 'from-teal-900/40 to-teal-950/10 border-teal-800/30',
  F: 'from-cyan-900/40 to-cyan-950/10 border-cyan-800/30',
  G: 'from-blue-900/40 to-blue-950/10 border-blue-800/30',
  H: 'from-indigo-900/40 to-indigo-950/10 border-indigo-800/30',
  I: 'from-violet-900/40 to-violet-950/10 border-violet-800/30',
  J: 'from-purple-900/40 to-purple-950/10 border-purple-800/30',
  K: 'from-fuchsia-900/40 to-fuchsia-950/10 border-fuchsia-800/30',
  L: 'from-pink-900/40 to-pink-950/10 border-pink-800/30',
};

export const GROUP_ACCENT: Record<string, string> = {
  A: 'text-red-400',
  B: 'text-orange-400',
  C: 'text-yellow-400',
  D: 'text-green-400',
  E: 'text-teal-400',
  F: 'text-cyan-400',
  G: 'text-blue-400',
  H: 'text-indigo-400',
  I: 'text-violet-400',
  J: 'text-purple-400',
  K: 'text-fuchsia-400',
  L: 'text-pink-400',
};
