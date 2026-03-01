export interface Conversation {
  id: string;
  title: string | null;
  model: string;
  created_at: string;
  updated_at: string;
}

export interface Message {
  id: string;
  conversation_id: string;
  role: 'user' | 'assistant';
  content: string;
  context: Record<string, unknown> | null;
  created_at: string;
}

export interface ChatContext {
  route: string;
  recordId?: string;
  recordType?: string;
}

export type ModelId = 'haiku' | 'sonnet' | 'opus';

export const MODEL_OPTIONS: { id: ModelId; label: string; description: string }[] = [
  { id: 'haiku', label: 'Haiku', description: 'Fast' },
  { id: 'sonnet', label: 'Sonnet', description: 'Balanced' },
  { id: 'opus', label: 'Opus', description: 'Powerful' },
];

export const MODEL_API_MAP: Record<ModelId, string> = {
  haiku: 'claude-haiku-4-5-20251001',
  sonnet: 'claude-sonnet-4-20250514',
  opus: 'claude-opus-4-20250514',
};
