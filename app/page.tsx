import Link from 'next/link'

export default function LandingPage() {
  return (
    <main className="min-h-screen bg-gray-950 text-white overflow-hidden">
      {/* Hero */}
      <div className="relative">
        {/* Gradient orbs */}
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-orange-500/20 rounded-full blur-3xl" />
        <div className="absolute top-20 right-1/4 w-80 h-80 bg-amber-500/20 rounded-full blur-3xl" />

        {/* Nav */}
        <nav className="relative z-10 flex items-center justify-between px-8 py-6 max-w-7xl mx-auto">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-orange-500 to-amber-500 rounded-xl flex items-center justify-center text-xl font-bold">
              T
            </div>
            <span className="text-2xl font-bold bg-gradient-to-r from-orange-400 to-amber-400 bg-clip-text text-transparent">
              TableOS
            </span>
          </div>
          <div className="flex items-center gap-4">
            <Link href="/login" className="text-gray-400 hover:text-white transition-colors">
              Sign In
            </Link>
            <Link
              href="/register"
              className="bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white px-6 py-2 rounded-xl font-semibold transition-all"
            >
              Get Started
            </Link>
          </div>
        </nav>

        {/* Hero Content */}
        <div className="relative z-10 max-w-7xl mx-auto px-8 pt-24 pb-32 text-center">
          <div className="inline-flex items-center gap-2 bg-orange-500/10 border border-orange-500/20 rounded-full px-4 py-2 text-orange-400 text-sm font-medium mb-8">
            <span className="w-2 h-2 bg-orange-400 rounded-full animate-pulse" />
            AI-Powered Restaurant Intelligence
          </div>
          <h1 className="text-6xl md:text-8xl font-black mb-8 leading-tight">
            The OS for
            <br />
            <span className="bg-gradient-to-r from-orange-400 via-amber-400 to-yellow-400 bg-clip-text text-transparent">
              Modern Restaurants
            </span>
          </h1>
          <p className="text-xl text-gray-400 max-w-2xl mx-auto mb-12 leading-relaxed">
            Real-time orders. Intelligent queuing. AI insights. 
            Everything your restaurant needs — in one powerful platform.
          </p>
          <div className="flex items-center justify-center gap-4 flex-wrap">
            <Link
              href="/menu"
              className="bg-gradient-to-r from-orange-500 to-amber-500 hover:scale-105 text-white px-8 py-4 rounded-2xl font-bold text-lg transition-all shadow-2xl shadow-orange-500/25"
            >
              Browse Menu →
            </Link>
            <Link
              href="/queue"
              className="bg-white/5 border border-white/10 hover:bg-white/10 text-white px-8 py-4 rounded-2xl font-bold text-lg transition-all"
            >
              Join Queue
            </Link>
          </div>
        </div>

        {/* Stats Bar */}
        <div className="relative z-10 max-w-5xl mx-auto px-8 pb-24">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { label: 'Active Tables', value: '10', icon: '🪑' },
              { label: 'Avg Wait Time', value: '< 15 min', icon: '⏱️' },
              { label: 'Menu Items', value: '14+', icon: '🍽️' },
              { label: 'AI-Powered', value: '100%', icon: '🤖' },
            ].map((stat) => (
              <div
                key={stat.label}
                className="bg-white/5 border border-white/10 rounded-2xl p-6 text-center hover:bg-white/8 transition-colors"
              >
                <div className="text-3xl mb-2">{stat.icon}</div>
                <div className="text-2xl font-bold text-white">{stat.value}</div>
                <div className="text-sm text-gray-400">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Features Grid */}
      <div className="max-w-7xl mx-auto px-8 py-24">
        <h2 className="text-4xl font-bold text-center mb-4">
          Everything You Need, Nothing You Don&apos;t
        </h2>
        <p className="text-gray-400 text-center mb-16 max-w-xl mx-auto">
          Built from the ground up for operational excellence — not a clone of anything.
        </p>
        <div className="grid md:grid-cols-3 gap-6">
          {[
            {
              icon: '⚡',
              title: 'Real-Time Everything',
              description: 'Menu availability, order status, and kitchen updates sync instantly across all devices — no refresh needed.',
              color: 'from-blue-500/10 to-cyan-500/10 border-blue-500/20',
            },
            {
              icon: '🧮',
              title: 'Erlang-C Queue Math',
              description: 'Advanced queueing theory gives customers accurate, mathematically-derived wait times. No guessing.',
              color: 'from-purple-500/10 to-pink-500/10 border-purple-500/20',
            },
            {
              icon: '🤖',
              title: 'AI Recommendations',
              description: 'OpenRouter AI analyzes order history and inventory to give personalized dish recommendations.',
              color: 'from-orange-500/10 to-amber-500/10 border-orange-500/20',
            },
            {
              icon: '📊',
              title: 'Dynamic Pricing',
              description: 'Algorithmic pricing adjusts automatically based on demand surge, time of day, and stock levels.',
              color: 'from-green-500/10 to-emerald-500/10 border-green-500/20',
            },
            {
              icon: '🍳',
              title: 'Kitchen Display System',
              description: 'Dedicated KDS for kitchen staff with priority queuing, timer alerts, and order tracking.',
              color: 'from-red-500/10 to-orange-500/10 border-red-500/20',
            },
            {
              icon: '📈',
              title: 'Business Analytics',
              description: 'Revenue trends, waste tracking, demand forecasting, and AI-generated operational insights.',
              color: 'from-indigo-500/10 to-blue-500/10 border-indigo-500/20',
            },
          ].map((feature) => (
            <div
              key={feature.title}
              className={`bg-gradient-to-br ${feature.color} border rounded-2xl p-8 hover:scale-105 transition-transform cursor-default`}
            >
              <div className="text-4xl mb-4">{feature.icon}</div>
              <h3 className="text-xl font-bold mb-3">{feature.title}</h3>
              <p className="text-gray-400 leading-relaxed">{feature.description}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Role CTA */}
      <div className="max-w-7xl mx-auto px-8 py-24">
        <h2 className="text-4xl font-bold text-center mb-16">Choose Your Role</h2>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { role: 'Customer', icon: '👤', desc: 'Browse menu, join queue, track orders', href: '/menu', color: 'hover:border-orange-500/50' },
            { role: 'Waiter', icon: '🫱', desc: 'Manage tables, take orders, assist customers', href: '/login?role=waiter', color: 'hover:border-blue-500/50' },
            { role: 'Kitchen', icon: '👨‍🍳', desc: 'View KDS, update order status, manage prep', href: '/login?role=kitchen', color: 'hover:border-green-500/50' },
            { role: 'Admin', icon: '⚙️', desc: 'Full dashboard, analytics, AI insights, settings', href: '/login?role=admin', color: 'hover:border-purple-500/50' },
          ].map((item) => (
            <Link
              key={item.role}
              href={item.href}
              className={`bg-white/5 border border-white/10 ${item.color} rounded-2xl p-6 text-center transition-all hover:bg-white/8 hover:scale-105`}
            >
              <div className="text-5xl mb-4">{item.icon}</div>
              <div className="font-bold text-lg mb-2">{item.role}</div>
              <div className="text-gray-400 text-sm">{item.desc}</div>
            </Link>
          ))}
        </div>
      </div>

      {/* Footer */}
      <footer className="border-t border-white/10 py-8 text-center text-gray-500 text-sm">
        <p>TableOS © 2026 — Built for VibeAthon 6.0 | Powered by Next.js, Supabase & OpenRouter AI</p>
      </footer>
    </main>
  )
}