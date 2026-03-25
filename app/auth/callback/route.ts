import { createServerClient } from '@supabase/ssr';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');

  const errorUrl = new URL('/login?error=auth', origin);

  if (!code) {
    return NextResponse.redirect(errorUrl);
  }

  // Build the redirect response upfront so session cookies can be
  // written directly onto it — more reliable than next/headers in route handlers.
  const successUrl = new URL('/lab', origin);
  const response = NextResponse.redirect(successUrl);

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.headers.get('cookie')
            ?.split('; ')
            .map((c) => {
              const [name, ...rest] = c.split('=');
              return { name, value: rest.join('=') };
            }) ?? [];
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            response.cookies.set(name, value, options);
          });
        },
      },
    }
  );

  const { error } = await supabase.auth.exchangeCodeForSession(code);

  if (error) {
    return NextResponse.redirect(errorUrl);
  }

  return response;
}
