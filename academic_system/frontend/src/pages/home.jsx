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
    <div
      className="min-h-screen bg-cover bg-center bg-no-repeat relative"
      style={{ backgroundImage: `url(${clgBg})` }}
    >
      <div className="absolute inset-0 bg-white/35 backdrop-blur-[2px]" />

      <div className="relative z-10 flex min-h-screen flex-col">
        <header className="px-4 pt-4 md:px-6 md:pt-6">
          <div className="mx-auto flex max-w-7xl items-center justify-between gap-6 rounded-[28px] border border-white/70 bg-white/90 px-5 py-4 shadow-xl shadow-slate-900/10 backdrop-blur-xl md:px-8">
            <Link to="/" className="flex items-center gap-3">
              <img
                src={nitLogo}
                alt="National Institute of Technology, Srinagar Logo"
                className="h-12 w-auto md:h-14"
              />
              <div>
                <p className="text-lg font-black uppercase tracking-[0.12em] text-slate-900 md:text-xl">
                  Academic Portal
                </p>
                <p className="text-xs font-medium text-slate-500 md:text-sm">
                  National Institute of Technology, Srinagar
                </p>
              </div>
            </Link>

            <nav className="hidden items-center gap-8 md:flex">
              <a href="#features" className="text-sm font-semibold text-slate-700 transition-colors hover:text-[#1266f1]">
                Features
              </a>
              <a href="#highlights" className="text-sm font-semibold text-slate-700 transition-colors hover:text-[#1266f1]">
                Highlights
              </a>
              <Link
                to="/login?mode=register"
                className="rounded-2xl bg-[#5a67d8] px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-[#5a67d8]/30 transition-all duration-300 hover:-translate-y-0.5 hover:bg-[#4957cf]"
              >
                Register
              </Link>
              <Link
                to="/login"
                className="text-sm font-semibold text-slate-900 transition-colors hover:text-[#1266f1]"
              >
                Log In
              </Link>
            </nav>

            <div className="flex items-center gap-2 md:hidden">
              <Link
                to="/login?mode=register"
                className="rounded-xl bg-[#5a67d8] px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-[#5a67d8]/30"
              >
                Register
              </Link>
              <Link
                to="/login"
                className="rounded-xl border border-slate-200 bg-white/80 px-4 py-2 text-sm font-semibold text-slate-900"
              >
                Log In
              </Link>
            </div>
          </div>
        </header>

        <main className="flex-1 px-4 pb-10 pt-6 md:px-6 md:pt-8">
          <section className="mx-auto max-w-7xl overflow-hidden rounded-[36px] border border-white/50 bg-white/75 shadow-2xl shadow-slate-900/10 backdrop-blur-xl">
            <div className="grid gap-10 px-6 py-10 md:px-10 md:py-14 lg:grid-cols-[1.05fr_0.95fr] lg:items-center lg:px-14">
              <div className="max-w-2xl">
                <div className="inline-flex items-center gap-2 rounded-full border border-[#1266f1]/20 bg-[#1266f1]/10 px-4 py-2 text-sm font-semibold text-[#0d52d1]">
                  <ShieldCheck className="h-4 w-4" />
                  Built for organized academic operations
                </div>

                <h1 className="mt-6 text-4xl font-black leading-tight text-slate-900 md:text-5xl lg:text-6xl">
                  Manage campus academics with one
                  <span className="block text-[#3f54d9]">smart, connected portal</span>
                </h1>

                <p className="mt-6 max-w-xl text-base leading-8 text-slate-600 md:text-lg">
                  Automate timetable generation, maintain attendance with tracked records,
                  and let faculty upload study materials that students can access anytime.
                </p>

                <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                  <Link
                    to="/login"
                    className="inline-flex items-center justify-center gap-2 rounded-2xl bg-[#4b5fd1] px-6 py-4 text-base font-semibold text-white shadow-xl shadow-[#4b5fd1]/30 transition-all duration-300 hover:-translate-y-1 hover:bg-[#3f54d9]"
                  >
                    Log In
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                  <Link
                    to="/login?mode=register"
                    className="inline-flex items-center justify-center rounded-2xl border border-slate-200 bg-white/80 px-6 py-4 text-base font-semibold text-slate-900 transition-all duration-300 hover:-translate-y-1 hover:border-[#1266f1] hover:text-[#1266f1]"
                  >
                    Create Account
                  </Link>
                </div>

                <div className="mt-8 grid gap-3 sm:grid-cols-3">
                  {quickPoints.map((point) => (
                    <div
                      key={point}
                      className="rounded-2xl border border-white/70 bg-white/70 px-4 py-4 text-sm font-medium leading-6 text-slate-700 shadow-sm"
                    >
                      {point}
                    </div>
                  ))}
                </div>
              </div>

              <div className="relative min-h-[420px]">
                <div
                  className="absolute inset-0 rounded-[32px] bg-cover bg-center"
                  style={{ backgroundImage: `url(${clgBg})` }}
                />
                <div className="absolute inset-0 rounded-[32px] bg-[linear-gradient(180deg,rgba(15,23,42,0.18),rgba(37,99,235,0.78))]" />
                <div className="relative flex h-full flex-col justify-between rounded-[32px] border border-white/25 p-6 text-white shadow-2xl shadow-slate-900/20 md:p-8">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="text-sm font-semibold uppercase tracking-[0.2em] text-blue-100/90">
                        Campus Workflow
                      </p>
                      <h2 className="mt-3 text-3xl font-black leading-tight">
                        One portal for schedules, records, and resources
                      </h2>
                    </div>
                    <div className="rounded-2xl bg-white/15 px-4 py-2 text-sm font-semibold backdrop-blur-sm">
                      NIT Srinagar
                    </div>
                  </div>

                  <div className="grid gap-4">
                    {featureCards.map(({ icon: Icon, title, description }) => (
                      <div
                        key={title}
                        className="rounded-[24px] border border-white/20 bg-white/12 p-4 backdrop-blur-md transition-transform duration-300 hover:-translate-y-1"
                      >
                        <div className="flex items-start gap-3">
                          <div className="rounded-2xl bg-white/20 p-3">
                            <Icon className="h-5 w-5" />
                          </div>
                          <div>
                            <h3 className="text-base font-bold">{title}</h3>
                            <p className="mt-1 text-sm leading-6 text-blue-50/90">{description}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </section>

          <section
            id="highlights"
            className="mx-auto mt-6 max-w-7xl overflow-hidden rounded-[32px] bg-[radial-gradient(circle_at_top,rgba(129,140,248,0.45),rgba(55,65,185,0.96))] text-white shadow-2xl shadow-slate-900/10"
          >
            <div className="px-6 py-10 md:px-10">
              <p className="text-center text-2xl font-black uppercase tracking-[0.16em] text-white/95 md:text-3xl">
                Academic Workflows, Simplified
              </p>
              <div className="mt-8 grid gap-6 md:grid-cols-3">
                {highlights.map(({ icon: Icon, value, label }) => (
                  <div
                    key={value}
                    className="rounded-[26px] border border-white/20 bg-white/10 px-6 py-6 text-center backdrop-blur-sm"
                  >
                    <Icon className="mx-auto h-8 w-8 text-blue-100" />
                    <p className="mt-4 text-2xl font-black">{value}</p>
                    <p className="mt-2 text-sm font-medium leading-6 text-blue-50/90">{label}</p>
                  </div>
                ))}
              </div>
            </div>
          </section>

          <section
            id="features"
            className="mx-auto mt-6 grid max-w-7xl gap-6 md:grid-cols-3"
          >
            {featureCards.map(({ icon: Icon, title, description }) => (
              <article
                key={title}
                className="rounded-[28px] border border-white/60 bg-white/80 p-6 shadow-xl shadow-slate-900/5 backdrop-blur-xl transition-transform duration-300 hover:-translate-y-1"
              >
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#1266f1]/10 text-[#1266f1]">
                  <Icon className="h-6 w-6" />
                </div>
                <h3 className="mt-5 text-xl font-black text-slate-900">{title}</h3>
                <p className="mt-3 text-sm leading-7 text-slate-600">{description}</p>
              </article>
            ))}
          </section>
        </main>

        <footer className="bg-white py-2 text-center shadow-lg">
          <p className="text-sm font-semibold text-gray-900">
            National Institute of Technology, Srinagar &copy; {new Date().getFullYear()} - All rights reserved.
          </p>
        </footer>
      </div>
    </div>
  );
}
