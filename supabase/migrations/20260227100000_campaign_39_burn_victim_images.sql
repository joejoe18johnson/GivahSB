-- Update Burn Victim Care (campaign 39) to use local images.
-- Run after placing burn-victim-care-1.png and burn-victim-care-2.png in the app's public folder.

UPDATE public.campaigns
SET
  image = '/burn-victim-care-1.png',
  image2 = '/burn-victim-care-2.png',
  updated_at = now()
WHERE id = 'a1b2c3d4-0039-4000-8000-000000000039';
