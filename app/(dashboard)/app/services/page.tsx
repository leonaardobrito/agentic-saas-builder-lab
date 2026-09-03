/**
 * Services management page.
 *
 * Server Component — fetches the service list for the current tenant
 * and renders a client-side form for creation.
 */
import { listServicesAction } from '@/features/services/presentation/actions';
import { createServerClient } from '@/lib/supabase/server';
import { getTenantContext } from '@/lib/auth/context';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/ui/card';
import { ServiceForm } from '@/features/services/presentation/components/service-form';

export default async function ServicesPage() {
  const supabase = await createServerClient();
  const ctx = await getTenantContext(supabase);

  const canManage = ctx && ['owner', 'admin', 'manager'].includes(ctx.role);

  const result = await listServicesAction();
  const services = result.success ? result.data : [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-slate-800">Serviços</h1>
      </div>

      {canManage && <ServiceForm mode="create" />}

      {services.length === 0 ? (
        <Card>
          <CardContent className="pt-6">
            <p className="text-slate-500">Nenhum serviço cadastrado.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {services.map((svc) => (
            <Card key={svc.id}>
              <CardHeader>
                <CardTitle>{svc.name}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-slate-500">
                  {svc.category && `Categoria: ${svc.category} | `}
                  Preço: R$ {svc.price.toFixed(2)} |
                  Duração: {svc.durationMinutes} min
                </p>
                <p className="text-sm text-slate-500">
                  Status: {svc.active ? 'Ativo' : 'Inativo'}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
