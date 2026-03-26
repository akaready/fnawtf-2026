-- Pipeline settings for intake-to-proposal automation prompts
CREATE TABLE IF NOT EXISTS public.pipeline_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  key text UNIQUE NOT NULL,
  value text NOT NULL DEFAULT '',
  updated_at timestamptz NOT NULL DEFAULT now(),
  updated_by uuid REFERENCES auth.users(id) ON DELETE SET NULL
);

ALTER TABLE public.pipeline_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can manage pipeline_settings"
  ON public.pipeline_settings FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Seed default prompts
INSERT INTO public.pipeline_settings (key, value) VALUES
  ('welcome_prompt', 'Write a warm, personalized welcome message for a video production proposal. Address the client by first name. Reference their project name, what excites them, and their vision. Keep it conversational and enthusiastic — 2-3 short paragraphs in markdown. Do not use italic formatting.'),
  ('approach_prompt', 'Write a creative approach section for a video production proposal. Reference the specific deliverables, phases, and creative goals from the intake. Acknowledge their experience level and any concerns they raised. Keep it confident and collaborative — 2-3 paragraphs in markdown. Do not use italic formatting.'),
  ('samples_prompt', 'Select the 5 most relevant video projects from the provided library that match this client''s needs. Consider their industry, content type, visual style preferences, and production scope. For each selected project, write a 1-2 sentence "what to look for" blurb explaining why this sample is relevant to their project.'),
  ('pricing_prompt', 'Write a brief pricing notes section (1-2 sentences) that contextualizes the quote for this client. Reference their timeline preference and priority order if relevant.'),
  ('timeline_prompt', 'This prompt guides timeline generation. The system uses template milestones with gap scaling based on the client timeline preference (asap=60%, soon=100%, later=130%, unsure=100%+buffer).'),
  ('general_prompt', 'You are writing proposal content for Friends & Allies, a video production company. Tone: confident, collaborative, warm. Never use italic formatting. Use markdown headings and bold for emphasis. Keep paragraphs short and scannable.'),
  ('auto_generate', 'false')
ON CONFLICT (key) DO NOTHING;
