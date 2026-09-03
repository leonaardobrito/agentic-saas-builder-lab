import { signOutAction } from '@/features/auth/presentation/actions';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

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
