-- Update Ambulance Fuel Fund (campaign 34) to use local images.
-- Run after placing ambulance-fuel-fund-1.png and ambulance-fuel-fund-2.png in the app's public folder.

UPDATE public.campaigns
SET
  image = '/ambulance-fuel-fund-1.png',
  image2 = '/ambulance-fuel-fund-2.png',
  updated_at = now()
WHERE id = 'a1b2c3d4-0034-4000-8000-000000000034';
