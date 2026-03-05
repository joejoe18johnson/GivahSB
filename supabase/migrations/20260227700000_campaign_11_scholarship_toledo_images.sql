-- Update Scholarship Fund for Toledo Students (campaign 11) to use local images.
-- Run after placing scholarship-toledo-1.png and scholarship-toledo-2.png in the app's public folder.

UPDATE public.campaigns
SET
  image = '/scholarship-toledo-1.png',
  image2 = '/scholarship-toledo-2.png',
  updated_at = now()
WHERE id = 'a1b2c3d4-0011-4000-8000-000000000011';
