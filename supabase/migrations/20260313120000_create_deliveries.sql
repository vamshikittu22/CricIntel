-- Create deliveries table
CREATE TABLE IF NOT EXISTS public.deliveries (
    id bigserial PRIMARY KEY,
    match_id text REFERENCES public.matches(id) ON DELETE CASCADE,
    innings int NOT NULL,
    over_number int NOT NULL,
    ball_number int NOT NULL,
    striker text NOT NULL,
    non_striker text,
    bowler text NOT NULL,
    batting_team text,
    bowling_team text,
    runs_off_bat int DEFAULT 0,
    extras int DEFAULT 0,
    is_wicket boolean DEFAULT false,
    player_dismissed text,
    dismissal_kind text,
    fielder text,
    phase text, -- powerplay, middle, or death
    ball_length text, -- full, good, short, yorker, bouncer
    ball_line text, -- off, middle, leg, wide_off, wide_leg
    wagon_x decimal(5,2),
    wagon_y decimal(5,2),
    ball_speed decimal(5,2),
    created_at timestamptz DEFAULT now()
);

-- Add indexes for common queries
CREATE INDEX IF NOT EXISTS idx_deliveries_striker ON public.deliveries(striker);
CREATE INDEX IF NOT EXISTS idx_deliveries_bowler ON public.deliveries(bowler);
CREATE INDEX IF NOT EXISTS idx_deliveries_match_id ON public.deliveries(match_id);
CREATE INDEX IF NOT EXISTS idx_deliveries_is_wicket ON public.deliveries(is_wicket);
CREATE INDEX IF NOT EXISTS idx_deliveries_phase ON public.deliveries(phase);

-- Enable RLS
ALTER TABLE public.deliveries ENABLE ROW LEVEL SECURITY;

-- Allow public read access (adjust as needed for CricIntel's security model)
CREATE POLICY "Allow public read access on deliveries" ON public.deliveries
    FOR SELECT USING (true);
