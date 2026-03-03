CREATE TABLE IF NOT EXISTS ai_prompt_log (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  script_id uuid REFERENCES scripts(id) ON DELETE SET NULL,
  beat_id uuid,
  scene_id uuid,
  model text NOT NULL DEFAULT 'gemini-3.1-flash-image-preview',
  prompt_text text NOT NULL,
  response_summary text,
  input_tokens integer,
  output_tokens integer,
  cost_estimate numeric(10, 6),
  duration_ms integer,
  status text NOT NULL DEFAULT 'success',
  source text NOT NULL DEFAULT 'storyboard',
  image_url text,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX idx_ai_prompt_log_script ON ai_prompt_log(script_id);
CREATE INDEX idx_ai_prompt_log_created ON ai_prompt_log(created_at DESC);
CREATE INDEX idx_ai_prompt_log_source ON ai_prompt_log(source);
