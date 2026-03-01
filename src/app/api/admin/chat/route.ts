import { NextRequest, NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';
import { createClient } from '@/lib/supabase/server';
import { createServiceClient } from '@/lib/supabase/service';
import { TOOL_DEFINITIONS, executeTool } from './tools';
import { buildSystemPrompt } from './systemPrompt';

const MODEL_MAP: Record<string, string> = {
  haiku: 'claude-haiku-4-5-20251001',
  sonnet: 'claude-sonnet-4-20250514',
  opus: 'claude-opus-4-20250514',
};

export async function POST(request: NextRequest) {
  // Auth check
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await request.json();
  const { conversationId, message, context, model } = body as {
    conversationId?: string;
    message: string;
    context?: { route: string; recordId?: string; recordType?: string };
    model?: string;
  };

  const serviceDb = createServiceClient();
  const anthropic = new Anthropic();

  // Create or fetch conversation
  let convId = conversationId;
  let shortTitle = '';
  if (!convId) {
    // Generate a concise title via a quick Haiku call
    try {
      const titleRes = await anthropic.messages.create({
        model: MODEL_MAP.haiku,
        max_tokens: 30,
        messages: [{ role: 'user', content: message }],
        system: 'Generate a short chat title (2-4 words max) that captures the intent of this message. Reply with ONLY the title, nothing else. No quotes, no punctuation, no explanation.',
      });
      const raw = titleRes.content[0];
      shortTitle = raw.type === 'text' ? raw.text.trim().replace(/[."':]/g, '') : '';
    } catch {
      shortTitle = '';
    }
    // Fallback: first 4 words of the message
    if (!shortTitle) shortTitle = message.split(/\s+/).slice(0, 4).join(' ');

    const { data: conv, error } = await supabase
      .from('chat_conversations')
      .insert({
        user_id: user.id,
        model: model || 'haiku',
        title: shortTitle,
      } as never)
      .select('id')
      .single();
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    convId = (conv as unknown as { id: string }).id;
  } else if (model) {
    await supabase
      .from('chat_conversations')
      .update({ model, updated_at: new Date().toISOString() } as never)
      .eq('id', convId);
  }

  // Save user message
  await supabase.from('chat_messages').insert({
    conversation_id: convId,
    role: 'user',
    content: message,
    context: context || null,
  } as never);

  // Load conversation history (last 50 messages)
  const { data: history } = await supabase
    .from('chat_messages')
    .select('role, content')
    .eq('conversation_id', convId!)
    .order('created_at', { ascending: true })
    .limit(50);

  const historyRows = (history || []) as unknown as { role: string; content: string }[];
  const messages: Anthropic.MessageParam[] = historyRows.map((m) => ({
    role: m.role as 'user' | 'assistant',
    content: m.content,
  }));

  // Resolve model
  const modelId = MODEL_MAP[model || 'haiku'] || MODEL_MAP.haiku;

  // Agentic tool-use loop: run until we get a text-only response
  let currentMessages = [...messages];
  let finalText = '';
  const maxIterations = 10;

  for (let i = 0; i < maxIterations; i++) {
    const response = await anthropic.messages.create({
      model: modelId,
      max_tokens: 4096,
      system: buildSystemPrompt(context || { route: '/admin' }),
      messages: currentMessages,
      tools: TOOL_DEFINITIONS,
    });

    // Check if there are tool uses
    const toolUseBlocks: Array<{ type: 'tool_use'; id: string; name: string; input: unknown }> = [];
    const textBlocks: Array<{ type: 'text'; text: string }> = [];

    for (const block of response.content) {
      if (block.type === 'tool_use') {
        toolUseBlocks.push(block as { type: 'tool_use'; id: string; name: string; input: unknown });
      } else if (block.type === 'text') {
        textBlocks.push(block as { type: 'text'; text: string });
      }
    }

    if (toolUseBlocks.length === 0) {
      finalText = textBlocks.map((b) => b.text).join('');
      break;
    }

    // Execute all tool calls
    const toolResults: Anthropic.ToolResultBlockParam[] = [];
    for (const toolBlock of toolUseBlocks) {
      const result = await executeTool(
        toolBlock.name,
        toolBlock.input as Record<string, unknown>,
        serviceDb,
      );
      toolResults.push({
        type: 'tool_result',
        tool_use_id: toolBlock.id,
        content: JSON.stringify(result),
      });
    }

    // Append assistant response and tool results, then continue loop
    currentMessages = [
      ...currentMessages,
      { role: 'assistant' as const, content: response.content },
      { role: 'user' as const, content: toolResults },
    ];

    // If there was also text in this response, capture it
    if (textBlocks.length > 0 && response.stop_reason === 'end_turn') {
      finalText = textBlocks.map((b) => b.text).join('');
      break;
    }
  }

  // Save assistant message
  await supabase.from('chat_messages').insert({
    conversation_id: convId,
    role: 'assistant',
    content: finalText,
  } as never);

  // Update conversation timestamp
  await supabase
    .from('chat_conversations')
    .update({ updated_at: new Date().toISOString() } as never)
    .eq('id', convId!);

  // Stream the final text via SSE
  const encoder = new TextEncoder();
  const readable = new ReadableStream({
    start(controller) {
      controller.enqueue(
        encoder.encode(
          `data: ${JSON.stringify({ type: 'conversation_id', id: convId, title: shortTitle })}\n\n`,
        ),
      );

      const words = finalText.split(' ');
      let idx = 0;
      const chunkSize = 3;

      function sendChunk() {
        if (idx >= words.length) {
          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify({ type: 'done' })}\n\n`),
          );
          controller.close();
          return;
        }
        const chunk =
          words.slice(idx, idx + chunkSize).join(' ') +
          (idx + chunkSize < words.length ? ' ' : '');
        controller.enqueue(
          encoder.encode(
            `data: ${JSON.stringify({ type: 'text', text: chunk })}\n\n`,
          ),
        );
        idx += chunkSize;
        setTimeout(sendChunk, 15);
      }

      sendChunk();
    },
  });

  return new Response(readable, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      Connection: 'keep-alive',
    },
  });
}
