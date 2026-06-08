export type RoundStatus =
  | 'active'
  | 'group_eliminated'
  | 'r32_eliminated'
  | 'r16_eliminated'
  | 'qf_eliminated'   // 5% payout
  | 'sf_eliminated'   // 10% payout
  | 'runner_up'       // 20% payout
  | 'champion';       // 40% payout

export interface Team {
  id: number;
  name: string;
  group_name: string;
  flag_emoji: string;
  current_bid: number;
  current_owner: string | null;
  round_status: RoundStatus;
  created_at: string;
}

export interface Bid {
  id: number;
  team_id: number;
  team_name: string;
  bidder_name: string;
  amount: number;
  created_at: string;
}

export interface PlaceBidRequest {
  teamId: number;
  bidderName: string;
  amount: number;
}

export interface PlaceBidResponse {
  success: boolean;
  error?: string;
}

export interface LeaderboardEntry {
  name: string;
  teams: Team[];
  totalOwed: number;
  projectedPayout: number;
  net: number;
}

export const PAYOUT_RATES: Partial<Record<RoundStatus, number>> = {
  champion: 0.40,
  runner_up: 0.20,
  sf_eliminated: 0.10,
  qf_eliminated: 0.05,
};

export const ROUND_LABELS: Partial<Record<RoundStatus, string>> = {
  active: 'In Tournament',
  group_eliminated: 'Group Stage',
  r32_eliminated: 'Round of 32',
  r16_eliminated: 'Round of 16',
  qf_eliminated: 'Quarterfinals',
  sf_eliminated: 'Semifinals',
  runner_up: 'Runner-Up',
  champion: 'Champion',
};
