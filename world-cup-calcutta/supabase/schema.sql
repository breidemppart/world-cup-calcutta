-- ============================================================
-- World Cup Calcutta — Supabase Schema
-- Run this entire file in your Supabase SQL Editor
-- ============================================================

-- ── Teams ────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS teams (
  id           SERIAL PRIMARY KEY,
  name         VARCHAR(100) NOT NULL UNIQUE,
  group_name   CHAR(1)      NOT NULL,
  flag_emoji   VARCHAR(10)  NOT NULL DEFAULT '🏳️',
  current_bid  DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  current_owner VARCHAR(100),
  round_status  VARCHAR(20)  NOT NULL DEFAULT 'active'
                CHECK (round_status IN (
                  'active','group_eliminated','r32_eliminated',
                  'r16_eliminated','qf_eliminated','sf_eliminated',
                  'runner_up','champion'
                )),
  created_at   TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

-- ── Bids ─────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS bids (
  id           SERIAL PRIMARY KEY,
  team_id      INTEGER      NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
  team_name    VARCHAR(100) NOT NULL,
  bidder_name  VARCHAR(100) NOT NULL,
  amount       DECIMAL(10,2) NOT NULL,
  created_at   TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS bids_team_id_idx    ON bids(team_id);
CREATE INDEX IF NOT EXISTS bids_created_at_idx ON bids(created_at DESC);

-- ── Row Level Security ────────────────────────────────────────
ALTER TABLE teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE bids  ENABLE ROW LEVEL SECURITY;

-- Public read access
CREATE POLICY "teams_read_all" ON teams FOR SELECT USING (true);
CREATE POLICY "bids_read_all"  ON bids  FOR SELECT USING (true);

-- ── Atomic Bid Placement (prevents race conditions) ───────────
CREATE OR REPLACE FUNCTION place_bid(
  p_team_id     INTEGER,
  p_bidder_name TEXT,
  p_amount      DECIMAL
) RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER   -- runs with owner privileges to bypass RLS
AS $$
DECLARE
  v_current_bid  DECIMAL;
  v_team_name    TEXT;
  v_close_time   TIMESTAMPTZ := '2026-06-11T16:00:00+00';  -- noon ET
BEGIN
  -- Check bidding window
  IF NOW() >= v_close_time THEN
    RETURN json_build_object('success', false, 'error', 'Bidding closed at noon ET on June 11.');
  END IF;

  -- Validate inputs
  IF TRIM(p_bidder_name) = '' THEN
    RETURN json_build_object('success', false, 'error', 'Please enter your name.');
  END IF;

  IF p_amount < 5 THEN
    RETURN json_build_object('success', false, 'error', 'Minimum bid is $5.');
  END IF;

  -- Lock team row to prevent concurrent bids
  SELECT current_bid, name
    INTO v_current_bid, v_team_name
    FROM teams
   WHERE id = p_team_id
     FOR UPDATE;

  IF NOT FOUND THEN
    RETURN json_build_object('success', false, 'error', 'Team not found.');
  END IF;

  -- Must beat current bid by at least $1
  IF v_current_bid > 0 AND p_amount < v_current_bid + 1 THEN
    RETURN json_build_object(
      'success', false,
      'error', format('Bid must be at least $%.2f (current: $%.2f + $1)',
                      v_current_bid + 1, v_current_bid)
    );
  END IF;

  -- If first bid, must meet $5 minimum (already checked above)

  -- Update team's current bid
  UPDATE teams
     SET current_bid   = p_amount,
         current_owner = TRIM(p_bidder_name)
   WHERE id = p_team_id;

  -- Record in bid history
  INSERT INTO bids (team_id, team_name, bidder_name, amount)
  VALUES (p_team_id, v_team_name, TRIM(p_bidder_name), p_amount);

  RETURN json_build_object('success', true);
END;
$$;

-- ── Seed All 48 Teams ─────────────────────────────────────────
INSERT INTO teams (name, group_name, flag_emoji) VALUES
  ('Mexico',               'A', '🇲🇽'),
  ('South Africa',         'A', '🇿🇦'),
  ('South Korea',          'A', '🇰🇷'),
  ('Czechia',              'A', '🇨🇿'),
  ('Canada',               'B', '🇨🇦'),
  ('Bosnia & Herzegovina', 'B', '🇧🇦'),
  ('Qatar',                'B', '🇶🇦'),
  ('Switzerland',          'B', '🇨🇭'),
  ('Brazil',               'C', '🇧🇷'),
  ('Morocco',              'C', '🇲🇦'),
  ('Haiti',                'C', '🇭🇹'),
  ('Scotland',             'C', '🏴󠁧󠁢󠁳󠁣󠁴󠁿'),
  ('United States',        'D', '🇺🇸'),
  ('Paraguay',             'D', '🇵🇾'),
  ('Australia',            'D', '🇦🇺'),
  ('Türkiye',              'D', '🇹🇷'),
  ('Germany',              'E', '🇩🇪'),
  ('Curaçao',              'E', '🇨🇼'),
  ('Ivory Coast',          'E', '🇨🇮'),
  ('Ecuador',              'E', '🇪🇨'),
  ('Netherlands',          'F', '🇳🇱'),
  ('Japan',                'F', '🇯🇵'),
  ('Sweden',               'F', '🇸🇪'),
  ('Tunisia',              'F', '🇹🇳'),
  ('Belgium',              'G', '🇧🇪'),
  ('Egypt',                'G', '🇪🇬'),
  ('Iran',                 'G', '🇮🇷'),
  ('New Zealand',          'G', '🇳🇿'),
  ('Spain',                'H', '🇪🇸'),
  ('Cape Verde',           'H', '🇨🇻'),
  ('Saudi Arabia',         'H', '🇸🇦'),
  ('Uruguay',              'H', '🇺🇾'),
  ('France',               'I', '🇫🇷'),
  ('Senegal',              'I', '🇸🇳'),
  ('Iraq',                 'I', '🇮🇶'),
  ('Norway',               'I', '🇳🇴'),
  ('Argentina',            'J', '🇦🇷'),
  ('Algeria',              'J', '🇩🇿'),
  ('Austria',              'J', '🇦🇹'),
  ('Jordan',               'J', '🇯🇴'),
  ('Portugal',             'K', '🇵🇹'),
  ('Congo DR',             'K', '🇨🇩'),
  ('Uzbekistan',           'K', '🇺🇿'),
  ('Colombia',             'K', '🇨🇴'),
  ('England',              'L', '🏴󠁧󠁢󠁥󠁮󠁧󠁿'),
  ('Croatia',              'L', '🇭🇷'),
  ('Ghana',                'L', '🇬🇭'),
  ('Panama',               'L', '🇵🇦')
ON CONFLICT (name) DO NOTHING;

-- ── Enable Realtime ───────────────────────────────────────────
-- Run these in the Supabase dashboard → Database → Replication
-- or uncomment here if your project supports it:
-- ALTER PUBLICATION supabase_realtime ADD TABLE teams;
-- ALTER PUBLICATION supabase_realtime ADD TABLE bids;
