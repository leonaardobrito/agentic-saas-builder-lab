import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'StyleFlow - Autenticação',
  description: 'Sistema de gestão para salões de beleza e centros estéticos',
};

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 px-4 py-12">
      <div className="w-full max-w-md">
        {children}
      </div>
    </div>
  );
}
