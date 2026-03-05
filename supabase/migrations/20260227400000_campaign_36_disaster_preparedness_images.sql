-- Update Disaster Preparedness Kits (campaign 36) to use local images.
-- Run after placing disaster-preparedness-1.png and disaster-preparedness-2.png in the app's public folder.

UPDATE public.campaigns
SET
  image = '/disaster-preparedness-1.png',
  image2 = '/disaster-preparedness-2.png',
  updated_at = now()
WHERE id = 'a1b2c3d4-0036-4000-8000-000000000036';
