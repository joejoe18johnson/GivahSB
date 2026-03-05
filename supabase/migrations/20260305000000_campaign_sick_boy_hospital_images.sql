-- Update campaign 34e88473 (sick boy / hospital) to use new campaign images.
-- Run after placing sick-boy-hospital-1.png and sick-boy-hospital-2.png in the app's public folder.

UPDATE public.campaigns
SET
  image = '/sick-boy-hospital-1.png',
  image2 = '/sick-boy-hospital-2.png',
  updated_at = now()
WHERE id = '34e88473-a388-4881-ac7d-4935fc0a34c6';
