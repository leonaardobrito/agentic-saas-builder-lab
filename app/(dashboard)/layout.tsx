'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/shared/lib/utils';
import { LayoutDashboard, Users, Scissors, UserCircle, LogOut } from 'lucide-react';
import { signOutAction } from '@/features/auth/presentation/actions';

const navItems = [
  { href: '/app/dashboard', label: 'Dashboard', shortLabel: 'Inicio', icon: LayoutDashboard },
  { href: '/app/professionals', label: 'Profissionais', shortLabel: 'Equipe', icon: Users },
  { href: '/app/services', label: 'Servicos', shortLabel: 'Servicos', icon: Scissors },
  { href: '/app/customers', label: 'Clientes', shortLabel: 'Clientes', icon: UserCircle },
];

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
      {/* ── Top Header ── */}
      <header className="fixed top-0 left-0 right-0 h-16 z-30 bg-white/80 dark:bg-slate-950/80 backdrop-blur-md border-b border-slate-200 dark:border-slate-800">
        <div className="flex items-center justify-between h-full px-4 sm:px-6 lg:px-8 max-w-screen-2xl mx-auto">
          <Link href="/app/dashboard" className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-rose-600 to-pink-600 flex items-center justify-center text-white shadow-md shadow-rose-600/20">
              <Scissors className="w-4 h-4" />
            </div>
            <span className="text-lg font-bold text-slate-900 dark:text-white tracking-tight hidden sm:inline">
              StyleFlow
            </span>
          </Link>

          {/* Desktop nav */}
          <nav className="hidden md:flex items-center gap-1">
            {navItems.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    'flex items-center gap-2 px-3.5 py-2 rounded-xl text-sm transition-colors',
                    isActive
                      ? 'font-bold text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/30'
                      : 'font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/60 hover:text-slate-900 dark:hover:text-slate-100',
                  )}
                >
                  <item.icon className="w-5 h-5" />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>

          {/* Desktop logout */}
          <form action={signOutAction} className="hidden md:block">
            <button
              type="submit"
              className="flex items-center gap-2 px-3.5 py-2 rounded-xl text-sm font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/60 hover:text-slate-900 dark:hover:text-slate-100 transition-colors"
              aria-label="Sair"
            >
              <LogOut className="w-5 h-5" />
              <span>Sair</span>
            </button>
          </form>
        </div>
      </header>

      {/* ── Main Content ── */}
      <main className="pt-16 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {children}
      </main>

      {/* ── Mobile Bottom Navigation ── */}
      <nav className="fixed bottom-0 left-0 right-0 h-16 z-40 bg-white/95 dark:bg-slate-950/95 border-t border-slate-200 dark:border-slate-800 backdrop-blur-md flex items-center justify-around px-2 md:hidden">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex flex-col items-center justify-center w-16 h-16 rounded-xl transition-colors',
                isActive
                  ? 'text-rose-600 dark:text-rose-400'
                  : 'text-slate-400 dark:text-slate-500',
              )}
            >
              <item.icon className="w-5 h-5 mb-0.5" />
              <span className="text-[10px] font-bold uppercase tracking-wider whitespace-nowrap">
                {item.shortLabel}
              </span>
            </Link>
          );
        })}
      </nav>

      {/* Bottom nav spacer for mobile */}
      <div className="h-16 md:hidden" />
    </div>
  );
}
