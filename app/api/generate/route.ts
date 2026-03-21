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
          'You generate exactly 3 distinct, ready-to-send reply options for a given message. ' +
          'Each reply should have a different tone or angle (e.g. warm, concise, curious). ' +
          'Respond with a JSON object in this exact shape: { "replies": ["...", "...", "..."] }. ' +
          'No extra keys, no markdown, no explanation.',
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
  const parsed = JSON.parse(raw) as { replies?: unknown };

  if (
    !Array.isArray(parsed.replies) ||
    parsed.replies.length !== 3 ||
    !parsed.replies.every((r) => typeof r === 'string')
  ) {
    return NextResponse.json({ error: 'Unexpected response from model' }, { status: 502 });
  }

  return NextResponse.json({ replies: parsed.replies as [string, string, string] });
}
