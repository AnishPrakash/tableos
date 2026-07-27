import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

const roleRoutes: Record<string, string[]> = {
  admin: ['/dashboard', '/inventory', '/staff', '/analytics'],
  waiter: ['/orders'],
  kitchen: ['/kds'],
  customer: ['/menu', '/queue', '/bill'],
}

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({ request: { headers: request.headers } })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return request.cookies.getAll() },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          response = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  const { data: { user } } = await supabase.auth.getUser()
  const pathname = request.nextUrl.pathname

  // Redirect logged-in users away from login/register
  if (user && (pathname === '/login' || pathname === '/register')) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()
    const role = (profile?.role as string) ?? 'customer'
    const dest = Object.entries(roleRoutes).find(([r]) => r === role)?.[1][0] ?? '/menu'
    return NextResponse.redirect(new URL(dest, request.url))
  }

  // Protect role-specific routes
  const allProtected = Object.values(roleRoutes).flat()
  const isProtected = allProtected.some((r) => pathname.startsWith(r))

  if (isProtected && !user) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  // Block wrong-role access
  if (isProtected && user) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()
    const role = (profile?.role as string) ?? 'customer'
    const allowed = roleRoutes[role] ?? ['/menu']
    const canAccess = allowed.some((r) => pathname.startsWith(r))
    if (!canAccess) {
      const dest = allowed[0]
      return NextResponse.redirect(new URL(dest, request.url))
    }
  }

  return response
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|api/|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)'],
}