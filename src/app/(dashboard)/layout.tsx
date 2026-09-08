'use client';

import { useAuth } from '@/providers/auth-provider';
import { useRouter, usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import Link from 'next/link';

const navItems = [
  { label: 'Education', href: '/education', icon: 'M12 14l9-5-9-5-9 5 9 5z M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z', gradient: 'from-blue-600 to-blue-400', bg: 'from-blue-700 to-blue-900', labelGradient: 'from-indigo-400 to-blue-400' },
  { label: 'Fraud Detection', href: '/fraud', icon: 'M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z', gradient: 'from-red-600 to-red-400', bg: 'from-red-700 to-red-900', labelGradient: 'from-red-400 to-pink-400' },
  { label: 'Budget', href: '/budget', icon: 'M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z', gradient: 'from-emerald-600 to-emerald-400', bg: 'from-emerald-700 to-emerald-900', labelGradient: 'from-emerald-400 to-teal-400' },
  { label: 'Documents', href: '/documents', icon: 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z', gradient: 'from-amber-600 to-amber-400', bg: 'from-amber-700 to-amber-900', labelGradient: 'from-violet-400 to-purple-400' },
  { label: 'Study Planner', href: '/study-planner', icon: 'M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253', gradient: 'from-violet-600 to-violet-400', bg: 'from-violet-700 to-violet-900', labelGradient: 'from-amber-400 to-orange-400' },
  { label: 'Finance', href: '/finance', icon: 'M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z', gradient: 'from-emerald-600 to-teal-400', bg: 'from-emerald-700 to-teal-900', labelGradient: 'from-emerald-400 to-teal-400' },
];

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { user, isLoading, isAuthenticated, logout } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/login?redirect=' + encodeURIComponent(window.location.pathname));
    }
  }, [isLoading, isAuthenticated, router]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen relative overflow-hidden" style={{ background: '#020617' }}>
        <div className="orb orb-1" />
        <div className="orb orb-2" />
        <div className="flex flex-col items-center gap-4 relative z-10">
          <div className="relative">
            <div className="animate-spin rounded-full h-10 w-10 border-2 border-blue-500/20" />
            <div className="animate-spin rounded-full h-10 w-10 border-2 border-t-transparent border-t-blue-500 absolute top-0" />
          </div>
          <span className="text-sm font-medium text-slate-400">Loading...</span>
        </div>
      </div>
    );
  }

  if (!isAuthenticated || !user) {
    return null;
  }

  function isActive(href: string) {
    return pathname === href || pathname.startsWith(href + '/');
  }

  return (
    <div className="flex min-h-screen relative" style={{ background: '#020617' }}>
      <div className="orb orb-1" />
      <div className="orb orb-2" />

      {sidebarOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 md:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      <aside className={`fixed md:sticky top-0 left-0 z-50 h-screen w-[260px] flex flex-col transform transition-transform duration-300 md:translate-x-0 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`} style={{ background: 'rgba(8, 13, 25, 0.95)', borderRight: '1px solid rgba(148, 163, 184, 0.08)', backdropFilter: 'blur(12px)' }}>
        <div className="p-4" style={{ borderBottom: '1px solid rgba(148, 163, 184, 0.08)' }}>
          <Link href="/education" className="flex items-center gap-3 group">
            <div className="w-9 h-9 rounded-lg flex items-center justify-center shadow-sm" style={{ background: 'linear-gradient(135deg, #3b82f6, #2563eb)' }}>
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
              </svg>
            </div>
            <div>
              <span className="text-sm font-bold text-white">EduGuard AI</span>
              <p className="text-[10px] font-medium -mt-0.5 text-slate-500">Education & Security</p>
            </div>
          </Link>
        </div>

        <nav className="flex-1 p-3 space-y-0.5 overflow-y-auto">
          {navItems.map((item) => {
            const active = isActive(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setSidebarOpen(false)}
                className={`sidebar-link ${active ? 'sidebar-link-active' : 'sidebar-link-inactive'}`}
              >
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all ${active ? 'bg-blue-500/15' : `bg-gradient-to-br ${item.bg}`}`}>
                  <svg className={`w-4 h-4 ${active ? 'text-blue-400' : 'text-white/70'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d={item.icon} />
                  </svg>
                </div>
                <span className={`text-sm ${active ? 'text-blue-400 font-semibold' : 'text-slate-400 font-medium'}`}>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        <div className="p-3" style={{ borderTop: '1px solid rgba(148, 163, 184, 0.08)' }}>
          {user.role === 'admin' && (
            <Link
              href="/admin"
              onClick={() => setSidebarOpen(false)}
              className={`sidebar-link mb-1 ${pathname.startsWith('/admin') ? 'sidebar-link-active' : 'text-slate-400 hover:text-slate-200'}`}
            >
              <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: pathname.startsWith('/admin') ? 'rgba(245, 158, 11, 0.12)' : 'rgba(30, 41, 59, 0.5)' }}>
                <svg className="w-4 h-4" style={{ color: pathname.startsWith('/admin') ? '#fbbf24' : '#94a3b8' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </div>
               <span className="text-sm text-slate-400 font-medium">Admin Panel</span>
            </Link>
          )}

          <Link
            href="/profile"
            onClick={() => setSidebarOpen(false)}
            className={`sidebar-link ${isActive('/profile') ? 'sidebar-link-active' : 'sidebar-link-inactive'}`}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
            <span className="text-sm text-slate-400 font-medium">Profile</span>
          </Link>

          <div className="mt-3 p-3 rounded-lg" style={{ background: 'rgba(15, 23, 42, 0.5)', border: '1px solid rgba(148, 163, 184, 0.08)' }}>
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #3b82f6, #2563eb)' }}>
                <span className="text-xs font-bold text-white">{user.name.charAt(0).toUpperCase()}</span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-white truncate">{user.name}</p>
                <p className="text-[11px] truncate text-slate-500">{user.email}</p>
              </div>
            </div>
            <button onClick={() => logout()} className="w-full mt-2 flex items-center justify-center gap-2 px-3 py-1.5 text-sm font-medium text-slate-400 hover:text-red-400 hover:bg-red-500/5 rounded-md transition-all">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
              Logout
            </button>
          </div>
        </div>
      </aside>

      <div className="flex-1 min-w-0 relative z-10">
        <div className="sticky top-0 z-30 md:hidden flex items-center gap-3 px-4 h-14" style={{ background: 'rgba(8, 13, 25, 0.95)', borderBottom: '1px solid rgba(148, 163, 184, 0.08)', backdropFilter: 'blur(12px)' }}>
          <button onClick={() => setSidebarOpen(true)} className="p-2 rounded-lg hover:bg-white/5 transition-all">
            <svg className="w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
          <span className="text-sm font-bold text-white">EduGuard AI</span>
        </div>

        <main className="p-4 md:p-6 lg:p-8 overflow-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
