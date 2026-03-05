-- Add company column to pricing_leads for lead tracking
alter table public.pricing_leads add column company text;
