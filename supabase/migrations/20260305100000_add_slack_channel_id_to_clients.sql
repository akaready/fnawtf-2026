-- Add slack_channel_id to clients for Slack channel integration
alter table public.clients add column slack_channel_id text;
