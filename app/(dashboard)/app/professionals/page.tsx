/**
 * Professionals management page.
 *
 * Server Component — fetches the professional list and renders a
 * client-side form for creation/edition. RBAC visibility is enforced
 * server-side; the client only filters for UX.
 */
import { listProfessionalsAction } from '@/features/professionals/presentation/actions';
import { createServerClient } from '@/lib/supabase/server';
import { getTenantContext } from '@/lib/auth/context';
import { Button } from '@/shared/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/ui/card';
import { ProfessionalForm } from '@/features/professionals/presentation/components/professional-form';

export default async function ProfessionalsPage() {
  const supabase = await createServerClient();
  const ctx = await getTenantContext(supabase);

  const canManage = ctx && ['owner', 'admin', 'manager'].includes(ctx.role);
  const canDelete = ctx && ['owner', 'admin'].includes(ctx.role);

  const result = await listProfessionalsAction();

  const professionals = result.success ? result.data : [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-slate-800">Profissionais</h1>
        {canManage && <ProfessionalForm mode="create" />}
      </div>

      {professionals.length === 0 ? (
        <Card>
          <CardContent className="pt-6">
            <p className="text-slate-500">Nenhum profissional cadastrado.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {professionals.map((prof) => (
            <Card key={prof.id}>
              <CardHeader>
                <CardTitle>{prof.name}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-slate-500">
                  Status: {prof.active ? 'Ativo' : 'Inativo'}
                </p>
                {canDelete && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="mt-2"
                  >
                    {prof.active ? 'Desativar' : 'Ativar'}
                  </Button>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

