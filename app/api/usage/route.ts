import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

const DAILY_FREE_LIMIT = 5;

export async function GET() {
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }

  const today = new Date().toISOString().slice(0, 10);

  const { data: usageRows } = await supabase
    .from('usage')
    .select('reply_count')
    .eq('user_id', user.id)
    .eq('date', today)
    .limit(1);

  const replyCount = usageRows?.[0]?.reply_count ?? 0;

  return NextResponse.json({
    repliesLeft: Math.max(0, DAILY_FREE_LIMIT - replyCount),
    limitReached: replyCount >= DAILY_FREE_LIMIT,
  });
}
