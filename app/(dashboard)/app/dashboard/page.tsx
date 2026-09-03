import Link from 'next/link';
import { signOutAction } from '@/features/auth/presentation/actions';
import { Button } from '@/shared/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/ui/card';

/**
 * Dashboard Page
 *
 * Página principal do dashboard após login.
 */
export default function DashboardPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-slate-800">Dashboard</h1>
        <form action={signOutAction}>
          <Button type="submit" variant="outline">
            Sair
          </Button>
        </form>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Link href="/app/professionais">
          <Card className="cursor-pointer hover:shadow-md transition-shadow">
            <CardHeader>
              <CardTitle>Profissionais</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-slate-500">
                Gerencie a equipe do seu salão.
              </p>
            </CardContent>
          </Card>
        </Link>
        <Link href="/app/servicos">
          <Card className="cursor-pointer hover:shadow-md transition-shadow">
            <CardHeader>
              <CardTitle>Serviços</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-slate-500">
                Catálogo de serviços e preços.
              </p>
            </CardContent>
          </Card>
        </Link>
        <Link href="/app/clientes">
          <Card className="cursor-pointer hover:shadow-md transition-shadow">
            <CardHeader>
              <CardTitle>Clientes</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-slate-500">
                Base de clientes e histórico.
              </p>
            </CardContent>
          </Card>
        </Link>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Bem-vindo ao StyleFlow!</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-slate-600">
            Seu sistema de gestão para salões de beleza está pronto para uso.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
