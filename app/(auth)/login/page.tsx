'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import { toast } from 'sonner'

type UserRole = 'admin' | 'waiter' | 'kitchen' | 'customer'

interface Profile {
  role: UserRole
}

const roleRoutes: Record<UserRole, string> = {
  admin: '/dashboard',
  waiter: '/orders',
  kitchen: '/kds',
  customer: '/menu',
}

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) throw error

      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', data.user.id)
        .single<Profile>()

      toast.success('Welcome back!')
      router.push(roleRoutes[profile?.role ?? 'customer'])
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Login failed')
    } finally {
      setLoading(false)
    }
  }

  const handleGoogleLogin = async () => {
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${window.location.origin}/auth/callback` },
    })
  }

  return (
    <div className="min-h-screen bg-[#FAF5EC] flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-gradient-to-br from-orange-600 to-amber-500 rounded-2xl flex items-center justify-center text-3xl font-bold text-white mx-auto mb-4 shadow-md">
            T
          </div>
          <h1 className="text-3xl font-bold text-stone-900">Welcome back</h1>
          <p className="text-stone-500 mt-2">Sign in to TableOS</p>
        </div>

        {/* Card */}
        <div className="bg-white border border-stone-200 rounded-2xl p-8 shadow-sm">
          {/* Google OAuth */}
          <button
            onClick={handleGoogleLogin}
            className="w-full flex items-center justify-center gap-3 bg-white hover:bg-stone-50 text-stone-800 font-semibold py-3 rounded-xl border border-stone-200 transition-colors mb-6 shadow-sm"
          >
            <svg width="20" height="20" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            Continue with Google
          </button>

          <div className="relative mb-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-stone-200" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="bg-white px-3 text-stone-400">or continue with email</span>
            </div>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-stone-700 mb-2">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                required
                className="w-full bg-stone-50 border border-stone-200 text-stone-900 rounded-xl px-4 py-3 focus:outline-none focus:border-orange-400 focus:ring-1 focus:ring-orange-400 transition-colors placeholder-stone-400"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-stone-700 mb-2">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                className="w-full bg-stone-50 border border-stone-200 text-stone-900 rounded-xl px-4 py-3 focus:outline-none focus:border-orange-400 focus:ring-1 focus:ring-orange-400 transition-colors placeholder-stone-400"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-orange-600 to-amber-500 hover:from-orange-700 hover:to-amber-600 disabled:opacity-50 text-white font-bold py-3 rounded-xl transition-all shadow-sm"
            >
              {loading ? 'Signing in...' : 'Sign In'}
            </button>
          </form>

          <p className="text-center text-stone-400 text-sm mt-6">
            No account?{' '}
            <Link href="/register" className="text-orange-600 hover:text-orange-700 font-medium">
              Create one
            </Link>
          </p>
        </div>

        {/* Quick demo logins */}
        <div className="mt-6 bg-white/70 border border-stone-200 rounded-xl p-4 shadow-sm">
          <p className="text-stone-400 text-xs text-center mb-3">Demo accounts (hackathon judges)</p>
          <div className="grid grid-cols-2 gap-2 text-xs">
            {[
              { role: 'Admin', email: 'admin@tableos.demo' },
              { role: 'Waiter', email: 'waiter@tableos.demo' },
              { role: 'Kitchen', email: 'kitchen@tableos.demo' },
              { role: 'Customer', email: 'customer@tableos.demo' },
            ].map((demo) => (
              <button
                key={demo.role}
                onClick={() => { setEmail(demo.email); setPassword('Demo@1234') }}
                className="bg-stone-50 hover:bg-orange-50 border border-stone-200 hover:border-orange-200 text-stone-600 rounded-lg p-2 text-left transition-colors"
              >
                <span className="font-medium text-stone-900">{demo.role}</span>
                <br />
                <span className="text-stone-400">{demo.email}</span>
              </button>
            ))}
          </div>
          <p className="text-stone-400 text-xs text-center mt-2">Password: Demo@1234</p>
        </div>
      </div>
    </div>
  )
}