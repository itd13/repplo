import OpenAI from 'openai';
import { NextResponse } from 'next/server';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export async function POST(request: Request) {
  const { message } = await request.json();

  if (!message || typeof message !== 'string' || !message.trim()) {
    return NextResponse.json({ error: 'message is required' }, { status: 400 });
  }

  const completion = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [
      {
        role: 'system',
        content:
          'First, assess whether the input is a genuine human message (DM, email, comment, text) that someone would realistically reply to. ' +
          'If the input is random text, gibberish, code, a URL, a single word, or anything that is not a real message someone would reply to, ' +
          'return exactly this JSON and nothing else: { "error": "not_a_message" }. ' +
          'If it is a genuine message, generate exactly 3 distinct, context-aware, natural-sounding reply options. ' +
          'Each reply should have a different tone or angle (e.g. warm, concise, curious). ' +
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

  return NextResponse.json({ replies: parsed.replies as [string, string, string] });
}
