-- ================================================================
--  SMAHZ — v2 update (AI Assistant orders)
--  Only needed if you ALREADY ran the old schema.sql.
--  Supabase -> SQL Editor -> paste -> Run
-- ================================================================
alter table public.orders drop constraint if exists orders_channel_check;
alter table public.orders add constraint orders_channel_check
  check (channel in ('checkout','whatsapp','email','ai'));
