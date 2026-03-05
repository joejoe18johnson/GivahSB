-- Update Cancer Treatment for Ana (campaign 16) to use local images.
-- Run after placing cancer-treatment-ana-1.png and cancer-treatment-ana-2.png in the app's public folder.

UPDATE public.campaigns
SET
  image = '/cancer-treatment-ana-1.png',
  image2 = '/cancer-treatment-ana-2.png',
  updated_at = now()
WHERE id = 'a1b2c3d4-0016-4000-8000-000000000016';
