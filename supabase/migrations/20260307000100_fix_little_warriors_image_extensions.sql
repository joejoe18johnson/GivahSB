-- Fix image extension mismatch for seeded Little Warriors campaigns.
-- Existing rows may reference .png, but files are .jpg/.jpeg in /public/little-warriors.

update public.campaigns
set
  image = '/little-warriors/y1.jpg',
  image2 = '/little-warriors/y2.jpg',
  updated_at = now()
where id = '74f4f4d2-73a8-4ad9-8e3d-2f8f30f29601';

update public.campaigns
set
  image = '/little-warriors/x1.jpg',
  image2 = '/little-warriors/x2.jpeg',
  updated_at = now()
where id = '74f4f4d2-73a8-4ad9-8e3d-2f8f30f29602';

update public.campaigns
set
  image = '/little-warriors/v1.jpg',
  image2 = '/little-warriors/v2.jpg',
  updated_at = now()
where id = '74f4f4d2-73a8-4ad9-8e3d-2f8f30f29603';

update public.campaigns
set
  image = '/little-warriors/a1.jpg',
  image2 = '/little-warriors/a2.jpg',
  updated_at = now()
where id = '74f4f4d2-73a8-4ad9-8e3d-2f8f30f29604';
