-- Update Flood Relief in Belmopan (campaign 12) to use local flooding images.
-- Run after placing flooding-belize-1.png and flooding-belize-2.png in the app's public folder.

UPDATE public.campaigns
SET
  image = '/flooding-belize-1.png',
  image2 = '/flooding-belize-2.png',
  updated_at = now()
WHERE id = 'a1b2c3d4-0012-4000-8000-000000000012';
