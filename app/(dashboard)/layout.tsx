/**
 * Dashboard Layout
 * 
 * Layout protegido que requer autenticação.
 * O middleware já garante que apenas usuários autenticados acessem esta rota.
 */
export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-slate-900 text-white p-4">
        <div className="container mx-auto">
          <h1 className="text-xl font-semibold">StyleFlow</h1>
        </div>
      </header>
      <main className="container mx-auto p-4">
        {children}
      </main>
    </div>
  );
}
