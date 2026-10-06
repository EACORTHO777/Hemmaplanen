alter table public.households
add column invite_code text not null unique
default substr(replace(gen_random_uuid()::text, '-', ''), 1, 8);