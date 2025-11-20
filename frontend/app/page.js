import Link from "next/link";

export default function Home() {
  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Animated Background */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute w-96 h-96 bg-teal-500/10 rounded-full blur-3xl -top-48 -left-48 animate-pulse"></div>
        <div className="absolute w-96 h-96 bg-purple-500/10 rounded-full blur-3xl top-1/3 -right-48 animate-pulse" style={{animationDelay: '1s'}}></div>
        <div className="absolute w-96 h-96 bg-pink-500/10 rounded-full blur-3xl -bottom-48 left-1/3 animate-pulse" style={{animationDelay: '2s'}}></div>
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Navigation */}
        <nav className="py-6 flex justify-between items-center">
          <h1 className="text-3xl font-bold gradient-text">FoodFlow</h1>
          <div className="flex items-center gap-4">
            <Link 
              href="/login" 
              className="text-gray-300 hover:text-teal-400 transition-colors font-medium"
            >
              Sign In
            </Link>
            <Link
              href="/register"
              className="btn-premium px-6 py-2.5 rounded-lg text-white font-semibold"
            >
              Get Started
            </Link>
          </div>
        </nav>

        {/* Hero Section */}
        <div className="py-20 lg:py-28 text-center fade-in">
          <div className="inline-block mb-4 px-4 py-2 glass-light rounded-full text-teal-400 text-sm font-medium">
            🌱 Sustainable Food Management Platform
          </div>
          <h2 className="text-5xl lg:text-7xl font-bold text-white mb-6 leading-tight">
            Manage Food,
            <br />
            <span className="gradient-text">Minimize Waste</span>
          </h2>
          <p className="text-xl text-gray-400 mb-10 max-w-3xl mx-auto leading-relaxed">
            Track inventory, log consumption, and get AI-powered recommendations 
            to reduce food waste while supporting sustainable development goals
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <Link
              href="/register"
              className="btn-premium px-8 py-4 rounded-xl text-lg font-semibold text-white inline-flex items-center justify-center gap-2"
            >
              Start Free Trial
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
            </Link>
            <Link
              href="/login"
              className="glass px-8 py-4 rounded-xl text-lg font-semibold text-white hover:bg-white/10 transition-all inline-flex items-center justify-center gap-2"
            >
              Watch Demo
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </Link>
          </div>
        </div>

        {/* Features Grid */}
        <div className="grid md:grid-cols-3 gap-6 lg:gap-8 py-16 lg:py-20">
          <div className="premium-card p-8 rounded-2xl group">
            <div className="w-14 h-14 bg-gradient-to-br from-teal-500 to-teal-600 rounded-xl flex items-center justify-center mb-6 transition-all">
              <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
            </div>
            <h3 className="text-2xl font-bold mb-3 text-white">Smart Tracking</h3>
            <p className="text-gray-400 leading-relaxed">
              Log consumption patterns and get personalized insights on your eating habits with AI-powered analytics
            </p>
          </div>

          <div className="premium-card p-8 rounded-2xl group">
            <div className="w-14 h-14 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl flex items-center justify-center mb-6 transition-all">
              <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
              </svg>
            </div>
            <h3 className="text-2xl font-bold mb-3 text-white">Inventory Control</h3>
            <p className="text-gray-400 leading-relaxed">
              Track expiration dates, get timely alerts, and optimize your food storage to minimize waste
            </p>
          </div>

          <div className="premium-card p-8 rounded-2xl group">
            <div className="w-14 h-14 bg-gradient-to-br from-teal-400 to-cyan-500 rounded-xl flex items-center justify-center mb-6 transition-all">
              <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
              </svg>
            </div>
            <h3 className="text-2xl font-bold mb-3 text-white">AI Recommendations</h3>
            <p className="text-gray-400 leading-relaxed">
              Receive personalized tips on waste reduction, budgeting, and sustainable consumption practices
            </p>
          </div>
        </div>

        {/* Stats Section */}
        <div className="glass p-12 rounded-3xl my-16 lg:my-20">
          <div className="text-center mb-10">
            <h3 className="text-3xl lg:text-4xl font-bold text-white mb-4">Supporting Global Sustainability</h3>
            <p className="text-gray-400 text-lg">Aligned with UN Sustainable Development Goals</p>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="premium-card p-8 rounded-2xl">
                <p className="text-5xl lg:text-6xl font-bold gradient-text mb-2">SDG 2</p>
                <p className="text-gray-400 font-medium text-lg">Zero Hunger</p>
                <p className="text-gray-500 text-sm mt-2">End hunger, achieve food security</p>
              </div>
            </div>
            <div className="text-center">
              <div className="premium-card p-8 rounded-2xl">
                <p className="text-5xl lg:text-6xl font-bold gradient-text mb-2">SDG 12</p>
                <p className="text-gray-400 font-medium text-lg">Responsible Consumption</p>
                <p className="text-gray-500 text-sm mt-2">Sustainable production patterns</p>
              </div>
            </div>
            <div className="text-center">
              <div className="premium-card p-8 rounded-2xl">
                <p className="text-5xl lg:text-6xl font-bold gradient-text-purple mb-2">30%</p>
                <p className="text-gray-400 font-medium text-lg">Waste Reduction</p>
                <p className="text-gray-500 text-sm mt-2">Average user improvement</p>
              </div>
            </div>
          </div>
        </div>

        {/* CTA Section */}
        <div className="text-center py-16 lg:py-20">
          <h3 className="text-4xl lg:text-5xl font-bold text-white mb-6">
            Ready to Make a Difference?
          </h3>
          <p className="text-xl text-gray-400 mb-8 max-w-2xl mx-auto">
            Join thousands of users reducing food waste and building sustainable habits
          </p>
          <Link
            href="/register"
            className="btn-premium px-10 py-4 rounded-xl text-lg font-bold text-white inline-flex items-center gap-3 text-center"
          >
            Get Started Free
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
            </svg>
          </Link>
        </div>
      </div>

      {/* Footer */}
      <footer className="relative z-10 border-t border-gray-800 mt-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <p className="text-center text-gray-500">
            © 2025 FoodFlow. Building a sustainable future, one meal at a time.
          </p>
        </div>
      </footer>
    </div>
  );
}
