import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

export async function proxy(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // getSession reads from cookies directly — no network call.
  // This avoids silent failures from network timeouts to Supabase GoTrue.
  const { data: { session } } = await supabase.auth.getSession();
  const { pathname } = request.nextUrl;

  // Protect all /admin routes except /admin/login
  if (pathname.startsWith('/admin') && pathname !== '/admin/login') {
    if (!session) {
      const url = request.nextUrl.clone();
      url.pathname = '/admin/login';
      return NextResponse.redirect(url, { status: 303 });
    }
  }

  // Already logged in — skip the login page
  if (pathname === '/admin/login' && session) {
    const url = request.nextUrl.clone();
    url.pathname = '/admin/projects';
    return NextResponse.redirect(url, { status: 303 });
  }

  return supabaseResponse;
}

export const config = {
  matcher: ['/admin/:path*'],
};
