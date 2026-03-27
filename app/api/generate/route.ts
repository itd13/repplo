import OpenAI from 'openai';
import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

const DAILY_FREE_LIMIT = 5;

export async function POST(request: Request) {
  const { message, tone = 'Balanced' } = await request.json();

  if (!message || typeof message !== 'string' || !message.trim()) {
    return NextResponse.json({ error: 'message is required' }, { status: 400 });
  }

  // Auth check
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }

  // Check daily usage
  const today = new Date().toISOString().slice(0, 10); // YYYY-MM-DD

  const { data: usageRows } = await supabase
    .from('usage')
    .select('reply_count')
    .eq('user_id', user.id)
    .eq('date', today)
    .limit(1);

  const replyCount = usageRows?.[0]?.reply_count ?? 0;

  if (replyCount >= DAILY_FREE_LIMIT) {
    return NextResponse.json({ error: 'daily_limit_reached' }, { status: 429 });
  }

  // Generate replies
  const completion = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [
      {
        role: 'system',
        content:
          'First, assess whether the input is a genuine human message (DM, email, comment, text) that someone would realistically reply to. ' +
          'If the input is random text, gibberish, code, a URL, a single word, or anything that is not a real message someone would reply to, ' +
          'return exactly this JSON and nothing else: { "error": "not_a_message" }. ' +
          'If it is a genuine message, generate exactly 3 context-aware, natural-sounding reply options. ' +
          (tone === 'Balanced'
            ? 'Reply 1 must be Casual in tone. Reply 2 must be Professional in tone. Reply 3 must be Friendly in tone. Each should feel genuinely different. '
            : `All 3 replies must be ${tone} in tone, each offering a different angle or phrasing. `) +
          'Return exactly this JSON and nothing else: { "replies": ["reply1", "reply2", "reply3"] }. ' +
          'Never mix the two shapes. Never add keys, markdown, or explanation outside the JSON.',
      },
      {
        role: 'user',
        content: message,
      },
    ],
    response_format: { type: 'json_object' },
    temperature: 0.8,
  });

  const raw = completion.choices[0].message.content ?? '{}';
  const parsed = JSON.parse(raw) as { replies?: unknown; error?: unknown };

  if (parsed.error === 'not_a_message') {
    return NextResponse.json({ error: 'not_a_message' }, { status: 422 });
  }

  if (
    !Array.isArray(parsed.replies) ||
    parsed.replies.length !== 3 ||
    !parsed.replies.every((r) => typeof r === 'string')
  ) {
    return NextResponse.json({ error: 'Unexpected response from model' }, { status: 502 });
  }

  const replies = parsed.replies as [string, string, string];
  const tokensUsed = completion.usage?.total_tokens ?? 0;

  // Upsert usage (increment reply_count for today)
  await supabase
    .from('usage')
    .upsert(
      { user_id: user.id, date: today, reply_count: replyCount + 1 },
      { onConflict: 'user_id,date' }
    );

  // Save generation to replies table
  await supabase.from('replies').insert({
    user_id: user.id,
    input_message: message,
    replies,
    tokens_used: tokensUsed,
  });

  return NextResponse.json({
    replies,
    toneLabels: tone === 'Balanced' ? ['Casual', 'Professional', 'Friendly'] : null,
    repliesLeft: DAILY_FREE_LIMIT - (replyCount + 1),
  });
}
