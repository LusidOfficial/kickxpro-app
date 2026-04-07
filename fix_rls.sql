-- 1. Copy emails from auth.users into profiles.email
UPDATE public.profiles p
SET email = au.email
FROM auth.users au
WHERE au.id = p.id
  AND p.role = 'player'
  AND p.email IS NULL;

-- 2. Reset all player passwords to 'kickxpro123'
-- The hash below is bcrypt of 'kickxpro123'
UPDATE auth.users
SET encrypted_password = crypt('kickxpro123', gen_salt('bf'))
WHERE id IN (
  SELECT id FROM public.profiles WHERE role = 'player'
);
