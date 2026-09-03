/**
 * Dashboard Layout
 *
 * Layout protegido que requer autenticação.
 * O middleware já garante que apenas usuários autenticados acessem esta rota.
 */
'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/shared/lib/utils';

const navItems = [
  { href: '/app/dashboard', label: 'Dashboard' },
  { href: '/app/profissionais', label: 'Profissionais' },
  { href: '/app/servicos', label: 'Serviços' },
  { href: '/app/clientes', label: 'Clientes' },
];

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-slate-900 text-white p-4">
        <div className="container mx-auto flex items-center justify-between">
          <h1 className="text-xl font-semibold">StyleFlow</h1>
          <nav className="flex items-center space-x-4 text-sm">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'text-slate-300 hover:text-white transition-colors',
                  pathname === item.href && 'text-white font-medium',
                )}
              >
                {item.label}
              </Link>
            ))}
          </nav>
        </div>
      </header>
      <main className="container mx-auto p-4">{children}</main>
    </div>
  );
}
