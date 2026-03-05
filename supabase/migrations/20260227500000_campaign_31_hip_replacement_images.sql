-- Update Hip Replacement for Mrs. Garcia (campaign 31) to use local images.
-- Run after placing hip-replacement-mrs-garcia-1.png and hip-replacement-mrs-garcia-2.png in the app's public folder.

UPDATE public.campaigns
SET
  image = '/hip-replacement-mrs-garcia-1.png',
  image2 = '/hip-replacement-mrs-garcia-2.png',
  updated_at = now()
WHERE id = 'a1b2c3d4-0031-4000-8000-000000000031';
