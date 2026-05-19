import { Link } from 'react-router-dom';

const DumbbellIcon = () => (
  <svg className="w-12 h-12 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 6h2v12H3zm16 0h2v12h-2zM7 8v8M17 8v8M9 6v12M15 6v12M11 8h2v8h-2z" />
  </svg>
);

const ChartIcon = () => (
  <svg className="w-12 h-12 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
  </svg>
);

const TargetIcon = () => (
  <svg className="w-12 h-12 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
  </svg>
);

export default function LandingPage() {
  const features = [
    {
      icon: <DumbbellIcon />,
      title: 'Smart Workout Plans',
      description: 'Personalized exercise routines designed for muscle gain and strength building.',
    },
    {
      icon: <ChartIcon />,
      title: 'Progress Tracking',
      description: 'Monitor your weight, measurements, and workout achievements in real-time.',
    },
    {
      icon: <TargetIcon />,
      title: 'Goal-Driven Approach',
      description: 'Tailored programs specifically for underweight users to reach healthy BMI.',
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 via-slate-900 to-slate-800">
      {/* Hero Section */}
      <section className="max-w-6xl mx-auto px-6 py-20 flex flex-col gap-8 items-center justify-center text-center">
        <div className="flex items-center justify-center w-16 h-16 rounded-lg bg-gradient-to-br from-emerald-500 to-emerald-600 text-white">
          <svg width="36" height="36" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
            <path d="M8 20C8 12.27 12.27 8 20 8C27.73 8 32 12.27 32 20C32 27.73 27.73 32 20 32C12.27 32 8 27.73 8 20Z" stroke="currentColor" strokeWidth="2" fill="none"/>
            <path d="M20 14V26M14 20H26" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"/>
          </svg>
        </div>

        <div>
          <h1 className="text-5xl md:text-6xl font-bold mb-4">
            <span className="text-slate-100">Welcome to </span>
            <span className="bg-gradient-to-r from-emerald-400 to-emerald-600 bg-clip-text text-transparent">
              FitGainer
            </span>
          </h1>
          <p className="text-xl md:text-2xl text-slate-400 max-w-2xl mx-auto">
            Your personal fitness journey for gaining muscle and building strength.
          </p>
        </div>

        <p className="text-lg text-slate-300 max-w-2xl">
          FitGainer is designed specifically for underweight users (BMI &lt; 18.5) who want to gain weight healthily and build muscle.
          Get personalized workout plans, track your progress, and receive guidance from our AI fitness coach.
        </p>

        <div className="flex gap-4 justify-center pt-4">
          <Link
            to="/register"
            className="px-8 py-3 text-lg font-semibold text-white rounded-lg bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 transition-all duration-200 no-underline shadow-lg hover:shadow-xl hover:-translate-y-px"
          >
            Get Started
          </Link>
          <Link
            to="/login"
            className="px-8 py-3 text-lg font-semibold text-emerald-400 rounded-lg border-2 border-emerald-400 hover:bg-emerald-500/10 transition-colors duration-200 no-underline"
          >
            Already Signed Up? Login
          </Link>
        </div>
      </section>

      {/* Features Section */}
      <section className="max-w-6xl mx-auto px-6 py-20">
        <h2 className="text-4xl font-bold text-center text-slate-100 mb-16">
          Why Choose FitGainer?
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature, idx) => (
            <div
              key={idx}
              className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-lg p-8 border border-slate-700 hover:border-emerald-500/30 transition-all duration-300 hover:shadow-lg hover:shadow-emerald-500/10"
            >
              <div className="mb-4">{feature.icon}</div>
              <h3 className="text-xl font-semibold text-slate-100 mb-3">
                {feature.title}
              </h3>
              <p className="text-slate-400 text-sm leading-relaxed">
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Benefits Section */}
      <section className="max-w-6xl mx-auto px-6 py-20">
        <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-lg p-12 border border-slate-700">
          <h2 className="text-3xl font-bold text-slate-100 mb-8">
            Who Is FitGainer For?
          </h2>
          <ul className="space-y-4 text-slate-300 text-lg">
            <li className="flex items-start gap-4">
              <span className="text-emerald-400 font-bold text-2xl mt-1">✓</span>
              <span>
                <strong>Underweight individuals</strong> (BMI &lt; 18.5) looking to gain weight healthily
              </span>
            </li>
            <li className="flex items-start gap-4">
              <span className="text-emerald-400 font-bold text-2xl mt-1">✓</span>
              <span>
                <strong>Fitness beginners</strong> seeking guidance on workout routines and nutrition
              </span>
            </li>
            <li className="flex items-start gap-4">
              <span className="text-emerald-400 font-bold text-2xl mt-1">✓</span>
              <span>
                <strong>Goal-oriented users</strong> who want to track progress and stay motivated
              </span>
            </li>
          </ul>
        </div>
      </section>

      {/* CTA Section */}
      <section className="max-w-4xl mx-auto px-6 py-20 text-center">
        <h2 className="text-3xl md:text-4xl font-bold text-slate-100 mb-6">
          Ready to Transform Your Fitness?
        </h2>
        <p className="text-xl text-slate-400 mb-8">
          Start your weight gain and muscle-building journey with personalized workout plans and progress tracking.
        </p>
        <div className="flex gap-4 justify-center">
          <Link
            to="/register"
            className="px-8 py-3 text-lg font-semibold text-white rounded-lg bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 transition-all duration-200 no-underline shadow-lg hover:shadow-xl hover:-translate-y-px"
          >
            Start Now
          </Link>
          <Link
            to="/login"
            className="px-8 py-3 text-lg font-semibold text-emerald-400 rounded-lg border-2 border-emerald-400 hover:bg-emerald-500/10 transition-colors duration-200 no-underline"
          >
            Sign In
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-700 mt-20">
        <div className="max-w-6xl mx-auto px-6 py-8 text-center text-slate-400 text-sm">
          <p>© 2026 FitGainer. All rights reserved. • Building healthier, stronger communities.</p>
        </div>
      </footer>
    </div>
  );
}
