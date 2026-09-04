import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'StyleFlow - Autenticacao',
  description: 'Sistema de gestao para saloes de beleza e centros esteticos',
};

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950 px-4 py-12">
      <div className="w-full max-w-md">
        {children}
      </div>
    </div>
  );
}
