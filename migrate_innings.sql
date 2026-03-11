ALTER TABLE match_player_stats DROP CONSTRAINT match_player_stats_pkey;
ALTER TABLE match_player_stats ADD COLUMN IF NOT EXISTS inning integer NOT NULL DEFAULT 1;
ALTER TABLE match_player_stats ADD PRIMARY KEY (match_id, player_id, inning);
