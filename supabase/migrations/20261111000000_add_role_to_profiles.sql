-- Migration: Add role column to profiles table
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS role TEXT NOT NULL DEFAULT 'tim_pendidik' CHECK (role IN ('kepsek', 'tim_pendidik'));

-- Update existing profiles without role
UPDATE public.profiles SET role = 'tim_pendidik' WHERE role IS NULL;
