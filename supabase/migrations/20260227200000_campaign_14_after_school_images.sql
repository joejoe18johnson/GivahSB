-- Update After-School Tutoring in Corozal (campaign 14) to use local images.
-- Run after placing after-school-corozal-1.png and after-school-corozal-2.png in the app's public folder.

UPDATE public.campaigns
SET
  image = '/after-school-corozal-1.png',
  image2 = '/after-school-corozal-2.png',
  updated_at = now()
WHERE id = 'a1b2c3d4-0014-4000-8000-000000000014';
