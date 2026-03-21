-- Supabase Database Schema
-- Execute this script in the Supabase SQL Editor to initialize your project

-- 1. Create Users Table (Extends Supabase Auth optionally)
CREATE TABLE public.users (
  id uuid REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  role text NOT NULL DEFAULT 'parent' CHECK (role IN ('parent', 'driver', 'admin')),
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Create Buses Table
CREATE TABLE public.buses (
  id text PRIMARY KEY,
  bus_name text NOT NULL,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. Create Bus Locations Table (Live Tracking)
CREATE TABLE public.bus_locations (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  bus_id text REFERENCES public.buses(id) ON DELETE CASCADE NOT NULL,
  latitude double precision NOT NULL,
  longitude double precision NOT NULL,
  updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 4. Create Notifications Table (Push / History)
CREATE TABLE public.notifications (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  bus_id text REFERENCES public.buses(id) ON DELETE CASCADE,
  message text NOT NULL,
  type text NOT NULL CHECK (type IN ('arrival', 'delay', 'emergency', 'info')),
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- ==============================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ==============================================================

-- Enable RLS on all tables
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.buses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bus_locations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- For MVP ease of use, we'll allow authenticated users full read capabilities.
-- Adjust policies per production needs!

CREATE POLICY "Allow public read access to buses" ON public.buses FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow public read access to bus_locations" ON public.bus_locations FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow public read access to notifications" ON public.notifications FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow public read access to users" ON public.users FOR SELECT TO authenticated USING (true);

-- Drivers can Insert/Update bus locations
CREATE POLICY "Allow drivers to insert locations" ON public.bus_locations FOR INSERT TO authenticated WITH CHECK (EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role IN ('driver', 'admin')));
CREATE POLICY "Allow drivers to update locations" ON public.bus_locations FOR UPDATE TO authenticated USING (EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role IN ('driver', 'admin')));

-- Admins can Insert notifications
CREATE POLICY "Allow admins to insert notifications" ON public.notifications FOR INSERT TO authenticated WITH CHECK (EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin'));

-- ==============================================================
-- REALTIME EXTENSIONS
-- ==============================================================

-- Tell Supabase to broadcast changes from these tables real-time
BEGIN;
  DROP PUBLICATION IF EXISTS supabase_realtime;
  CREATE PUBLICATION supabase_realtime;
COMMIT;
ALTER PUBLICATION supabase_realtime ADD TABLE public.bus_locations;
ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;

-- Optional: Initial seed data
INSERT INTO public.buses (id, bus_name) VALUES ('bus_101', 'Morning Pickup Route 1') ON CONFLICT DO NOTHING;
