-- Update campaign 25 (School Renovation / Rock Road Fire) to use local images.
-- Run after placing rock-road-fire-1.png and rock-road-fire-2.png in the app's public folder.

UPDATE public.campaigns
SET
  image = '/rock-road-fire-1.png',
  image2 = '/rock-road-fire-2.png',
  updated_at = now()
WHERE id = 'a1b2c3d4-0025-4000-8000-000000000025';
