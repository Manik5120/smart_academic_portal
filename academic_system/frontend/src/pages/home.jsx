import { Link } from 'react-router-dom';
import {
  ArrowRight,
  BookOpenText,
  CalendarDays,
  ClipboardCheck,
  FileClock,
  ShieldCheck,
  Sparkles,
  Users,
} from 'lucide-react';
import nitLogo from '../../../uploads/National_Institute_of_Technology,_Srinagar_Logo.png';
import clgBg from '../../../uploads/clg_bg.webp';

const featureCards = [
  {
    icon: CalendarDays,
    title: 'Automated Timetable Generation',
    description:
      'Generate class schedules faster using faculty assignments and availability so the weekly timetable is easier to manage.',
  },
  {
    icon: ClipboardCheck,
    title: 'Attendance Maintenance & Tracking',
    description:
      'Faculty can maintain attendance daily while the system keeps records organized for reports, review, and follow-up.',
  },
  {
    icon: BookOpenText,
    title: 'Study Materials for Students',
    description:
      'Faculty upload notes, resources, and reference files in one place so students can access them whenever they need.',
  },
];

const highlights = [
  {
    icon: Sparkles,
    value: 'One Smart Portal',
    label: 'Timetable, attendance, and materials managed together',
  },
  {
    icon: FileClock,
    value: 'Tracked Records',
    label: 'Attendance history stays organized for every class',
  },
  {
    icon: Users,
    value: 'Faculty & Students',
    label: 'Built for smooth day-to-day academic coordination',
  },
];

const quickPoints = [
  'Faculty can manage subject work from one dashboard.',
  'Students get quick access to schedules and uploaded resources.',
  'Academic records stay cleaner, faster, and easier to review.',
];

export default function HomePage() {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* Header - Clean, professional navigation */}
      <header className="bg-white border-b border-slate-200">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4 md:px-6">
          <Link to="/" className="flex items-center gap-3">
            <img
              src={nitLogo}
              alt="National Institute of Technology, Srinagar Logo"
              className="h-10 w-auto md:h-12"
            />
            <div>
              <p className="text-base font-bold text-slate-900 md:text-lg">
                Academic Portal
              </p>
              <p className="text-xs text-slate-500">
                NIT Srinagar
              </p>
            </div>
          </Link>

          <nav className="hidden items-center gap-6 md:flex">
            <a href="#features" className="text-sm text-slate-600 transition-colors hover:text-slate-900">
              Features
            </a>
            <Link
              to="/login"
              className="text-sm font-medium text-slate-900 transition-colors hover:text-blue-700"
            >
              Log In
            </Link>
            <Link
              to="/login?mode=register"
              className="rounded-lg bg-blue-700 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-800"
            >
              Register
            </Link>
          </nav>

          <Link
            to="/login"
            className="rounded-lg bg-blue-700 px-4 py-2 text-sm font-medium text-white md:hidden"
          >
            Log In
          </Link>
        </div>
      </header>

      {/* Hero Section - Clean, focused */}
      <main className="flex-1">
        <section className="mx-auto max-w-6xl px-4 py-16 md:px-6 md:py-24">
          <div className="grid gap-12 lg:grid-cols-2 lg:gap-16">
            <div>
              <h1 className="text-3xl font-bold text-slate-900 md:text-4xl lg:text-5xl">
                Academic Management Portal
              </h1>
              <p className="mt-4 text-lg text-slate-600">
                Streamline timetable generation, attendance tracking, and study materials—
                all in one place for faculty and students.
              </p>

              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <Link
                  to="/login"
                  className="inline-flex items-center justify-center gap-2 rounded-lg bg-blue-700 px-6 py-3 text-base font-medium text-white transition-colors hover:bg-blue-800"
                >
                  Log In
                  <ArrowRight className="h-4 w-4" />
                </Link>
                <Link
                  to="/login?mode=register"
                  className="inline-flex items-center justify-center rounded-lg border border-slate-300 bg-white px-6 py-3 text-base font-medium text-slate-700 transition-colors hover:bg-slate-50"
                >
                  Create Account
                </Link>
              </div>
            </div>

            <div className="overflow-hidden rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
              <img
                src={clgBg}
                alt="NIT Srinagar Campus"
                className="h-64 w-full object-cover md:h-80"
              />
              <div className="mt-4">
                <p className="text-sm font-medium text-slate-500">National Institute of Technology</p>
                <p className="text-lg font-semibold text-slate-900">Srinagar, Jammu & Kashmir</p>
              </div>
            </div>
          </div>
        </section>

        {/* Features Section - Clean cards */}
        <section id="features" className="border-t border-slate-200 bg-white">
          <div className="mx-auto max-w-6xl px-4 py-16 md:px-6">
            <h2 className="text-2xl font-bold text-slate-900 md:text-3xl">
              Key Features
            </h2>
            <div className="mt-8 grid gap-6 md:grid-cols-3">
              {featureCards.map(({ icon: Icon, title, description }) => (
                <article
                  key={title}
                  className="rounded-lg border border-slate-200 bg-white p-6 transition-colors hover:border-slate-300 hover:bg-slate-50"
                >
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-50 text-blue-700">
                    <Icon className="h-5 w-5" />
                  </div>
                  <h3 className="mt-4 text-lg font-semibold text-slate-900">{title}</h3>
                  <p className="mt-2 text-sm text-slate-600">{description}</p>
                </article>
              ))}
            </div>
          </div>
        </section>
      </main>

      {/* Footer - Simple */}
      <footer className="border-t border-slate-200 bg-white py-6">
        <p className="text-center text-sm text-slate-600">
          &copy; {new Date().getFullYear()} National Institute of Technology, Srinagar. All rights reserved.
        </p>
      </footer>
    </div>
  );
}
