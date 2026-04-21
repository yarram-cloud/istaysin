-- Fix: make global_user_id nullable in guest_profiles to support walk-in/public booking guests
ALTER TABLE guest_profiles ALTER COLUMN global_user_id DROP NOT NULL;
