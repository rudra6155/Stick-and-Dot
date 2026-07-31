-- Run this in your Supabase SQL Editor

CREATE TABLE public.user_picks (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES auth.users NOT NULL,
  ticker text NOT NULL,
  asset_class text NOT NULL,
  amount numeric NOT NULL,
  quantity numeric NOT NULL,
  holding_period text NOT NULL,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS
ALTER TABLE public.user_picks ENABLE ROW LEVEL SECURITY;

-- Create Policies
CREATE POLICY "Users can view their own picks" ON public.user_picks
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own picks" ON public.user_picks
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own picks" ON public.user_picks
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own picks" ON public.user_picks
  FOR DELETE USING (auth.uid() = user_id);
